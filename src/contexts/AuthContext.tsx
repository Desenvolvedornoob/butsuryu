import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase, checkAndFixAdminProfile } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, UserPermissions, UserRole, UserStatus } from '@/types/user';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { getPhoneFormatsForLogin } from '@/utils/phone-format';

interface SignInCredentials {
  phone: string;
  password: string;
}

interface WeakPassword {
  message: string;
  score: number;
}

interface AuthResponse {
  user: User | null;
  session: Session | null;
  weakPassword?: WeakPassword | null;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (credentials: SignInCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  signUp: (phone: string, password: string, userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => ({ user: null, session: null, weakPassword: null }),
  signOut: async () => {},
  hasPermission: () => false,
  signUp: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  navigate: (path: string) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, navigate: navigateProp }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = navigateProp || useNavigate();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      console.log('[AuthContext] Já inicializado, ignorando...');
      return;
    }
    
    // Configurando listener onAuthStateChange
    setIsInitialized(true);
    
    // Verificação Inicial Simplificada
    const initialCheck = async () => {
      try {
        setIsProcessingAuth(true);
        console.log('[AuthContext] Iniciando verificação de sessão inicial SIMPLIFICADA...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[AuthContext] Erro ao obter sessão inicial:', sessionError);
          setUser(null);
        } else if (session?.user) {
          console.log('[AuthContext] Sessão inicial encontrada, definindo usuário temporário ID:', session.user.id);
          // Definir usuário temporário imediatamente, sem buscar perfil
          const tempUser: User = {
            id: session.user.id,
            phone: session.user.phone || '',
            role: 'funcionario' as UserRole, // Usar funcionario como padrão (não admin)
            first_name: 'Usuário',
            _loading_state: 'loading', // Indicar que está carregando
            department: '', created_at: '', updated_at: '', factory_id: '', responsible: '', status: 'active'
          };
          setUser(tempUser);
        } else {
          console.log('[AuthContext] Nenhuma sessão inicial encontrada.');
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Erro inesperado ao verificar sessão inicial:', err);
        setUser(null);
      } finally {
        setLoading(false); // Garantir que loading seja false
        setIsProcessingAuth(false);
        console.log('[AuthContext] Verificação inicial SIMPLIFICADA concluída.');
      }
    };
    initialCheck();

    // Listener de eventos
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Log do evento recebido: _event

      if (isProcessingAuth) {
          console.log('[AuthContext] Ignorando evento onAuthStateChange (processando auth)');
          return;
      }

      if (_event === 'SIGNED_IN' && session?.user) {
          // Ignorar se já temos um usuário com o mesmo ID (evitar duplicação pós-login manual)
          if (user && user.id === session.user.id) {
              console.log('[AuthContext] Ignorando SIGNED_IN para usuário já definido.');
              return;
          }
          console.log('[AuthContext] Evento SIGNED_IN recebido. Definindo usuário temporário ID:', session.user.id);
          setIsProcessingAuth(true);

          // Definir usuário temporário imediatamente
          const tempUser: User = {
              id: session.user.id,
              phone: session.user.phone || '',
              role: 'funcionario' as UserRole, // Usar funcionario como padrão (não admin)
              first_name: 'Usuário',
              _loading_state: 'temp', // Usar 'temp' para diferenciar da carga inicial
              department: '', created_at: '', updated_at: '', factory_id: '', responsible: '', status: 'active'
          };
          setUser(tempUser);
          setLoading(false); // Definir loading como false AQUI
          setIsProcessingAuth(false);
          console.log('[AuthContext] Usuário temporário definido via onAuthStateChange.');

      } else if (_event === 'SIGNED_OUT') {
          console.log('[AuthContext] Evento SIGNED_OUT recebido.');
          setIsProcessingAuth(true);
          setUser(null);
          setLoading(false);
          setIsProcessingAuth(false);
      } else if (_event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[AuthContext] Evento TOKEN_REFRESHED recebido.');
          // Atualizar usuário se o ID mudou, mas sem afetar loading
          if (user?.id !== session.user.id) {
              const tempUser: User = {
                  id: session.user.id,
                  phone: session.user.phone || '',
                  role: 'funcionario' as UserRole, // Usar funcionario como padrão (não admin)
                  first_name: 'Usuário',
                  _loading_state: 'loaded',
                  department: '', created_at: '', updated_at: '', factory_id: '', responsible: '', status: 'active'
              };
              setUser(tempUser);
          }
      }
    });

    return () => {
        authListener?.subscription.unsubscribe();
        console.log('[AuthContext] Listener onAuthStateChange removido.');
    };
  }, []); 

  useEffect(() => {
    // Só buscar se tivermos um usuário que ainda precise do perfil completo
    if (user && (user._loading_state === 'loading' || user._loading_state === 'temp')) {
      console.log('[AuthContext] Usuário detectado, buscando perfil completo para ID:', user.id);
      let isActive = true; // Flag para evitar atualização de estado em componente desmontado

      const fetchProfile = async () => {
        try {
          console.log('[AuthContext] Iniciando busca de perfil para ID:', user.id);
          
          // Verificar se temos uma sessão ativa
          const { data: { session } } = await supabase.auth.getSession();
          console.log('[AuthContext] Sessão ativa:', !!session);
          
                const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

          if (!isActive) return; // Não atualizar se o componente desmontou

          if (profileError) {
            console.error('[AuthContext] Erro ao buscar perfil:', profileError);
            console.error('[AuthContext] Código do erro:', profileError.code);
            console.error('[AuthContext] Mensagem do erro:', profileError.message);
            console.error('[AuthContext] Detalhes do erro:', profileError.details);
            // Manter o usuário temporário mas indicar o erro
            setUser(prevUser => prevUser ? { ...prevUser, _loading_state: 'error' } : null);
          } else if (profileData) {
          console.log('[AuthContext] Perfil completo encontrado, atualizando usuário.');
          const profile = profileData as Database['public']['Tables']['profiles']['Row'];
          const userProfile: User = {
            id: profile.id,
            first_name: profile.first_name || '',
            _loading_state: 'loaded',
            phone: profile.phone || '',
            role: profile.role as UserRole,
            status: profile.status as UserStatus,
            factory_id: profile.factory_id || '',
            department: profile.department || '',
            responsible: profile.responsible || '',
            created_at: profile.created_at || '',
            updated_at: profile.updated_at || ''
          };
          setUser(userProfile);
          } else {
            console.warn('[AuthContext] Perfil completo não encontrado para usuário existente.');
            setUser(prevUser => prevUser ? { ...prevUser, _loading_state: 'error' } : null);
          }
        } catch (error) {
          if (!isActive) return;
          console.error('[AuthContext] Erro inesperado ao buscar perfil completo:', error);
          console.error('[AuthContext] Tipo do erro:', typeof error);
          console.error('[AuthContext] Stack trace:', error instanceof Error ? error.stack : 'N/A');
          setUser(prevUser => prevUser ? { ...prevUser, _loading_state: 'error' } : null);
        }
      };
      
      // Pequeno delay para não sobrecarregar imediatamente
      const timeoutId = setTimeout(fetchProfile, 100);

      // Função de limpeza
      return () => {
        isActive = false; // Marcar como inativo
        clearTimeout(timeoutId); // Limpar timeout se desmontar antes de executar
        console.log('[AuthContext] Limpeza do fetchProfile para ID:', user.id);
      };
    }
  }, [user]); // Depende do 'user'

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active'
        })
        .eq('id', user.id)
        .select()
        .single() as { data: Database['public']['Tables']['profiles']['Row'] | null, error: PostgrestError | null };

      if (updateError) throw updateError;

      if (profileData) {
        const userProfile: User = {
          id: profileData.id,
          first_name: profileData.first_name || '',
          _loading_state: 'loaded',
          phone: profileData.phone || '',
          role: profileData.role as UserRole,
          status: profileData.status as UserStatus,
          factory_id: profileData.factory_id || '',
          department: profileData.department || '',
          responsible: profileData.responsible || '',
          created_at: profileData.created_at || '',
          updated_at: profileData.updated_at || ''
        };
        setUser(userProfile);
      }
    } catch (error: any) {
      console.error('[getProfile] Erro:', error);
      setError(error.message);
    }
  };

  async function signIn({ phone, password }: SignInCredentials): Promise<AuthResponse> {
    try {
      console.log('[signIn] Iniciando login com telefone:', phone);
      setLoading(true);
      setError(null);
      setIsProcessingAuth(true); // Indica que estamos processando login explicitamente
      
      // Obter todos os formatos possíveis para tentar
      const phoneFormats = getPhoneFormatsForLogin(phone);
      console.log('[signIn] Formatos de telefone para tentar:', phoneFormats);
      
      let data: any = null;
      let error: any = null;
      let successfulFormat = '';
      
      // Tentar cada formato até encontrar um que funcione
      for (const phoneFormat of phoneFormats) {
        console.log('[signIn] Tentando login com formato:', phoneFormat);
        
        const result = await supabase.auth.signInWithPassword({
          phone: phoneFormat,
          password,
        });
        
        if (!result.error) {
          data = result.data;
          error = null;
          successfulFormat = phoneFormat;
          console.log('[signIn] Login bem-sucedido com formato:', phoneFormat);
          break;
        } else {
          console.log('[signIn] Falha com formato:', phoneFormat, 'Erro:', result.error.message);
          error = result.error;
        }
      }

      if (error) {
        console.error('[signIn] Erro na autenticação após tentar todos os formatos:', error);
        setLoading(false);
        setIsProcessingAuth(false);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.error('[signIn] Nenhum usuário retornado após autenticação');
        setLoading(false);
        setIsProcessingAuth(false);
        throw new Error('Usuário não autenticado');
      }

      console.log('[signIn] Autenticação bem-sucedida com o Supabase. ID:', data.user.id);
      
      // Definir usuário temporário IMEDIATAMENTE
      const tempUser: User = {
        id: data.user.id,
        phone: data.user.phone || successfulFormat,
        role: 'funcionario' as UserRole, // Definir como funcionário por padrão
        first_name: 'Usuário',
        _loading_state: 'temp', // Indicar que acabou de logar
        department: '', created_at: '', updated_at: '', factory_id: '', responsible: '', status: 'active'
      };
      
      console.log('[signIn] Definindo usuário temporário para login imediato:', tempUser);
      setUser(tempUser);
      
      // Buscar perfil do usuário para obter a role correta
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single() as { data: Database['public']['Tables']['profiles']['Row'] | null, error: PostgrestError | null };

      if (!profileError && profileData) {
        const userProfile: User = {
          id: profileData.id,
          first_name: profileData.first_name || '',
          _loading_state: 'loaded',
          phone: profileData.phone || '',
          role: profileData.role as UserRole,
          status: profileData.status as UserStatus,
          factory_id: profileData.factory_id || '',
          department: profileData.department || '',
          responsible: profileData.responsible || '',
          created_at: profileData.created_at || '',
          updated_at: profileData.updated_at || ''
        };
        
        console.log('[signIn] ✅ Login bem-sucedido como:', userProfile.role);
        setUser(userProfile);
      } else {
        console.error('[signIn] ❌ Erro ao carregar perfil:', profileError);
      }

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

      // Concluir processamento e LIBERAR LOADING
      setLoading(false);
      setIsProcessingAuth(false);
      toast.success('Login realizado com sucesso!');
      
      console.log('[signIn] Login concluído. Navegação será feita pela página Auth.');
      
      return {
        user: tempUser,
        session: data.session,
        weakPassword: null
      };
    } catch (error: any) {
      console.error('[signIn] Erro no login:', error);
      setError(error);
      setLoading(false);
      setIsProcessingAuth(false);
      throw error;
    }
  }

  const signOut = async () => {
    try {
      console.log('[AuthContext] Iniciando processo de logout...');
      setIsProcessingAuth(true);
      
      // Verificar se há sessão antes de tentar fazer logout
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        console.log('[AuthContext] Sessão encontrada, fazendo logout via Supabase...');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('[AuthContext] Erro no logout do Supabase, mas continuando limpeza local:', error);
        } else {
          console.log('[AuthContext] Logout do Supabase realizado com sucesso');
        }
      } else {
        console.log('[AuthContext] Nenhuma sessão ativa encontrada, fazendo apenas limpeza local');
      }
      
      // Sempre limpar dados locais independentemente do resultado do logout do Supabase
      console.log('[AuthContext] Limpando dados locais...');
      setUser(null);
      
      // Limpar todos os storages
      try {
        sessionStorage.clear();
        localStorage.removeItem('sb-xuywsfscrzypuppzaiks-auth-token');
        localStorage.removeItem('supabase_auth_token');
        localStorage.removeItem('requests');
        localStorage.removeItem('supabaseUrl');
        localStorage.removeItem('supabaseKey');
        localStorage.removeItem('supabase_token');
        console.log('[AuthContext] Dados locais limpos com sucesso');
      } catch (storageError) {
        console.warn('[AuthContext] Erro ao limpar storage, mas continuando:', storageError);
      }
      
      setLoading(false);
      setIsProcessingAuth(false);
      
      console.log('[AuthContext] Navegando para página inicial...');
      navigate('/');
      
      toast.success('Logout realizado com sucesso');
      console.log('[AuthContext] Logout concluído com sucesso');
      
    } catch (error: any) {
      console.error('[AuthContext] Erro durante logout:', error);
      
      // Mesmo em caso de erro, limpar dados locais
      setUser(null);
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (storageError) {
        console.warn('[AuthContext] Erro ao limpar storage em fallback:', storageError);
      }
      
      setLoading(false);
      setIsProcessingAuth(false);
      
      // Navegar mesmo em caso de erro
      navigate('/');
      
      // Mostrar toast de sucesso em vez de erro, já que a limpeza local funcionou
      toast.success('Logout realizado com sucesso');
      console.log('[AuthContext] Logout concluído (com fallback) após erro');
    }
  };

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    if (!user) return false;

    // Debug limitado apenas quando necessário
    // if (user.role === 'observador') {
    //   console.log('[hasPermission] 🔍 Verificando permissão:', permission, 'para usuário:', user.role);
    // }

    // Mapeamento de permissões por role
    const rolePermissions: Record<UserRole, UserPermissions> = {
      admin: {
        viewDashboard: true,
        manageEmployees: true,
        approveRequests: true,
        canApproveLeaves: true,
        canViewOwnLeaves: true,
        canManageEmployees: true,
        canManageFactories: true,
        canManageShifts: true,
        canManageUsers: true,
        createRequest: true,
        manageSystem: true,
        view_requests: true
      },
      superuser: {
        viewDashboard: true,
        manageEmployees: false,
        approveRequests: true,
        canApproveLeaves: true,
        canViewOwnLeaves: true,
        canManageEmployees: false,
        canManageFactories: false,
        canManageShifts: false,
        canManageUsers: false,
        createRequest: true,
        manageSystem: false,
        view_requests: true
      },
      funcionario: {
        viewDashboard: true,
        manageEmployees: false,
        approveRequests: false,
        canApproveLeaves: false,
        canViewOwnLeaves: true,
        canManageEmployees: false,
        canManageFactories: false,
        canManageShifts: false,
        canManageUsers: false,
        createRequest: true,
        manageSystem: false,
        view_requests: false
      },
      observador: {
        viewDashboard: true,
        manageEmployees: false,
        approveRequests: false,
        canApproveLeaves: true,        // ✅ Pode VER dados/monitoramento/desligamentos
        canViewOwnLeaves: false,
        canManageEmployees: true,      // ✅ Pode VER funcionários (não gerenciar)
        canManageFactories: true,      // ✅ Pode VER fábricas (não gerenciar)
        canManageShifts: true,         // ✅ Pode VER grupos (não gerenciar)
        canManageUsers: true,          // ✅ Pode VER usuários (não gerenciar)
        createRequest: false,
        manageSystem: false,
        view_requests: true
      }
    };

    // Garantir que admin sempre tenha permissões, mesmo durante carregamento
    if (user.role === 'admin') {
      // Log apenas para debug quando necessário

      return true;
    }
    
    // Usar estado interno para identificar usuário temporário/carregando
    if (user._loading_state === 'temp' || user._loading_state === 'loading' || user._loading_state === 'loaded') {
      // Não conceder permissões de admin para usuários temporários
      // Log reduzido para evitar spam - apenas em desenvolvimento

      // Usar a role definida temporariamente (funcionario por padrão)
      return rolePermissions[user.role as UserRole]?.[permission] || false;
    }
    
    // Garantir que user.role é um UserRole válido antes de acessar rolePermissions
    const userRole = user.role as UserRole;
    if (!rolePermissions[userRole]) {
        console.warn(`[hasPermission] ❌ Role inválida ou desconhecida: ${user.role}`);
        return false;
    }
    
    const hasAccess = rolePermissions[userRole]?.[permission] || false;
    
    // Debug desabilitado para produção
    // if (userRole === 'observador') {
    //   console.log('[hasPermission] 🎯 Resultado:', hasAccess, 'para', permission, 'com role:', userRole);
    // }
    
    return hasAccess;
  }, [user]);

  const signUp = async (phone: string, password: string, userData: Partial<User>) => {
    try {
      setLoading(true);
      
      // Usar o telefone como digitado pelo usuário, sem formatação obrigatória
      const formattedPhone = phone.trim();
      
      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            _loading_state: 'loaded',
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Cadastro falhou: Usuário não retornado.');

      // Inserir perfil após cadastro
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        phone: formattedPhone,
        first_name: userData.first_name || '',
        _loading_state: 'loaded',
        role: 'funcionario', // Default role
        status: 'active',
        department: userData.department || 'N/A',
        factory_id: Array.isArray(userData.factory_id) ? userData.factory_id[0] : (userData.factory_id || '1'),
        responsible: userData.responsible || 'N/A',
      });

      if (profileError) throw profileError;

      toast.success('Conta criada com sucesso! Você pode fazer login agora.');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(`Erro ao criar conta: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    hasPermission,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
