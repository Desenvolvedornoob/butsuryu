import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Verificar diretamente o localStorage (solução simples)
  const hasValidToken = localStorage.getItem('supabase_auth_token') !== null;
  
  // Se temos token, permitir acesso
  if (hasValidToken) {
    return <>{children}</>;
  }
  
  // Se não temos token, redirecionar para login
  return <Navigate to="/auth" replace />;
}; 