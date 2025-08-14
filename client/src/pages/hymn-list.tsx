import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout";
import { organs } from "@/lib/organs";
import { useHymns } from "@/hooks/use-hymns";
import { Play, ChevronRight } from "lucide-react";

interface HymnListProps {
  organKey: string;
}

export default function HymnList({ organKey }: HymnListProps) {
  const [, navigate] = useLocation();
  const organ = organs.find((o) => o.key === organKey);
  const { hymns, isLoading, error, isOnline, hasOfflineData } = useHymns(organKey);

  const handleHymnSelect = (hymnIndex: number) => {
    navigate(`/organ/${organKey}/hymn/${hymnIndex}`);
  };

  const handleBack = () => {
    navigate("/");
  };

  if (!organ) {
    return (
      <Layout 
        title="Órgão não encontrado" 
        showBackButton={true}
        onBackClick={handleBack}
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
        title={organ.name}
        breadcrumbs={[organ.name]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="text-center py-8">
          <div className="h-8 w-8 mx-auto mb-4 border-2 border-church-primary border-r-transparent rounded-full animate-spin"></div>
          <p className="text-church-text">Carregando hinos...</p>
        </div>
      </Layout>
    );
  }

  if (error && !hasOfflineData) {
    return (
      <Layout 
        title={organ.name}
        breadcrumbs={[organ.name]}
        showBackButton={true}
        onBackClick={handleBack}
      >
        <div className="text-center py-8">
          <p className="text-church-text text-red-600">
            Erro ao carregar hinos. Verifique sua conexão.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={organ.name}
      breadcrumbs={[organ.name]}
      showBackButton={true}
      onBackClick={handleBack}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg overflow-hidden">
          <div className="bg-church-primary p-6">
            <div className="mb-2">
              <h2 className="font-bold text-white text-[20px]">
                Hinos do {organ.name}
              </h2>
            </div>
            <p className="text-church-light text-[14px]">
              Selecione um hino para reproduzir
              {!isOnline && hasOfflineData && " (modo offline)"}
            </p>
          </div>

          <CardContent className="p-6">
            {hymns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-church-text opacity-75">
                  Nenhum hino encontrado para este órgão.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {hymns.map((hymn, index) => (
                  <Button
                    key={`hymn-${index}-${hymn.titulo}`}
                    variant="ghost"
                    className="w-full h-auto p-0"
                    onClick={() => handleHymnSelect(index)}
                  >
                    <Card className="w-full border-2 border-gray-100 hover:border-church-secondary hover:bg-church-light hover:bg-opacity-10 transition-all duration-200 group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-left">
                            <span className="text-church-primary font-bold text-lg mr-4 bg-church-light bg-opacity-30 w-10 h-10 rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="text-church-text font-semibold group-hover:text-church-primary">
                                {hymn.titulo}
                              </h3>
                              <p className="text-church-text opacity-60 text-sm">
                                Hino {index + 1}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Play className="text-church-accent text-lg mr-2 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" />
                            <ChevronRight className="text-church-text opacity-40 group-hover:opacity-100 transition-opacity h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
