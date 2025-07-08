import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import AudioPlayer from "@/components/audio-player";
import { organs } from "@/lib/organs";
import { HymnData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PlayerProps {
  organKey: string;
  hymnIndex: string;
}

export default function Player({ organKey, hymnIndex }: PlayerProps) {
  const [, navigate] = useLocation();
  const [hymn, setHymn] = useState<HymnData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const organ = organs.find((o) => o.key === organKey);
  const hymnIndexNum = parseInt(hymnIndex, 10);

  useEffect(() => {
    const loadHymn = async () => {
      try {
        setLoading(true);
        const response = await import(`@/data/hymns/${organKey}.json`);
        const hymns: HymnData[] = response.default;
        
        if (hymnIndexNum >= 0 && hymnIndexNum < hymns.length) {
          setHymn(hymns[hymnIndexNum]);
        } else {
          throw new Error("Hino não encontrado");
        }
      } catch (error) {
        console.error("Error loading hymn:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o hino.",
          variant: "destructive",
        });
        navigate(`/organ/${organKey}`);
      } finally {
        setLoading(false);
      }
    };

    if (organKey && !isNaN(hymnIndexNum)) {
      loadHymn();
    }
  }, [organKey, hymnIndexNum, navigate, toast]);

  const handleBack = () => {
    navigate(`/organ/${organKey}`);
  };

  const handleAudioError = (error: string) => {
    toast({
      title: "Erro no Player",
      description: error,
      variant: "destructive",
    });
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

  if (loading) {
    return (
      <Layout 
        title="Carregando..."
        breadcrumbs={[organ.name, "Carregando..."]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-church-text">Carregando hino...</p>
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
        <AudioPlayer hymn={hymn} onError={handleAudioError} />
      </div>
    </Layout>
  );
}
