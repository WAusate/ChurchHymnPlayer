import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface FirebaseConfigStatus {
  hasConfig: boolean;
  missingVars: string[];
  isValid: boolean;
}

export function useFirebaseConfigCheck(): FirebaseConfigStatus {
  const [status, setStatus] = useState<FirebaseConfigStatus>({
    hasConfig: false,
    missingVars: [],
    isValid: false
  });

  useEffect(() => {
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    const hasConfig = missingVars.length === 0;

    setStatus({
      hasConfig,
      missingVars,
      isValid: hasConfig
    });
  }, []);

  return status;
}

export function FirebaseConfigWarning() {
  const { hasConfig, missingVars } = useFirebaseConfigCheck();

  if (hasConfig) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Firebase configurado corretamente
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-yellow-800 font-medium mb-2">
              Configuração do Firebase Necessária
            </h4>
            <p className="text-yellow-700 text-sm mb-3">
              O sistema está funcionando com dados locais. Para habilitar a sincronização 
              com Firebase, configure as seguintes variáveis de ambiente:
            </p>
            <ul className="text-yellow-700 text-xs space-y-1">
              {missingVars.map(varName => (
                <li key={varName} className="flex items-center space-x-1">
                  <XCircle className="h-3 w-3" />
                  <code className="bg-yellow-100 px-1 rounded">{varName}</code>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline"
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                onClick={() => window.open('/admin', '_blank')}
              >
                Ver instruções completas
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}