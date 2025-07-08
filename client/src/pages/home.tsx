import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout";
import { organs } from "@/lib/organs";
import { 
  Users, 
  Music, 
  Baby, 
  HeartHandshake, 
  UserPlus, 
  Guitar, 
  Handshake, 
  Flag,
  ChevronRight 
} from "lucide-react";

const iconMap = {
  users: Users,
  music: Music,
  baby: Baby,
  "heart-handshake": HeartHandshake,
  "user-plus": UserPlus,
  guitar: Guitar,
  handshake: Handshake,
  flag: Flag,
};

export default function Home() {
  const [, navigate] = useLocation();

  const handleOrganSelect = (organKey: string) => {
    navigate(`/organ/${organKey}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-church-primary mb-2">
                Selecione o Órgão
              </h2>
              <p className="text-church-text opacity-75">
                Escolha o órgão da igreja para acessar os hinos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="border-church-secondary text-church-secondary hover:bg-church-secondary hover:text-white"
            >
              Admin
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {organs.map((organ) => {
            const IconComponent = iconMap[organ.icon as keyof typeof iconMap] || Users;
            
            return (
              <Button
                key={organ.key}
                variant="ghost"
                className="h-auto p-0"
                onClick={() => handleOrganSelect(organ.key)}
              >
                <Card className="w-full bg-white hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-church-secondary group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="flex items-center mb-2">
                          <IconComponent className="text-church-primary text-2xl mr-3 h-6 w-6" />
                          <h3 className="text-xl font-semibold text-church-primary group-hover:text-church-secondary">
                            {organ.name}
                          </h3>
                        </div>
                        <p className="text-church-text opacity-75 text-sm">
                          {organ.description}
                        </p>
                      </div>
                      <ChevronRight className="text-church-accent text-lg opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
