import Layout from "@/components/layout";
import FirebaseAdmin from "@/components/firebase-admin";
import FirebaseConnectionStatus from "@/components/firebase-connection-status";
import { FirebaseConfigWarning } from "@/lib/firebase-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Download, Database, Loader2 } from "lucide-react";

// Firebase service with fallback
import * as firebaseStub from '@/lib/firebaseService.stub';

let firebaseService: any = firebaseStub;
let hasFirebaseService = false;

// Check if Firebase is configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

hasFirebaseService = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('your_')
);

export default function Admin() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSyncOfflineData = async () => {
    if (!hasFirebaseService) {
      toast({
        title: "Firebase não configurado",
        description: "Configure o Firebase para usar a sincronização offline.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      await firebaseService.initializeOfflineData();
      toast({
        title: "Sincronização concluída",
        description: "Dados baixados para uso offline.",
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSync = hasFirebaseService ? firebaseService.getLastSyncDate() : null;
  const hasOffline = hasFirebaseService ? firebaseService.hasOfflineData() : false;

  return (
    <Layout title="Administração" showBackButton={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-church-primary">
            Painel de Administração
          </h2>
          <FirebaseConnectionStatus />
        </div>

        {/* Configuration Status */}
        <FirebaseConfigWarning />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Hymn Card */}
          {hasFirebaseService ? (
            <FirebaseAdmin />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-church-primary">
                  Adicionar Hino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Configure o Firebase para adicionar novos hinos.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sync Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-church-primary flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Sincronização Offline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>
                  Status:{" "}
                  {hasOffline
                    ? "✅ Dados disponíveis offline"
                    : "❌ Sem dados offline"}
                </p>
                {lastSync && (
                  <p>
                    Última sincronização: {lastSync.toLocaleDateString()} às{" "}
                    {lastSync.toLocaleTimeString()}
                  </p>
                )}
                {!hasFirebaseService && (
                  <p className="text-yellow-600">
                    ⚠️ Firebase não configurado - usando dados locais
                  </p>
                )}
              </div>

              <Button
                onClick={handleSyncOfflineData}
                disabled={isSyncing || !hasFirebaseService}
                className="w-full bg-church-secondary hover:bg-church-primary"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Sincronizar Dados
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500">
                <p>
                  A sincronização baixa todos os hinos do Firebase para uso
                  offline. Isso permitirá que o app funcione mesmo sem conexão à
                  internet.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-church-primary">
              Como Configurar o Firebase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-700">
              <h4 className="font-semibold mb-2">
                1. Criar projeto no Firebase:
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Acesse{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    console.firebase.google.com
                  </a>
                </li>
                <li>Crie um novo projeto</li>
                <li>Ative o Firestore Database</li>
                <li>Ative o Firebase Storage</li>
              </ul>
            </div>

            <div className="text-sm text-gray-700">
              <h4 className="font-semibold mb-2">
                2. Configurar variáveis de ambiente:
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Copie o arquivo{" "}
                  <code className="bg-gray-100 px-1 rounded">.env.example</code>{" "}
                  para <code className="bg-gray-100 px-1 rounded">.env</code>
                </li>
                <li>Preencha com suas credenciais do Firebase</li>
                <li>
                  As credenciais ficam em: Configurações do Projeto → Geral →
                  Seus apps
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-700">
              <h4 className="font-semibold mb-2">3. Estrutura do Firestore:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Coleção:{" "}
                  <code className="bg-gray-100 px-1 rounded">hinos</code>
                </li>
                <li>
                  Campos: numero (int), titulo (string), orgao (string),
                  audioPath (string), criadoEm (timestamp)
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-700">
              <h4 className="font-semibold mb-2">4. Estrutura do Storage:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Pasta:{" "}
                  <code className="bg-gray-100 px-1 rounded">hinos/</code>
                </li>
                <li>
                  Arquivos de áudio serão salvos automaticamente nesta pasta
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
