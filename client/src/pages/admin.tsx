import Layout from "@/components/layout";
import FirebaseAdmin from "@/components/firebase-admin";
import { FirebaseConfigWarning } from "@/lib/firebase-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

function AdminContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Layout title="Adicionar Hinos" showBackButton>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Informações do usuário */}
        <div className="flex justify-end items-center">
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                <strong>Usuário:</strong> {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>

        {/* Aviso de configuração do Firebase (se necessário) */}
        <FirebaseConfigWarning />

        {/* Formulário de adicionar hino */}
        <div className="flex justify-center">
          {isFirebaseConfigured ? (
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

export default function Admin() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}