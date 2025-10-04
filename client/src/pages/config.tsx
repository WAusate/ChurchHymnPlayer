import Layout from "@/components/layout";
import FirebaseAdmin from "@/components/firebase-admin";
import { FirebaseConfigWarning } from "@/lib/firebase-check";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocation } from "wouter";
import { LogOut, RefreshCw, Trash2, HardDrive, Download } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { pwaManager, checkStorageQuota } from "@/lib/pwa";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function ConfigContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const quota = await checkStorageQuota();
    setStorageInfo(quota);
    
    const size = await pwaManager.getCacheSize();
    setCacheSize(size);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const hasUpdates = await pwaManager.checkForUpdates();
      
      if (hasUpdates) {
        toast({
          title: 'Atualizações encontradas!',
          description: 'Baixando novos hinos automaticamente...',
        });
        
        localStorage.removeItem('pwa_hymns_prefetched');
        await pwaManager.prefetchHymns();
        await loadStorageInfo();
        localStorage.setItem('pwa_hymns_prefetched', 'true');
        
        toast({
          title: 'Hinos atualizados!',
          description: 'Os novos hinos foram baixados. O app será recarregado.',
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: 'Verificação concluída',
          description: 'Você está usando a versão mais recente.',
        });
      }
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

  const handlePrefetchHymns = async () => {
    setIsPrefetching(true);
    try {
      await pwaManager.prefetchHymns();
      await loadStorageInfo();
      toast({
        title: 'Download concluído',
        description: 'Todos os hinos foram baixados para uso offline.',
      });
      localStorage.setItem('pwa_hymns_prefetched', 'true');
    } catch (error) {
      toast({
        title: 'Erro ao baixar hinos',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Tem certeza que deseja limpar todo o cache? Isso removerá todos os hinos salvos offline.')) {
      return;
    }

    setIsClearingCache(true);
    try {
      await pwaManager.clearCache();
      await loadStorageInfo();
      toast({
        title: 'Cache limpo',
        description: 'Todo o conteúdo em cache foi removido.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: 'Erro ao limpar cache',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Layout title="Adicionar Hinos" showBackButton>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Informações do usuário */}
        <div className="flex justify-end items-center">
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                <strong>Usuário:</strong> {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>

        {/* Aviso de configuração do Firebase (se necessário) */}
        <FirebaseConfigWarning />

        {/* Configurações PWA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Configurações do App
            </CardTitle>
            <CardDescription>
              Gerencie o cache offline e atualizações do app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status de armazenamento */}
            {storageInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Armazenamento usado
                  </span>
                  <span className="font-medium">
                    {formatBytes(cacheSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Espaço disponível</span>
                  <span>{formatBytes(storageInfo.quota - storageInfo.usage)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(cacheSize / storageInfo.quota) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handlePrefetchHymns}
                disabled={isPrefetching}
                variant="default"
                className="w-full"
                data-testid="button-download-hymns"
              >
                <Download className={`h-4 w-4 mr-2 ${isPrefetching ? 'animate-bounce' : ''}`} />
                {isPrefetching ? 'Baixando...' : 'Baixar Todos os Hinos'}
              </Button>

              <Button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdates}
                variant="outline"
                className="w-full"
                data-testid="button-check-updates"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                {isCheckingUpdates ? 'Verificando...' : 'Verificar Atualizações'}
              </Button>

              <Button
                onClick={handleClearCache}
                disabled={isClearingCache}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50 md:col-span-2"
                data-testid="button-clear-cache"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isClearingCache ? 'Limpando...' : 'Limpar Cache'}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              O app funciona offline armazenando os hinos em cache. 
              Verificamos automaticamente por atualizações a cada 5 minutos quando você está online.
            </p>
          </CardContent>
        </Card>

        {/* Formulário de adicionar hino */}
        <div className="flex justify-center">
          {isFirebaseConfigured ? (
            <FirebaseAdmin />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-church-primary">
                  Adicionar Hino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Configure o Firebase para poder adicionar hinos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function Config() {
  return (
    <ProtectedRoute>
      <ConfigContent />
    </ProtectedRoute>
  );
}
