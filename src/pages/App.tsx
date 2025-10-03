import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.log('[App] Verificando redirecionamento na página raiz');
    
    // Se o usuário está autenticado, redirecionar para o dashboard
    if (user) {
      console.log('[App] Usuário autenticado, redirecionando para dashboard');
      navigate('/dashboard', { replace: true });
      
      // Backup com timeout para garantir o redirecionamento
      setTimeout(() => {
        if (location.pathname === '/') {
          console.log('[App] Redirecionamento navigate falhou, usando location.href');
          window.location.href = '/dashboard';
        }
      }, 300);
    } else {
      console.log('[App] Usuário não autenticado, redirecionando para auth');
      navigate('/auth', { replace: true });
      
      // Backup com timeout para garantir o redirecionamento
      setTimeout(() => {
        if (location.pathname === '/') {
          console.log('[App] Redirecionamento navigate falhou, usando location.href');
          window.location.href = '/auth';
        }
      }, 300);
    }
  }, [user, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-4"></div>
      <p className="text-gray-600 mb-2">Redirecionando...</p>
      <p className="text-gray-400 text-sm">
        Se você não for redirecionado automaticamente, 
        clique <a href="/auth" className="text-blue-500 hover:underline">aqui</a> para fazer login.
      </p>
    </div>
  );
};

export default App; 