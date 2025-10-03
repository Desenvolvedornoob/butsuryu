import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPhoneFormatsForLogin } from '@/utils/phone-format';
import { User, Eye, EyeOff, Calendar, Building, Mail, UserCheck } from 'lucide-react';

interface Factory {
  id: string;
  name: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [factories, setFactories] = useState<Factory[]>([]);

  // Carregar fábricas
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const { data, error } = await supabase
          .from('factories')
          .select('id, name');
        
        if (error) {
          console.error('Erro ao carregar fábricas:', error);
        } else {
          setFactories(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar fábricas:', err);
      }
    };

    loadFactories();
  }, []);
  
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos de senha."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A nova senha e confirmação não coincidem."
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres."
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      console.log("🔒 Alterando senha do usuário...");
      console.log("📱 Telefone do usuário:", user?.phone);
      console.log("🔐 Senha atual digitada:", currentPassword.length, "caracteres");
      
      // Primeiro salvar a sessão atual
      const { data: currentSession } = await supabase.auth.getSession();
      console.log("💾 Sessão atual salva");
      
      // Verificar credenciais usando múltiplos formatos de telefone
      console.log("🔍 Verificando credenciais...");
      
      // Obter todos os formatos possíveis para o telefone do usuário
      const phoneFormats = getPhoneFormatsForLogin(user?.phone || '');
      console.log("📱 Formatos de telefone para testar:", phoneFormats);
      
      let signInSuccess = false;
      let lastError: any = null;
      
      // Tentar cada formato até encontrar um que funcione
      for (const phoneFormat of phoneFormats) {
        console.log("🔄 Testando formato:", phoneFormat);
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          phone: phoneFormat,
          password: currentPassword
        });
        
        if (!signInError && signInData.user) {
          console.log("✅ Credenciais verificadas com formato:", phoneFormat);
          signInSuccess = true;
          break;
        } else {
          console.log("❌ Falha com formato:", phoneFormat, "Erro:", signInError?.message);
          lastError = signInError;
        }
      }
      
      if (!signInSuccess) {
        console.error("❌ Falha na verificação da senha com todos os formatos:", lastError);
        throw new Error("Senha atual incorreta. Verifique e tente novamente.");
      }

      console.log("✅ Credenciais verificadas com sucesso!");

      // Atualizar para nova senha
      console.log("🔄 Atualizando para nova senha...");
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error("❌ Erro ao atualizar senha:", updateError);
        throw new Error(`Erro ao alterar senha: ${updateError.message}`);
      }

      console.log("✅ Senha alterada com sucesso!");
      
      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada com sucesso."
      });

      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha. Verifique sua senha atual."
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string | undefined, type: 'birth' | 'hire' = 'birth') => {
    if (!dateString) return 'Não informado';
    
    // Se é uma data ISO, pegar só a parte da data
    const dateOnly = dateString.split('T')[0];
    
    try {
      const date = new Date(dateOnly);
      const now = new Date();
      
      // Calcular diferença em anos
      let years = now.getFullYear() - date.getFullYear();
      const monthDiff = now.getMonth() - date.getMonth();
      
      // Ajustar se ainda não fez aniversário/completou o ano
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
        years--;
      }
      
      // Formatação baseada no tipo
      if (type === 'birth') {
        return `${dateOnly} (${years} anos)`;
      } else {
        return `${dateOnly} (${years} anos na empresa)`;
      }
    } catch (error) {
      // Se houver erro na conversão, retornar só a data
      return dateOnly;
    }
  };

  const formatRole = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'superuser': return 'Líder';
      case 'funcionario': return 'Funcionário';
      default: return 'Funcionário';
    }
  };

  const formatFactory = (factoryId: string | string[] | undefined) => {
    if (!factoryId) return 'Não informado';
    
    // Se é um array
    if (Array.isArray(factoryId)) {
      if (factoryId.length === 0) return 'Não informado';
      if (factoryId.length === 1) {
        const factory = factories.find(f => f.id === factoryId[0]);
        return factory?.name || factoryId[0];
      }
      // Múltiplas fábricas - mostrar os nomes
      const factoryNames = factoryId.map(id => {
        const factory = factories.find(f => f.id === id);
        return factory?.name || id;
      }).join(', ');
      return factoryNames;
    }
    
    // Se é string, buscar o nome
    const factory = factories.find(f => f.id === factoryId);
    return factory?.name || factoryId;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <p>Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <AnimatedTransition>
        <div className="container mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e configurações da conta</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Suas informações cadastrais na empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Nome</Label>
                    <p className="text-gray-900 font-medium">{user.first_name || 'Não informado'}</p>
                  </div>

                  {user.name_japanese && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Nome em Japonês</Label>
                      <p className="text-gray-900 font-medium">{user.name_japanese}</p>
                    </div>
                  )}



                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <UserCheck className="h-4 w-4" />
                      Função
                    </Label>
                    <p className="text-gray-900 font-medium">{formatRole(user.role)}</p>
                  </div>

                  {user.department && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        Serviço
                      </Label>
                      <p className="text-gray-900 font-medium">{user.department}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      Fábrica
                    </Label>
                    <p className="text-gray-900 font-medium">{formatFactory(user.factory_id)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Empresa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informações da Empresa
                  </CardTitle>
                  <CardDescription>
                    Dados relacionados ao seu emprego
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Data de Nascimento</Label>
                    <p className="text-gray-900 font-medium">{formatDate(user.birth_date, 'birth')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Data de Início na Empresa</Label>
                    <p className="text-gray-900 font-medium">{formatDate(user.hire_date, 'hire')}</p>
                  </div>

                  {user.responsible && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                      <p className="text-gray-900 font-medium">{user.responsible}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <p className={`font-medium ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alterar Senha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Altere sua senha de acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual*</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha*</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha (mín. 6 caracteres)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha*</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite novamente sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedTransition>
    </div>
  );
}