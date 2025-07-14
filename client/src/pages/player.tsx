import { useLocation } from "wouter";
import Layout from "@/components/layout";
import AudioPlayer from "@/components/audio-player";
import FirebaseConnectionStatus from "@/components/firebase-connection-status";
import { organs } from "@/lib/organs";
import { useHymnByIndex } from "@/hooks/use-hymns";
import { SimpleSpinner } from "@/components/simple-spinner";

interface PlayerProps {
  organKey: string;
  hymnIndex: string;
}

export default function Player({ organKey, hymnIndex }: PlayerProps) {
  const [, navigate] = useLocation();
  const organ = organs.find((o) => o.key === organKey);
  const hymnIndexNum = parseInt(hymnIndex, 10);
  const { hymn, isLoading, error, isOnline } = useHymnByIndex(organKey, hymnIndexNum);

  const handleBack = () => {
    navigate(`/organ/${organKey}`);
  };

  const handleAudioError = (errorMessage: string) => {
    console.error("Audio player error:", errorMessage);
  };

  if (!organ) {
    return (
      <Layout 
        title="Órgão não encontrado" 
        showBackButton={true}
        onBackClick={() => navigate("/")}
      >
        <div className="text-center">
          <p className="text-church-text">Órgão não encontrado.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout 
        title="Carregando..."
        breadcrumbs={[organ.name, "Carregando..."]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="max-w-2xl mx-auto text-center py-8">
          <SimpleSpinner className="h-8 w-8 mx-auto mb-4 text-church-primary" />
          <p className="text-church-text">Carregando hino...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout 
        title="Erro"
        breadcrumbs={[organ.name, "Erro"]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-church-text text-red-600">
            Erro ao carregar hino. Verifique sua conexão.
          </p>
        </div>
      </Layout>
    );
  }

  if (!hymn) {
    return (
      <Layout 
        title="Hino não encontrado"
        breadcrumbs={[organ.name, "Hino não encontrado"]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-church-text">Hino não encontrado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={hymn.titulo}
      breadcrumbs={[organ.name, hymn.titulo]}
      showBackButton={true}
      onBackClick={handleBack}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex justify-end">
          <FirebaseConnectionStatus />
        </div>
        <AudioPlayer hymn={hymn} onError={handleAudioError} />
        {!isOnline && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Reproduzindo em modo offline
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
