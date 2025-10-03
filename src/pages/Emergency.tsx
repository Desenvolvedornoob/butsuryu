import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const Emergency = () => {
  const { user, loading } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  
  useEffect(() => {
    // Verificar sessão do Supabase
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Dados de sessão:", data);
      setSessionData(data);
      if (error) console.error("Erro ao verificar sessão:", error);
    });
    
    // Verificar localStorage
    try {
      const lsData = {
        'supabase_auth_token': localStorage.getItem('supabase_auth_token'),
        'userData': localStorage.getItem('userData')
      };
      setLocalStorageData(lsData);
    } catch (e) {
      console.error("Erro ao verificar localStorage:", e);
    }
  }, []);
  
  // Função para navegar direto ao dashboard
  const goToDashboard = () => {
    window.location.href = 'http://localhost:3001/dashboard';
  };
  
  // Função para limpar autenticação
  const clearAuth = () => {
    try {
      localStorage.removeItem('supabase_auth_token');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('recentLogin');
      supabase.auth.signOut().then(() => {
        window.location.href = 'http://localhost:3001/auth';
      });
    } catch (e) {
      console.error("Erro ao limpar autenticação:", e);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Página de Emergência</CardTitle>
          <CardDescription>
            Ferramenta para diagnosticar problemas de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-lg font-bold">Estado de Autenticação</Label>
            <div className="bg-gray-50 p-4 rounded border">
              <p><strong>Usuário no Contexto:</strong> {user ? 'Presente' : 'Ausente'}</p>
              <p><strong>Estado de Carregamento:</strong> {loading ? 'Carregando...' : 'Concluído'}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-lg font-bold">Sessão Supabase</Label>
            <div className="bg-gray-50 p-4 rounded border max-h-60 overflow-auto">
              <pre className="text-xs">{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-lg font-bold">Dados do LocalStorage</Label>
            <div className="bg-gray-50 p-4 rounded border max-h-60 overflow-auto">
              <pre className="text-xs">{JSON.stringify(localStorageData, null, 2)}</pre>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={goToDashboard} 
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            IR PARA DASHBOARD
          </Button>
          
          <Button 
            onClick={clearAuth} 
            className="w-full bg-red-600 hover:bg-red-700"
            size="sm"
          >
            Limpar Autenticação
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Emergency; 