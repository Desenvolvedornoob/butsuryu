
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      console.log('Usuário autenticado, redirecionando...');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Iniciando processo de login...');
    setLoading(true);

    try {
      await signIn(phone, password);
      console.log('Login bem-sucedido, aguardando redirecionamento...');
      // O redirecionamento será feito pelo useEffect quando o estado do usuário for atualizado
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: "Erro de login",
        description: "Não foi possível fazer login. Verifique suas credenciais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  // Se o usuário já estiver autenticado, não renderize o formulário
  if (user) {
    console.log('Usuário já autenticado, não renderizando formulário');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Entre com seu telefone e senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="090-1234-5678 ou +81 90-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:underline"
                onClick={(e) => loading && e.preventDefault()}
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
