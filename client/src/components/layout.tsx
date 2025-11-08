import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// flag em memória (só vive enquanto a ABA estiver aberta)
declare global {
  interface Window {
    __splashShown?: boolean;
  }
}

interface LayoutProps {
  children: ReactNode;
  title?: string;                 // quando presente, mostra TÍTULO (sem logo)
  breadcrumbs?: string[];
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSettingsButton?: boolean;   // engrenagem só na Home
}

export default function Layout({
  children,
  title = "",
  breadcrumbs,
  showBackButton = false,
  onBackClick,
  showSettingsButton = false,
}: LayoutProps) {
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();

  // 1) Marca quando a página vai recarregar/fechar
  useEffect(() => {
    const markReload = () => {
      try { sessionStorage.setItem("wasReload", "1"); } catch {}
    };
    window.addEventListener("beforeunload", markReload);
    return () => window.removeEventListener("beforeunload", markReload);
  }, []);

  // 2) Se foi reload e não está na home, volta para "/"
  useEffect(() => {
    let wasReload = false;
    try { wasReload = sessionStorage.getItem("wasReload") === "1"; } catch {}
    if (wasReload) {
      try { sessionStorage.removeItem("wasReload"); } catch {}
      if (location !== "/") {
        navigate("/", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Splash: desabilitada temporariamente devido a problemas de timeout
  const [showSplash, setShowSplash] = useState<boolean>(() => false);

  const handleBackClick = () => {
    if (onBackClick) onBackClick();
    else navigate("/");
  };

  // Engrenagem: se usuário logado vai para /config, senão vai para /login
  const handleSettingsClick = () => {
    if (loading) return; // Evita navegação durante carregamento
    
    if (user) {
      // Usuário autenticado - vai direto para configurações
      navigate("/config");
    } else {
      // Usuário não autenticado - vai para login
      navigate("/login");
    }
  };

  // Memoize onFinish to prevent SplashScreen from restarting
  const handleSplashFinish = useCallback(() => {
    window.__splashShown = true;
    setShowSplash(false);
  }, []);

  return (
    <div className="min-h-screen bg-church-bg">
      {/* Splash por cima de tudo */}
      {showSplash && (
        <SplashScreen
          holdMs={800}
          xfadeMs={600}
          logoHoldMs={400}
          onFinish={handleSplashFinish}
        />
      )}
      <header
        className="shadow-lg relative flex items-center"
        style={{
          background: "linear-gradient(90deg, #0F2247, #4DB4E7)",
          height: "100px",
        }}
      >
        {/* Marca d'água */}
        <img
          src="/detalhe-header.png"
          alt="Detalhe"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            height: "140%",
            opacity: 0.6,
            zIndex: 1,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />

        <div
          className="container mx-auto px-4 h-full"
          style={{ position: "relative", zIndex: 2 }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center h-full">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="mr-4 text-white hover:text-white hover:bg-white/10 p-4 rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              )}

              {/* Se tiver title => mostra título; senão mostra logo (Home) */}
              {title ? (
                <h1 className="text-white font-bold ml-5 text-[25px]">{title}</h1>
              ) : (
                <img
                  src="/logo.svg"
                  alt="Belém Play"
                  style={{ maxHeight: "120%", marginLeft: 15, display: "block" }}
                />
              )}
            </div>

            {/* Engrenagem só aparece quando showSettingsButton = true (Home) */}
            {showSettingsButton && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSettingsClick}
                  className="text-white hover:text-white hover:bg-white/10 rounded-xl border-2 border-white/30 hover:border-white/50"
                  style={{ 
                    minHeight: "56px", 
                    minWidth: "56px",
                    padding: "12px"
                  }}
                  data-testid="button-settings"
                >
                  <Settings className="h-8 w-8" />
                </Button>
              </div>
            )}
          </div>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mt-2 text-church-light text-sm">
              <span>Início</span>
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  <span className="mx-2">›</span>
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>
      {/* Removido: barra de status Online/Sair do Layout para evitar duplicação */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
