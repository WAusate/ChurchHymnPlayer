import { useEffect, useState } from 'react';
import { pwaManager, PWAUpdateInfo } from '@/lib/pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PWAPrefetchManager() {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [hasPrefetched, setHasPrefetched] = useState(false);

  useEffect(() => {
    const prefetchKey = 'pwa_hymns_prefetched';
    const alreadyPrefetched = localStorage.getItem(prefetchKey) === 'true';
    
    if (alreadyPrefetched) {
      setHasPrefetched(true);
      return;
    }

    if (navigator.onLine && 'serviceWorker' in navigator) {
      const timer = setTimeout(async () => {
        setIsPrefetching(true);
        try {
          await pwaManager.prefetchHymns();
          localStorage.setItem(prefetchKey, 'true');
          setHasPrefetched(true);
        } catch (error) {
          console.error('[PWA] Prefetch failed:', error);
        } finally {
          setIsPrefetching(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}

export function PWAUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    pwaManager.register().then(() => {
      console.log('[PWA] Service Worker registration complete');
    });

    pwaManager.onUpdate((info) => {
      setUpdateInfo(info);
      if (info.hasUpdate) {
        toast({
          title: 'Nova atualização disponível',
          description: 'Uma nova versão do app está pronta para ser instalada.',
        });
      }
    });

    let messageHandler: ((event: MessageEvent) => Promise<void>) | null = null;
    
    if ('serviceWorker' in navigator) {
      messageHandler = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'HYMNS_UPDATED') {
          console.log('[PWA] Received HYMNS_UPDATED broadcast');
          toast({
            title: 'Novos hinos disponíveis',
            description: 'Baixando novos hinos automaticamente...',
          });
          
          try {
            localStorage.removeItem('pwa_hymns_prefetched');
            await pwaManager.prefetchHymns();
            localStorage.setItem('pwa_hymns_prefetched', 'true');
            toast({
              title: 'Hinos atualizados!',
              description: 'Os novos hinos foram baixados. Recarregando...',
            });
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error('[PWA] Error prefetching after broadcast:', error);
          }
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
    }

    pwaManager.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        toast({
          title: 'Você está online',
          description: 'Conexão com a internet restaurada.',
        });
      } else {
        toast({
          title: 'Você está offline',
          description: 'O app continuará funcionando com o conteúdo em cache.',
          variant: 'destructive',
        });
      }
    });

    const checkInterval = setInterval(async () => {
      if (navigator.onLine) {
        const hasUpdates = await pwaManager.checkForUpdates();
        if (hasUpdates) {
          console.log('[PWA] New hymns detected, prefetching...');
          toast({
            title: 'Novos hinos disponíveis',
            description: 'Baixando novos hinos automaticamente...',
          });
          localStorage.removeItem('pwa_hymns_prefetched');
          await pwaManager.prefetchHymns();
          localStorage.setItem('pwa_hymns_prefetched', 'true');
          toast({
            title: 'Hinos atualizados!',
            description: 'Os novos hinos foram baixados e estão prontos para uso.',
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      if (messageHandler && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      }
      clearInterval(checkInterval);
    };
  }, [toast]);

  const handleUpdate = () => {
    pwaManager.activateUpdate();
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await pwaManager.checkForUpdates();
      toast({
        title: 'Verificação concluída',
        description: updateInfo?.hasUpdate 
          ? 'Há uma atualização disponível!' 
          : 'Você está usando a versão mais recente.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao verificar atualizações',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  if (!updateInfo?.hasUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm" data-testid="pwa-update-prompt">
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Nova Versão Disponível
          </CardTitle>
          <CardDescription>
            Uma atualização está pronta para ser instalada
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button 
            onClick={handleUpdate}
            className="flex-1"
            data-testid="button-update-pwa"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Agora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PWAStatusBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    pwaManager.onOnlineStatusChange(setIsOnline);
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-yellow-500 text-black py-2 px-4 text-center text-sm font-medium z-50 flex items-center justify-center gap-2"
      data-testid="pwa-offline-banner"
    >
      <WifiOff className="h-4 w-4" />
      Modo Offline - Usando conteúdo em cache
    </div>
  );
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm" data-testid="pwa-install-prompt">
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Instalar Belém Play
          </CardTitle>
          <CardDescription>
            Instale o app na sua tela inicial para acesso rápido e uso offline
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button 
            onClick={handleInstall}
            className="flex-1"
            data-testid="button-install-pwa"
          >
            Instalar
          </Button>
          <Button 
            onClick={handleDismiss}
            variant="outline"
            data-testid="button-dismiss-install"
          >
            Agora Não
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
