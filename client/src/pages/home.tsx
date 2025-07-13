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
              className="border-church-secondary text-church-secondary hover:bg-church-secondary hover:text-white px-4 py-2 rounded-lg"
              style={{ minHeight: '40px', fontSize: '16px' }}
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
                className="h-auto p-0 min-h-[80px]"
                onClick={() => handleOrganSelect(organ.key)}
              >
                <Card className="w-full bg-white hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-church-secondary group active:scale-95">
                  <CardContent className="p-6 min-h-[80px] flex items-center">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left flex items-center">
                        <IconComponent className="text-church-secondary mr-4 h-8 w-8" />
                        <h3 className="text-lg font-semibold text-church-primary group-hover:text-church-secondary text-center md:text-left" style={{ fontSize: '16px', fontWeight: '600' }}>
                          {organ.name}
                        </h3>
                      </div>
                      <ChevronRight className="text-church-accent opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" />
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
