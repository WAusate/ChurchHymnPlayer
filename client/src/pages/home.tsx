import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout";
import { organs } from "@/lib/organs";
import { 
  Users, 
  Music, 
  Baby, 
  UserCheck, 
  UserPlus, 
  Guitar, 
  Heart, 
  Flag,
  ChevronRight
} from "lucide-react";

const iconMap = {
  users: Users,
  music: Music,
  baby: Baby,
  "user-check": UserCheck,
  "user-plus": UserPlus,
  guitar: Guitar,
  heart: Heart,
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
          <h2 className="text-3xl font-bold text-church-primary mb-2">
            Selecione o Órgão
          </h2>
          <p className="text-church-text opacity-75">
            Escolha o órgão da igreja para acessar os hinos
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full max-w-4xl">
            {organs.map((organ) => {
              const IconComponent = iconMap[organ.icon as keyof typeof iconMap] || Users;
              
              return (
                <Button
                  key={organ.key}
                  variant="ghost"
                  className="h-auto p-0 min-h-[80px] w-full"
                  onClick={() => handleOrganSelect(organ.key)}
                >
                  <Card className="w-full bg-gradient-to-r from-white to-blue-50 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-church-secondary group hover:scale-105 active:scale-100 shadow-md">
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
      </div>
    </Layout>
  );
}
