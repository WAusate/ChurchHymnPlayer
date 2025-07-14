import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CorsErrorMessageProps {
  onRetry?: () => void;
}

export default function CorsErrorMessage({ onRetry }: CorsErrorMessageProps) {
  return (
    <Card className="w-full max-w-md mx-auto border-red-200">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-red-800">Problema de Conexão</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-700 text-sm">
          Este problema ocorre porque estamos em ambiente de desenvolvimento. 
          Para ouvir os hinos, a aplicação precisa ser implantada.
        </p>
        
        <div className="bg-blue-50 p-3 rounded-lg text-left">
          <h4 className="font-semibold text-blue-800 text-sm mb-2">Solução:</h4>
          <p className="text-blue-700 text-xs">
            Implante a aplicação no Firebase Hosting para resolver automaticamente 
            os problemas de CORS e permitir a reprodução de áudio.
          </p>
        </div>
        
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Tentar Novamente
          </Button>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Código do erro: CORS/Media Element</p>
        </div>
      </CardContent>
    </Card>
  );
}