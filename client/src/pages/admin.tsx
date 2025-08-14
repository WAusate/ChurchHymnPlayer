import Layout from "@/components/layout";
import FirebaseAdmin from "@/components/firebase-admin";
import FirebaseConnectionStatus from "@/components/firebase-connection-status";
import { FirebaseConfigWarning } from "@/lib/firebase-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Firebase service with fallback
import * as firebaseStub from '@/lib/firebaseService.stub';

let firebaseService: any = firebaseStub;
let hasFirebaseService = false;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  value => value && !String(value).startsWith('your_')
);

if (hasFirebaseConfig) {
  try {
    import('@/lib/firebaseService').then(module => {
      firebaseService = module;
      hasFirebaseService = true;
    }).catch(error => {
      console.log('Firebase service import failed:', error);
    });
  } catch (error) {
    console.log('Firebase not configured, using fallback mode');
  }
}

export default function Admin() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const auth = hasFirebaseConfig ? getAuth() : null;

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUserEmail(user ? user.email : null);
      });
      return () => unsubscribe();
    }
  }, [auth]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      window.location.href = "/login";
    }
  };

  return (
    <Layout title="Configurações" showBackButton>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Chip do Firebase no topo, alinhado à direita */}
        <div className="flex justify-end">
          <FirebaseConnectionStatus />
        </div>

        {/* Logo abaixo: Login + Sair (apenas quando autenticado) */}
        {userEmail && (
          <div className="flex justify-end items-center gap-3 -mt-1">
            <span className="text-sm text-gray-700">
              <strong>Login:</strong> {userEmail}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Sair
            </Button>
          </div>
        )}

        {/* Aviso de configuração do Firebase */}
        <FirebaseConfigWarning />

        {/* Conteúdo principal: Adicionar Hino */}
        <div className="flex justify-center">
          {hasFirebaseConfig ? (
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
        </div>
      </div>
    </Layout>
  );
}
