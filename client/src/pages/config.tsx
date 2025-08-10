import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Settings, Upload, Database, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Layout from '@/components/layout';

function ConfigContent() {
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
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Configurações
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo, {user?.email}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation('/admin')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Gerenciar Hinos
              </CardTitle>
              <CardDescription>
                Adicionar, editar e organizar hinos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Acesse a área administrativa para gerenciar os hinos de todos os órgãos da igreja.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Backup dos Dados
              </CardTitle>
              <CardDescription>
                Fazer backup e restaurar dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Gerencie backups dos hinos e dados do sistema para maior segurança.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Usuários
              </CardTitle>
              <CardDescription>
                Gerenciar acesso de usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Controle quem tem acesso às funcionalidades administrativas.
              </p>
              <Button variant="outline" size="sm" className="mt-3" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Status do Firebase:</strong>
                <span className="text-green-600 ml-2">Conectado</span>
              </div>
              <div>
                <strong>Usuário logado:</strong>
                <span className="ml-2">{user?.email}</span>
              </div>
              <div>
                <strong>Última atualização:</strong>
                <span className="ml-2">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <strong>Versão:</strong>
                <span className="ml-2">1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function Config() {
  return (
    <ProtectedRoute>
      <ConfigContent />
    </ProtectedRoute>
  );
}