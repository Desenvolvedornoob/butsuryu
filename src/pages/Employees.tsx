import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, MoreVertical, Loader2, BarChart3 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, UserRole, UserStatus } from "@/types/user";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormattedDateInput } from "@/components/ui/formatted-date-input";
import { toast } from "sonner";
import { fetchFactories } from "@/lib/factory-helpers";
import { getEmployeeFactories, updateEmployeeFactories, loadEmployeeFactories } from '@/utils/employee-factories';
import { formatJapanesePhone } from '@/utils/phone-format';
import { createEmployeeWithoutAuth } from '@/integrations/supabase/client';

interface Factory {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  responsible: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<User> & { password?: string }>({
    first_name: '',
    name_japanese: '',
    birth_date: '',
    hire_date: '',
    department: '',
    role: 'funcionario',
    phone: '',
    status: 'active',
    factory_id: '',
    responsible: '',
    city: '',
    prestadora: ''
  });
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factoriesLoading, setFactoriesLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [serviceKeyStatus, setServiceKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  
  // Estados para controle do desligamento
  const [showDismissalReason, setShowDismissalReason] = useState(false);
  const [dismissalReason, setDismissalReason] = useState('');
  const [showCustomDismissalReason, setShowCustomDismissalReason] = useState(false);
  const [customDismissalReason, setCustomDismissalReason] = useState('');
  
  // Estados para filtros
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'desligamento'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'superuser' | 'funcionario' | 'observador'>('all');
  
  // Estado para modal de estatísticas
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterFactory, setFilterFactory] = useState('all');
  const [filterPrestadora, setFilterPrestadora] = useState('all');
  
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  
  // Verificar status da chave service_role
  const testServiceRoleKey = async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      setServiceKeyStatus(error ? 'invalid' : 'valid');
    } catch (err: any) {
      setServiceKeyStatus('invalid');
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchGroups();
    loadFactories();
    testServiceRoleKey();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      filterEmployees();
    }
  }, [searchTerm, employees, filterStatus, filterRole, filterDepartment, filterFactory, filterPrestadora]);

  const fetchEmployees = async () => {
    setLoading(true);
    console.log('Iniciando busca de funcionários');
    try {
      const { data: employeesData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        toast.error('Erro ao carregar funcionários');
        setEmployees([]);
        setFilteredEmployees([]);
      } else if (employeesData) {
        console.log('Funcionários encontrados:', employeesData.length);
        const typedEmployees = employeesData as User[];
        
        // Carregar as fábricas para os funcionários usando a função importada
        const employeesWithFactories = await loadEmployeeFactories(typedEmployees);
        
        setEmployees(employeesWithFactories);
        setFilteredEmployees(employeesWithFactories);
        console.log('Dados processados dos funcionários:', employeesWithFactories.length);
      }
    } catch (err) {
      console.error('Erro geral ao buscar funcionários:', err);
      toast.error('Erro ao carregar funcionários');
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFactories = async () => {
    try {
      setFactoriesLoading(true);
      
      console.log("Iniciando carregamento de fábricas na página de funcionários");
      
      const { data, error } = await fetchFactories();
      
      if (error) {
        throw error;
      }
      
      console.log("Fábricas carregadas na página de funcionários:", data);
      
      setFactories(data || []);
    } catch (error) {
      console.error('Error fetching factories:', error);
      toast.error("Não foi possível obter a lista de fábricas.");
    } finally {
      setFactoriesLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, responsible')
        .order('name', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
      
      const uniqueResponsibles = Array.from(
        new Set(data?.map(group => group.responsible) || [])
      );
      setResponsibles(uniqueResponsibles);
    } catch (error) {
      console.error('Error fetching groups:', error);
      uiToast({
        variant: "destructive",
        title: "Erro ao carregar grupos",
        description: "Não foi possível obter a lista de grupos."
      });
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      filtered = filtered.filter(employee => 
        employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm) ||
        employee.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(employee => employee.status === filterStatus);
    }

    // Filtro por função
    if (filterRole !== 'all') {
      filtered = filtered.filter(employee => employee.role === filterRole);
    }

    // Filtro por departamento
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(employee => employee.department === filterDepartment);
    }

    // Filtro por fábrica
    if (filterFactory !== 'all') {
      filtered = filtered.filter(employee => {
        if (Array.isArray(employee.factory_id)) {
          return employee.factory_id.includes(filterFactory);
        }
        return employee.factory_id === filterFactory;
      });
    }

    // Filtro por prestadora
    if (filterPrestadora !== 'all') {
      filtered = filtered.filter(employee => employee.prestadora === filterPrestadora);
    }
    
    setFilteredEmployees(filtered);
  };

  const handleEmployeeStatusChange = async (employeeId: string, newStatus: 'active' | 'inactive' | 'desligamento') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', employeeId);

      if (error) throw error;

      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId ? { ...emp, status: newStatus } : emp
        )
      );

      uiToast({
        title: "Status atualizado",
        description: `Funcionário ${newStatus === 'active' ? 'ativado' : newStatus === 'inactive' ? 'desativado' : 'desligado'} com sucesso.`
      });
    } catch (error) {
      console.error('Error updating employee status:', error);
      uiToast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do funcionário."
      });
    }
  };

  const handleDeleteClick = (employeeId: string) => {
    setDeleteEmployeeId(employeeId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEmployeeId) return;
    
    try {
      console.log('Iniciando exclusão do funcionário:', deleteEmployeeId);
      
      // Verificar se o funcionário existe antes de tentar excluir
      const { data: existingEmployee, error: checkError } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('id', deleteEmployeeId)
        .single();

      if (checkError || !existingEmployee) {
        throw new Error('Funcionário não encontrado');
      }

      console.log('Funcionário encontrado:', existingEmployee.first_name);
      
      // Primeiro, tentar excluir o perfil
      const { data: deleteResult, error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteEmployeeId)
        .select();

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError);
        throw profileError;
      }

      console.log('Resultado da exclusão:', deleteResult);

      // Verificar se o funcionário foi realmente excluído
      if (!deleteResult || deleteResult.length === 0) {
        throw new Error('Funcionário não foi encontrado para exclusão');
      }

      console.log('Perfil excluído com sucesso');

      // Tentar excluir o usuário da autenticação (opcional)
      try {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(deleteEmployeeId);
        if (deleteAuthError) {
          console.warn('Aviso: Não foi possível excluir usuário da autenticação:', deleteAuthError);
          // Não vamos falhar a operação por causa disso
        } else {
          console.log('Usuário da autenticação excluído com sucesso');
        }
      } catch (authError) {
        console.warn('Aviso: Erro ao excluir usuário da autenticação:', authError);
        // Não vamos falhar a operação por causa disso
      }

      // Atualizar tanto a lista principal quanto a filtrada
      setEmployees(prevEmployees => 
        prevEmployees.filter(emp => emp.id !== deleteEmployeeId)
      );
      
      setFilteredEmployees(prevFiltered => 
        prevFiltered.filter(emp => emp.id !== deleteEmployeeId)
      );

      console.log('Funcionário removido das listas locais');

      // Recarregar a lista para garantir sincronização
      await fetchEmployees();

      uiToast({
        title: "Funcionário removido",
        description: `${existingEmployee.first_name} foi removido com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      uiToast({
        variant: "destructive",
        title: "Erro ao remover funcionário",
        description: error instanceof Error ? error.message : "Não foi possível remover o funcionário. Tente novamente."
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteEmployeeId(null);
    }
  };

  const handleEditClick = (employee: User) => {
    setCurrentEmployee(employee);
    setNewPassword(''); // Resetar campo de senha
    setDismissalReason(employee.dismissal_reason || ''); // Inicializar motivo do desligamento
    setShowDismissalReason(employee.status === 'desligamento'); // Mostrar campo se já estiver desligado
    setShowCustomDismissalReason(employee.dismissal_reason === 'outro'); // Mostrar campo personalizado se for "outro"
    setCustomDismissalReason(employee.dismissal_reason === 'outro' ? employee.dismissal_reason || '' : ''); // Inicializar motivo personalizado
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentEmployee) {
      console.error("Nenhum funcionário selecionado para edição");
      return;
    }
    
    // Validações básicas
    if (!currentEmployee.first_name?.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    if (!currentEmployee.phone?.trim()) {
      toast.error("O telefone é obrigatório");
      return;
    }
    
    try {
      console.log("=== INICIANDO ATUALIZAÇÃO DE FUNCIONÁRIO ===");
      console.log("ID do funcionário:", currentEmployee.id);
      console.log("Dados atuais do funcionário:", currentEmployee);

      // Processar o telefone - MANTER O FORMATO QUE O USUÁRIO DIGITOU
      console.log("📞 PROCESSANDO TELEFONE:");
      console.log("  Telefone original do currentEmployee:", currentEmployee.phone);
      console.log("  Telefone após trim():", currentEmployee.phone.trim());
      
      // Não formatar automaticamente - manter o formato que o usuário digitou
      const phoneToSave = currentEmployee.phone.trim();
      console.log("  Telefone que será salvo (sem formatação):", phoneToSave);
      
      // Verificar se houve mudança real
      const originalPhone = employees.find(emp => emp.id === currentEmployee.id)?.phone;
      console.log("  Telefone original no banco:", originalPhone);
      console.log("  Houve mudança?", originalPhone !== phoneToSave);
      
      // Só para debug - mostrar como ficaria formatado
      const formattedPhone = formatJapanesePhone(phoneToSave);
      console.log("  Como ficaria se formatado:", formattedPhone);
      
      // Formatar as datas corretamente
      const formatDate = (dateString: string | undefined) => {
        if (!dateString || dateString.trim() === '') return null;
        
        // Se a data já está no formato YYYY-MM-DD, usar como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        
        // Se a data tem timezone (ISO string), pegar apenas a parte da data
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }
        
        return dateString;
      };

      const formattedBirthDate = formatDate(currentEmployee.birth_date);
      const formattedHireDate = formatDate(currentEmployee.hire_date);
      
      console.log("Datas formatadas:", {
        birth_date: formattedBirthDate,
        hire_date: formattedHireDate
      });
      
      // Formatar responsável
      const responsibleValue = Array.isArray(currentEmployee.responsible) 
        ? currentEmployee.responsible.join(',') 
        : currentEmployee.responsible === 'none' ? null : currentEmployee.responsible || null;

      // Preparar dados para atualização - apenas campos que existem na tabela profiles
      const updateData = {
        first_name: currentEmployee.first_name.trim(),

        name_japanese: currentEmployee.name_japanese?.trim() || null,
        birth_date: formattedBirthDate,
        hire_date: formattedHireDate,
        department: currentEmployee.department?.trim() || null,
        role: currentEmployee.role || 'funcionario',
        phone: phoneToSave,
        status: currentEmployee.status || 'active',
        responsible: responsibleValue,
        dismissal_reason: currentEmployee.status === 'desligamento' ? 
          (dismissalReason === 'outro' ? customDismissalReason : dismissalReason) : null,
        city: currentEmployee.city?.trim() || null,
        prestadora: currentEmployee.prestadora?.trim() || null,
        updated_at: new Date().toISOString()
      };

      console.log("📋 DADOS PARA ATUALIZAÇÃO:");
      console.log("  updateData completo:", updateData);
      console.log("  updateData.phone especificamente:", updateData.phone);
      console.log("  Tipo do phone:", typeof updateData.phone);

      // Verificar a sessão atual
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Usuário logado:", sessionData.session?.user?.id);

      // Atualizar o perfil básico do funcionário
      console.log("Iniciando update na tabela profiles...");
      const { data: updateResult, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', currentEmployee.id)
        .select('*');

      if (error) {
        console.error("Erro detalhado ao atualizar funcionário:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Mensagens de erro mais específicas
        if (error.code === '42501') {
          throw new Error("Erro de permissão: Você não tem autorização para editar este funcionário. Verifique se está logado como administrador.");
        } else if (error.code === '23505') {
          throw new Error("Erro de duplicação: Já existe um funcionário com estes dados.");
        } else {
          throw new Error(`Erro na base de dados: ${error.message}`);
        }
      }

      console.log("✅ UPDATE EXECUTADO COM SUCESSO:");
      console.log("  updateResult completo:", updateResult);
      console.log("  Telefone salvo no banco:", updateResult?.[0]?.phone);
      console.log("  Todos os campos salvos:", updateResult?.[0]);

      if (!updateResult || updateResult.length === 0) {
        console.warn("Nenhuma linha foi atualizada");
        throw new Error("Nenhum registro foi atualizado. Verifique se você tem permissão para editar este funcionário.");
      }

      // Atualizar senha se uma nova foi fornecida
      let passwordUpdateSuccess = true;
      let passwordErrorMessage = '';
      
      if (newPassword && newPassword.trim() !== '') {
        console.log("🔒 Alterando senha do funcionário ID:", currentEmployee.id);
        
        try {
          let passwordResult, passwordError;
          
          try {
            const adminResult = await supabaseAdmin.auth.admin.updateUserById(
              currentEmployee.id,
              { password: newPassword.trim() }
            );
            passwordResult = adminResult.data;
            passwordError = adminResult.error;
            
          } catch (adminErr: any) {
            console.warn("Erro com cliente admin, tentando fallback:", adminErr.message);
            
            // Tentativa 2: Usar cliente normal com permissões admin
            console.log("🔑 Tentando com cliente normal (verificando permissões)...");
            if (user?.role === 'admin' || user?.role === 'superuser') {
              const normalResult = await supabase.auth.admin.updateUserById(
                currentEmployee.id,
                { password: newPassword.trim() }
              );
              passwordResult = normalResult.data;
              passwordError = normalResult.error;
            } else {
              throw new Error('Você não tem permissão para alterar senhas de funcionários');
            }
          }

          if (passwordError) {
            console.error("❌ Erro ao atualizar senha:", {
              message: passwordError.message,
              details: passwordError.details,
              hint: passwordError.hint,
              code: passwordError.code
            });
            
            // Mensagens mais específicas baseadas no tipo de erro
            if (passwordError.code === 'insufficient_permissions') {
              passwordErrorMessage = 'Você não tem permissão para alterar senhas. Verifique se está logado como administrador.';
            } else if (passwordError.code === 'user_not_found') {
              passwordErrorMessage = 'Funcionário não encontrado no sistema de autenticação.';
            } else if (passwordError.message?.includes('401') || passwordError.status === 401) {
              passwordErrorMessage = 'Chave de administração inválida. Entre em contato com o suporte técnico.';
            } else {
              passwordErrorMessage = passwordError.message || 'Erro desconhecido ao alterar senha';
            }
            
            passwordUpdateSuccess = false;
          } else {
            console.log("✅ Senha alterada com sucesso");
          }
        } catch (error: any) {
          console.error("❌ Erro inesperado ao atualizar senha:", error);
          passwordUpdateSuccess = false;
          
          if (error.message.includes('admin não disponível')) {
            passwordErrorMessage = 'Funcionalidade administrativa não configurada. Entre em contato com o suporte.';
          } else {
            passwordErrorMessage = error.message || 'Erro inesperado ao alterar senha';
          }
        }
      }

      // Atualizar as fábricas associadas
      console.log("Atualizando fábricas associadas...");
      const factoryIds = Array.isArray(currentEmployee.factory_id)
        ? currentEmployee.factory_id
        : currentEmployee.factory_id 
          ? [currentEmployee.factory_id]
          : [];
          
      console.log("IDs das fábricas:", factoryIds);
      await updateEmployeeFactories(currentEmployee.id, factoryIds);

      console.log("=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===");

      // Atualizar o estado local com os dados retornados do banco
      const updatedEmployee = updateResult[0];
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === currentEmployee.id ? { ...emp, ...updatedEmployee, status: updatedEmployee.status as UserStatus } : emp
        )
      );

      // Atualizar também o currentEmployee com os dados salvos
      setCurrentEmployee({ ...currentEmployee, ...updatedEmployee, status: updatedEmployee.status as UserStatus });

      // Mostrar mensagem de sucesso adequada baseada no resultado
      if (newPassword && newPassword.trim() !== '') {
        if (passwordUpdateSuccess) {
          uiToast({
            title: "Sucesso!",
            description: "Os dados e senha do funcionário foram atualizados com sucesso."
          });
        } else {
          uiToast({
            variant: "destructive",
            title: "Sucesso Parcial",
            description: `Dados atualizados, mas houve erro ao alterar a senha: ${passwordErrorMessage}`
          });
        }
      } else {
        uiToast({
          title: "Sucesso!",
          description: "Os dados do funcionário foram atualizados com sucesso."
        });
      }
      
      setIsEditDialogOpen(false);

      // Recarregar funcionários para garantir consistência
      console.log("Recarregando lista de funcionários...");
      await fetchEmployees();

    } catch (error: any) {
      console.error('=== ERRO AO ATUALIZAR FUNCIONÁRIO ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      console.error('Stack trace:', error.stack);
      
      const errorMessage = error.message || "Não foi possível atualizar os dados do funcionário.";
      
      uiToast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: errorMessage
      });
    }
  };

  const handleNewEmployeeDialogOpen = () => {
    setIsNewEmployeeDialogOpen(true);
    
    if (factories.length === 0) {
      loadFactories();
    }
  };
  
  const handleNewEmployeeSubmit = async () => {
    if (!newEmployee.first_name || !newEmployee.phone || !newEmployee.password) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      // Salvar a sessão atual do admin
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Formatar o telefone corretamente
      const formattedPhone = formatJapanesePhone(newEmployee.phone);
      
      // Log para depuração dos valores atuais
      console.log("Dados do novo funcionário antes de salvar:", {
        factory_id: newEmployee.factory_id,
        responsible: newEmployee.responsible,
        phone_original: newEmployee.phone,
        phone_formatted: formattedPhone
      });
      
             // Formatar as datas corretamente (remover timezone se necessário)
       const formatDate = (dateString: string | undefined) => {
         if (!dateString) return null;
         console.log("Formatando data:", dateString);
         // Se a data tem timezone, remover
         const formatted = dateString.split('T')[0];
         console.log("Data formatada:", formatted);
         return formatted;
       };

       // Usar a nova função que não afeta a sessão atual
       const result = await createEmployeeWithoutAuth({
         first_name: newEmployee.first_name,
 
         name_japanese: newEmployee.name_japanese || '',
         birth_date: formatDate(newEmployee.birth_date),
         hire_date: formatDate(newEmployee.hire_date),
         phone: formattedPhone,
         password: newEmployee.password || '',
         department: newEmployee.department || '',
         role: newEmployee.role || 'funcionario',
         responsible: newEmployee.responsible === 'none' ? null : newEmployee.responsible || null,
         factory_id: newEmployee.factory_id,
         city: newEmployee.city || '',
         prestadora: newEmployee.prestadora || ''
       });
      
      if (!result.success) {
        throw result.error;
      }
      
      console.log("Funcionário criado com sucesso", result.user);
      
      // Restaurar a sessão do admin se necessário
      if (currentSession) {
        await supabase.auth.setSession(currentSession);
      }
      
      toast.success("Funcionário criado com sucesso");
        
      setIsNewEmployeeDialogOpen(false);
      setNewEmployee({
        first_name: '',
        name_japanese: '',
        birth_date: '',
        hire_date: '',
        department: '',
        role: 'funcionario',
        phone: '',
        status: 'active',
        factory_id: '',
        responsible: '',
        password: '',
        city: '',
        prestadora: ''
      });
      
      await fetchEmployees();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.message || "Erro ao criar funcionário");
    }
  };

  // Função para formatar o campo responsible para exibição
  const formatResponsible = (responsible: string | string[] | undefined): string => {
    if (!responsible) return '-';
    if (typeof responsible === 'string') return responsible;
    if (Array.isArray(responsible) && responsible.length > 0) return responsible.join(', ');
    return '-';
  };

  // Função para formatar as fábricas para exibição na tabela
  const formatFactories = (factoryId: string | string[] | undefined): React.ReactNode => {
    if (!factoryId) return '-';
    
    const factoryArray = Array.isArray(factoryId) 
      ? factoryId 
      : typeof factoryId === 'string' && factoryId.includes(',')
        ? factoryId.split(',')
        : [factoryId];
        
    if (factoryArray.length === 0) return '-';
    
    return (
      <div className="flex flex-col gap-1">
        {factoryArray.map(id => {
          const factory = factories.find(f => f.id === id);
          if (!factory) {
            console.log("Fábrica não encontrada para o ID:", id);
            return (
              <span key={id} className="text-xs text-red-500">
                ID desconhecido: {id}
              </span>
            );
          }
          return (
            <span key={id} className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {factory.name}
            </span>
          );
        })}
      </div>
    );
  };

  // Função para formatar o motivo do desligamento
  const formatDismissalReason = (reason: string | undefined): string => {
    if (!reason) return '-';
    
    const reasonMap: Record<string, string> = {
      'sem_hora_extra': 'Sem hora extra',
      'salario_baixo': 'Salário baixo',
      'corrido': 'Corrido',
      'pesado': 'Pesado',
      'desentendimento': 'Desentendimento',
      'doenca': 'Doença',
      'retorno_pais': 'Retorno ao país',
      'nao_respeita_regras': 'Não respeita regras',
      'nao_deu_certo': 'Não deu certo',
      'falta': 'Falta',
      'familia': 'Família',
      'estressado': 'Estressado',
      'outro': 'Outro'
    };
    
    // Se for um motivo padrão, retornar o nome formatado
    if (reasonMap[reason]) {
      return reasonMap[reason];
    }
    
    // Se não for um motivo padrão, retornar o texto personalizado
    return reason;
  };

  // Função para obter departamentos únicos
  const getUniqueDepartments = (): string[] => {
    const departments = employees
      .map(employee => employee.department)
      .filter(dept => dept && dept.trim() !== '')
      .filter((dept, index, self) => self.indexOf(dept) === index)
      .sort();
    
    return departments;
  };

  // Função para obter prestadoras únicas
  const getUniquePrestadoras = (): string[] => {
    const prestadoras = employees
      .map(employee => employee.prestadora)
      .filter(prest => prest && prest.trim() !== '')
      .filter((prest, index, self) => self.indexOf(prest) === index)
      .sort();
    
    return prestadoras;
  };

  // Funções para calcular estatísticas
  const getStatsByManager = () => {
    const stats = employees.reduce((acc, emp) => {
      if (emp.status === 'active' && emp.role !== 'observador') {
        const manager = emp.responsible || 'Sem responsável';
        acc[manager] = (acc[manager] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getStatsByDepartment = () => {
    const stats = employees.reduce((acc, emp) => {
      if (emp.status === 'active' && emp.role !== 'observador') {
        const dept = emp.department || 'Sem departamento';
        acc[dept] = (acc[dept] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getStatsByCity = () => {
    const stats = employees.reduce((acc, emp) => {
      if (emp.status === 'active' && emp.role !== 'observador') {
        const city = emp.city || 'Sem cidade';
        acc[city] = (acc[city] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getStatsByFactory = () => {
    const stats = employees.reduce((acc, emp) => {
      if (emp.status === 'active' && emp.role !== 'observador') {
        // emp.factory_id pode ser um array de strings ou uma string simples
        let employeeFactories: string[] = [];
        
        if (Array.isArray(emp.factory_id)) {
          employeeFactories = emp.factory_id;
        } else if (emp.factory_id) {
          employeeFactories = [emp.factory_id];
        }
        
        if (employeeFactories.length === 0) {
          // Funcionário sem fábrica
          acc['Sem fábrica'] = (acc['Sem fábrica'] || 0) + 1;
        } else {
          // Contar o funcionário para cada fábrica associada
          employeeFactories.forEach(factoryId => {
            const factory = factories.find(f => f.id === factoryId);
            const factoryName = factory?.name || 'Fábrica não encontrada';
            acc[factoryName] = (acc[factoryName] || 0) + 1;
          });
        }
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getStatsByPrestadora = () => {
    const stats = employees.reduce((acc, emp) => {
      if (emp.status === 'active' && emp.role !== 'observador') {
        const prestadora = emp.prestadora || 'Sem prestadora';
        acc[prestadora] = (acc[prestadora] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Funcionários</h1>
              <p className="text-muted-foreground">Gerencie os funcionários da empresa</p>
              {serviceKeyStatus === 'invalid' && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                  ⚠️ Mudança de senhas indisponível
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => setIsStatsModalOpen(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Estatísticas
              </Button>
              {user?.role === 'admin' && (
                <Button onClick={handleNewEmployeeDialogOpen}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Funcionário
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar funcionários..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsFilterOpen(true)}>
                    <Filter className="h-4 w-4" />
                    {(filterStatus !== 'all' || filterRole !== 'all' || filterDepartment !== 'all' || filterFactory !== 'all' || filterPrestadora !== 'all') && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {[
                          filterStatus !== 'all' ? 1 : 0,
                          filterRole !== 'all' ? 1 : 0,
                          filterDepartment !== 'all' ? 1 : 0,
                          filterFactory !== 'all' ? 1 : 0,
                          filterPrestadora !== 'all' ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nome Japonês</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Prestadora</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Fábrica</TableHead>
                      <TableHead>Motivo Desligamento</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.first_name}
                          </TableCell>
                          <TableCell>{employee.name_japanese || '-'}</TableCell>
                          <TableCell>{employee.department || '-'}</TableCell>
                          <TableCell>
                            {employee.role === 'admin' ? 'Admin' : 
                             employee.role === 'superuser' ? 'Líder' : 
                             employee.role === 'observador' ? 'Observador' : 'Funcionário'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : employee.status === 'inactive'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {employee.status === 'active' ? 'Ativo' : 
                               employee.status === 'inactive' ? 'Inativo' : 
                               employee.status === 'desligamento' ? 'Desligamento' : 'Desconhecido'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{employee.phone || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {employee.city || '-'}
                          </TableCell>
                          <TableCell>
                            {employee.prestadora || '-'}
                          </TableCell>
                          <TableCell>
                            {formatResponsible(employee.responsible)}
                          </TableCell>
                          <TableCell>
                            {formatFactories(employee.factory_id)}
                          </TableCell>
                          <TableCell>
                            {formatDismissalReason(employee.dismissal_reason)}
                          </TableCell>
                          <TableCell>
                            {user?.role === 'observador' ? null : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(employee)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {employee.status === 'active' ? (
                                  <>
                                    <DropdownMenuItem 
                                      className="text-amber-600"
                                      onClick={() => handleEmployeeStatusChange(employee.id, 'inactive')}
                                    >
                                      Desativar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleEmployeeStatusChange(employee.id, 'desligamento')}
                                    >
                                      Desligar
                                    </DropdownMenuItem>
                                  </>
                                ) : employee.status === 'inactive' ? (
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => handleEmployeeStatusChange(employee.id, 'active')}
                                  >
                                    Ativar
                                  </DropdownMenuItem>
                                ) : employee.status === 'desligamento' ? (
                                  <DropdownMenuItem 
                                    className="text-green-600"
                                    onClick={() => handleEmployeeStatusChange(employee.id, 'active')}
                                  >
                                    Reativar
                                  </DropdownMenuItem>
                                ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum funcionário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o funcionário e todas as suas informações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>
              Atualize os dados do funcionário
            </DialogDescription>
          </DialogHeader>
                     <div className="grid gap-6 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="edit-first-name">Nome*</Label>
                 <Input
                   id="edit-first-name"
                   value={currentEmployee?.first_name || ''}
                   onChange={(e) => {
                     const newValue = e.target.value;
                     console.log("Nome alterado para:", newValue);
                     setCurrentEmployee(prev => prev ? {...prev, first_name: newValue} : prev);
                   }}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="edit-name-japanese">Nome em Japonês</Label>
                 <Input
                   id="edit-name-japanese"
                   value={currentEmployee?.name_japanese || ''}
                   onChange={(e) => {
                     const newValue = e.target.value;
                     console.log("Nome japonês alterado para:", newValue);
                     setCurrentEmployee(prev => prev ? {...prev, name_japanese: newValue} : prev);
                   }}
                   placeholder="田中 太郎"
                 />
               </div>
             </div>
                         <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="edit-birth-date">Data de Nascimento</Label>
                 <FormattedDateInput
                   id="edit-birth-date"
                   value={currentEmployee?.birth_date || ''}
                   onChange={(value) => {
                     console.log("Data de nascimento alterada para:", value);
                     setCurrentEmployee(prev => prev ? {...prev, birth_date: value} : prev);
                   }}
                   placeholder="YYYY-MM-DD"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="edit-hire-date">Data de Início na Empresa</Label>
                 <FormattedDateInput
                   id="edit-hire-date"
                   value={currentEmployee?.hire_date || ''}
                   onChange={(value) => {
                     console.log("Data de contratação alterada para:", value);
                     setCurrentEmployee(prev => prev ? {...prev, hire_date: value} : prev);
                   }}
                   placeholder="YYYY-MM-DD"
                 />
               </div>
             </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone*</Label>
              <div className="space-y-1">
                <Input
                  id="edit-phone"
                  value={currentEmployee?.phone || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("🔄 TELEFONE MUDOU:");
                    console.log("  Valor anterior:", currentEmployee?.phone);
                    console.log("  Valor novo:", newValue);
                    
                    setCurrentEmployee(prev => {
                      if (!prev) return prev;
                      const updated = {...prev, phone: newValue};
                      console.log("  Estado atualizado:", updated.phone);
                      return updated;
                    });
                  }}
                  placeholder="090-1234-5678 ou +81 90-1234-5678"
                  required
                />

              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-city">Cidade</Label>
              <Input
                id="edit-city"
                value={currentEmployee?.city || ''}
                onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, city: e.target.value} : prev)}
                placeholder="Digite a cidade onde mora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prestadora">Prestadora</Label>
              <Input
                id="edit-prestadora"
                value={currentEmployee?.prestadora || ''}
                onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, prestadora: e.target.value} : prev)}
                placeholder="Digite a prestadora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova Senha (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("🔒 SENHA ALTERADA PELO ADMIN");
                  setNewPassword(newValue);
                }}
                placeholder="Deixe em branco para manter a senha atual"
              />
              <p className="text-xs text-muted-foreground">
                Como administrador, você pode alterar a senha deste funcionário. Deixe em branco se não quiser alterar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Setor</Label>
                <Input
                  id="edit-department"
                  value={currentEmployee?.department || ''}
                  onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, department: e.target.value} : prev)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select
                  value={currentEmployee?.role || 'funcionario'}
                  onValueChange={(value) => setCurrentEmployee(prev => prev ? {...prev, role: value as UserRole} : prev)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="superuser">Líder</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="observador">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-responsible">Responsável</Label>
                <Select
                  value={
                    (typeof currentEmployee?.responsible === 'string' 
                      ? currentEmployee.responsible 
                      : Array.isArray(currentEmployee?.responsible) && (currentEmployee?.responsible as string[])?.length > 0
                        ? (currentEmployee.responsible as string[])[0]
                        : '') as string
                  }
                  onValueChange={(value) => setCurrentEmployee(prev => prev ? {...prev, responsible: value} : prev)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {responsibles.map((responsible) => (
                      <SelectItem key={responsible} value={responsible}>
                        {responsible}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={currentEmployee?.status || 'active'}
                  onValueChange={(value) => {
                    const newStatus = value as 'active' | 'inactive' | 'desligamento';
                    setCurrentEmployee(prev => prev ? {...prev, status: newStatus} : prev);
                    setShowDismissalReason(newStatus === 'desligamento');
                    if (newStatus !== 'desligamento') {
                      setDismissalReason('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="desligamento">Desligamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de motivo do desligamento - aparece apenas quando status é "desligamento" */}
              {showDismissalReason && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dismissal-reason">Motivo do Desligamento</Label>
                  <Select
                    value={dismissalReason}
                    onValueChange={(value) => {
                      setDismissalReason(value);
                      setShowCustomDismissalReason(value === 'outro');
                      if (value !== 'outro') {
                        setCustomDismissalReason('');
                      }
                      setCurrentEmployee(prev => prev ? {...prev, dismissal_reason: value === 'outro' ? customDismissalReason : value} : prev);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo do desligamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem_hora_extra">Sem hora extra</SelectItem>
                      <SelectItem value="salario_baixo">Salário baixo</SelectItem>
                      <SelectItem value="corrido">Corrido</SelectItem>
                      <SelectItem value="pesado">Pesado</SelectItem>
                      <SelectItem value="desentendimento">Desentendimento</SelectItem>
                      <SelectItem value="doenca">Doença</SelectItem>
                      <SelectItem value="retorno_pais">Retorno ao país</SelectItem>
                      <SelectItem value="nao_respeita_regras">Não respeita regras</SelectItem>
                      <SelectItem value="nao_deu_certo">Não deu certo</SelectItem>
                      <SelectItem value="falta">Falta</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="estressado">Estressado</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Campo de texto personalizado - aparece apenas quando "outro" é selecionado */}
                  {showCustomDismissalReason && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-custom-dismissal-reason">Especifique o motivo</Label>
                      <Input
                        id="edit-custom-dismissal-reason"
                        value={customDismissalReason}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCustomDismissalReason(value);
                          setCurrentEmployee(prev => prev ? {...prev, dismissal_reason: value} : prev);
                        }}
                        placeholder="Digite o motivo específico do desligamento"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
                         <div className="space-y-2">
               <Label htmlFor="edit-factory">Fábricas</Label>
               <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                {factoriesLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Carregando fábricas...</span>
                  </div>
                ) : (
                  factories.map((factory) => (
                    <div key={factory.id} className="flex items-center space-x-2 mb-1">
                      <input 
                        type="checkbox" 
                        id={`edit-factory-${factory.id}`} 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={
                          Array.isArray(currentEmployee?.factory_id) 
                            ? currentEmployee?.factory_id.includes(factory.id)
                            : currentEmployee?.factory_id === factory.id
                        }
                        onChange={(e) => {
                          setCurrentEmployee(prev => {
                            if (!prev) return prev;
                            
                            // Inicialize como array se não for
                            const currentFactories = Array.isArray(prev.factory_id) 
                              ? [...prev.factory_id] 
                              : prev.factory_id ? [prev.factory_id] : [];
                            
                            if (e.target.checked) {
                              // Adicionar se não existir
                              if (!currentFactories.includes(factory.id)) {
                                return { ...prev, factory_id: [...currentFactories, factory.id] };
                              }
                              return prev;
                            } else {
                              // Remover se existir
                              return { 
                                ...prev, 
                                factory_id: currentFactories.filter(id => id !== factory.id)
                              };
                            }
                          });
                        }}
                      />
                      <label htmlFor={`edit-factory-${factory.id}`} className="text-sm">
                        {factory.name}
                      </label>
                    </div>
                  ))
                )}
                {factories.length === 0 && !factoriesLoading && (
                  <p className="text-sm text-muted-foreground">Nenhuma fábrica cadastrada</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
            <DialogDescription>
              Adicione um novo funcionário ao sistema
            </DialogDescription>
          </DialogHeader>
                     <div className="grid gap-6 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="new-first-name">Nome*</Label>
                 <Input
                   id="new-first-name"
                   value={newEmployee.first_name || ''}
                   onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-name-japanese">Nome em Japonês</Label>
                 <Input
                   id="new-name-japanese"
                   value={newEmployee.name_japanese || ''}
                   onChange={(e) => setNewEmployee({...newEmployee, name_japanese: e.target.value})}
                   placeholder="田中 太郎"
                 />
               </div>
             </div>
                         <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="new-birth-date">Data de Nascimento</Label>
                 <FormattedDateInput
                   id="new-birth-date"
                   value={newEmployee.birth_date || ''}
                   onChange={(value) => setNewEmployee({...newEmployee, birth_date: value})}
                   placeholder="YYYY-MM-DD"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-hire-date">Data de Início na Empresa</Label>
                 <FormattedDateInput
                   id="new-hire-date"
                   value={newEmployee.hire_date || ''}
                   onChange={(value) => setNewEmployee({...newEmployee, hire_date: value})}
                   placeholder="YYYY-MM-DD"
                 />
               </div>
             </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Telefone*</Label>
              <Input
                id="new-phone"
                value={newEmployee.phone || ''}
                onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                placeholder="090-1234-5678 ou +81 90-1234-5678"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-city">Cidade</Label>
              <Input
                id="new-city"
                value={newEmployee.city || ''}
                onChange={(e) => setNewEmployee({...newEmployee, city: e.target.value})}
                placeholder="Digite a cidade onde mora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-prestadora">Prestadora</Label>
              <Input
                id="new-prestadora"
                value={newEmployee.prestadora || ''}
                onChange={(e) => setNewEmployee({...newEmployee, prestadora: e.target.value})}
                placeholder="Digite a prestadora"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha*</Label>
              <Input
                id="new-password"
                type="password"
                value={newEmployee.password || ''}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-department">Setor</Label>
                <Input
                  id="new-department"
                  value={newEmployee.department || ''}
                  onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Função</Label>
                <Select
                  value={newEmployee.role || 'funcionario'}
                  onValueChange={(value) => setNewEmployee({...newEmployee, role: value as UserRole})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="superuser">Líder</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="observador">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-responsible">Responsável</Label>
                <Select
                  value={
                    (typeof newEmployee.responsible === 'string' 
                      ? newEmployee.responsible
                      : Array.isArray(newEmployee.responsible) && (newEmployee.responsible as string[])?.length > 0
                        ? (newEmployee.responsible as string[])[0]
                        : '') as string
                  }
                  onValueChange={(value) => setNewEmployee({...newEmployee, responsible: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {responsibles.map((responsible) => (
                      <SelectItem key={responsible} value={responsible}>
                        {responsible}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-factory">Fábricas</Label>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                  {factoriesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm">Carregando fábricas...</span>
                    </div>
                  ) : (
                    factories.map((factory) => (
                      <div key={factory.id} className="flex items-center space-x-2 mb-1">
                        <input 
                          type="checkbox" 
                          id={`new-factory-${factory.id}`} 
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={
                            Array.isArray(newEmployee.factory_id) 
                              ? newEmployee.factory_id.includes(factory.id)
                              : newEmployee.factory_id === factory.id
                          }
                          onChange={(e) => {
                            // Inicialize como array se não for
                            const currentFactories = Array.isArray(newEmployee.factory_id) 
                              ? [...newEmployee.factory_id] 
                              : newEmployee.factory_id ? [newEmployee.factory_id] : [];
                            
                            if (e.target.checked) {
                              // Adicionar se não existir
                              if (!currentFactories.includes(factory.id)) {
                                setNewEmployee({
                                  ...newEmployee, 
                                  factory_id: [...currentFactories, factory.id]
                                });
                              }
                            } else {
                              // Remover se existir
                              setNewEmployee({
                                ...newEmployee, 
                                factory_id: currentFactories.filter(id => id !== factory.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`new-factory-${factory.id}`} className="text-sm">
                          {factory.name}
                        </label>
                      </div>
                    ))
                  )}
                  {factories.length === 0 && !factoriesLoading && (
                    <p className="text-sm text-muted-foreground">Nenhuma fábrica cadastrada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewEmployeeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleNewEmployeeSubmit}>
              Criar Funcionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Filtros */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar Funcionários</DialogTitle>
            <DialogDescription>
              Selecione os filtros desejados para visualizar os funcionários
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Filtro por Status */}
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="desligamento">Desligamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Função */}
            <div className="space-y-2">
              <Label htmlFor="filter-role">Função</Label>
              <Select value={filterRole} onValueChange={(value) => setFilterRole(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="superuser">Líder</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="observador">Observador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Departamento */}
            <div className="space-y-2">
              <Label htmlFor="filter-department">Departamento</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {getUniqueDepartments().map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Fábrica */}
            <div className="space-y-2">
              <Label htmlFor="filter-factory">Fábrica</Label>
              <Select value={filterFactory} onValueChange={setFilterFactory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fábrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fábricas</SelectItem>
                  {factories.map(factory => (
                    <SelectItem key={factory.id} value={factory.id}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Prestadora */}
            <div className="space-y-2">
              <Label htmlFor="filter-prestadora">Prestadora</Label>
              <Select value={filterPrestadora} onValueChange={setFilterPrestadora}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prestadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prestadoras</SelectItem>
                  {getUniquePrestadoras().map(prestadora => (
                    <SelectItem key={prestadora} value={prestadora}>
                      {prestadora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFilterStatus('all');
              setFilterRole('all');
              setFilterDepartment('all');
              setFilterFactory('all');
              setFilterPrestadora('all');
            }}>
              Limpar Filtros
            </Button>
            <Button onClick={() => setIsFilterOpen(false)}>
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Estatísticas */}
      <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estatísticas de Funcionários</DialogTitle>
            <DialogDescription>
              Distribuição de funcionários ativos por diferentes critérios
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {/* Estatísticas por Responsável */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatsByManager().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{item.name}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas por Serviço/Departamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatsByDepartment().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{item.name}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas por Cidade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Cidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatsByCity().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{item.name}</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas por Fábrica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Fábrica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatsByFactory().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{item.name}</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas por Prestadora */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Prestadora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatsByPrestadora().map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded border">
                      <span className="font-medium">{item.name}</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Total */}
          <div className="border-t pt-4">
            <div className="text-center">
              <p className="text-lg font-semibold">
                Total de funcionários ativos: {employees.filter(emp => emp.status === 'active' && emp.role !== 'observador').length}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsStatsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
