import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEmployeeName } from '@/utils/name-formatter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Filter, Search, X, CalendarIcon, ChevronDown, PencilIcon, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { StatusType } from '@/types/user';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { loadAllRequests, updateRequestStatus } from '@/lib/requests';
import { updateRequest, getAllUsers, supabase } from '@/integrations/supabase/client';
import { checkAndFixRLS } from '@/utils/supabase-fix';
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RLSChecker } from '@/components/RLSChecker';

interface Requestable {
  id: string;
  type: 'time-off' | 'early-departure' | 'lateness' | 'absence';
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  userName: string;
  reason: string;
  date: string;
  endDate?: string;
  time?: string;
  arrivalTime?: string;
  created_at: string;
  rejectReason?: string;
  approved_by?: string;
  rejected_by?: string;
  reviewed_at?: string;
  reviewerName?: string;
  substituteName?: string;
}

interface User {
  id: string;
  first_name: string;
  full_name: string;
  isPrimary?: boolean;
  isSecondary?: boolean;
  isGroupLeader?: boolean;
  role?: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<Requestable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Requestable | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasPermission } = useAuth();
  const canEditRequests = hasPermission('canApproveLeaves');
  const canFullyEditRequests = user?.role === 'admin';
  const canApproveRejectOnly = user?.role === 'superuser';
  const [users, setUsers] = useState<User[]>([]);
  
  // Estados para gerenciar substitutos
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('none');
  const [availableSubstitutes, setAvailableSubstitutes] = useState<User[]>([]);
  const [isLoadingSubstitutes, setIsLoadingSubstitutes] = useState(false);
  
  // Estados para edição de solicitações
  const [editType, setEditType] = useState<'time-off' | 'early-departure' | 'lateness' | 'absence'>('time-off');
  const [editUserId, setEditUserId] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editTime, setEditTime] = useState('');
  const [editArrivalTime, setEditArrivalTime] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editSubstituteId, setEditSubstituteId] = useState<string>('none');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Aguardar carregamento completo do usuário
    if (!user || user._loading_state === 'loading' || user._loading_state === 'temp') {
      return;
    }

    // Verificar permissões
    if (!hasPermission('view_requests') && !hasPermission('canApproveLeaves')) {
      console.log('Usuário não tem permissão para ver solicitações');
      return;
    }

    console.log('✅ Carregando solicitações para:', user.role);
    loadRequests();
  }, [user?.id, user?._loading_state]);

  const loadRequests = async () => {
    try {
      // Loading requests...
      setIsLoading(true);
      const { data: requests, error } = await loadAllRequests();


      if (error) {
        console.error('Erro ao carregar requisições:', error);
        toast('Erro ao carregar requisições', {
          description: error.message
        });
        return;
      }

      if (requests) {
        // Requests loaded successfully
        setRequests(requests as Requestable[]);
        
      } else {
        console.log('Nenhuma solicitação encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
      toast('Erro ao carregar requisições', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsLoading(false);
    }
  };



  // Function to format the date
  const formatDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd HH:mm', { locale: ptBR });
  };

  // Function to format the date with weekday
  const formatDateWithWeekday = (date: Date) => {
    return format(date, "EEEE, yyyy-MM-dd 'às' HH:mm", { locale: ptBR });
  };

  // Function to format date only (without time)
  const formatDateOnly = (date: Date) => {
    return format(date, 'yyyy-MM-dd', { locale: ptBR });
  };

  // Filtered requests based on search query, selected status, and user permissions
  const filteredRequests = requests.filter(request => {
    // Filtrar por usuário: usuários normais veem apenas suas próprias solicitações
    const userMatch = canEditRequests || request.user_id === user?.id;
    
    const searchMatch = request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = selectedStatus === 'all' || request.status === selectedStatus;
    
    return userMatch && searchMatch && statusMatch;
  });

  // Function to open the dialog and set the selected request
  // Function to load available substitutes
  const loadAvailableSubstitutes = async (userId: string) => {
    try {
      setIsLoadingSubstitutes(true);
      console.log('🔍 Buscando substitutos para usuário:', userId);
      
      // Passo 1: Buscar dados do funcionário
      const { data: employee, error: employeeError } = await supabase
        .from('profiles')
        .select('id, first_name, responsible')
        .eq('id', userId)
        .single();
      
      if (employeeError || !employee) {
        console.error('❌ Erro ao buscar funcionário:', employeeError);
        return;
      }
      
      console.log('👤 Funcionário encontrado:', {
        nome: formatEmployeeName(employee),
        responsavel: employee.responsible,
        id: employee.id
      });
      
      // Passo 2: Buscar grupo do responsável para identificar líderes específicos
      let primaryLeaderId = null;
      let secondaryLeaderId = null;
      
      if (employee.responsible) {
        console.log('🔍 Buscando grupo para responsável:', employee.responsible);
        
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('name, primary_leader, secondary_leader')
          .eq('name', employee.responsible)
          .single();
          
        if (group && !groupError) {
          primaryLeaderId = group.primary_leader;
          secondaryLeaderId = group.secondary_leader;
          console.log('🏢 Grupo encontrado - Nome:', group.name);
          console.log('👨‍💼 Líder Primário ID:', primaryLeaderId);
          console.log('👨‍💼 Líder Secundário ID:', secondaryLeaderId);
        } else {
          console.log('⚠️ Grupo não encontrado para responsável:', employee.responsible);
        }
      }
      
      // Passo 3: Buscar TODOS os líderes disponíveis no sistema
      // Incluir: admins, superusers, líderes primários e secundários de todos os grupos
      console.log('🔍 Buscando todos os perfis ativos com role admin ou superuser...');
      const { data: allLeaders, error: leadersError } = await supabase
        .from('profiles')
        .select('id, first_name, role')
        .eq('status', 'active')
        .neq('id', userId)
        .or('role.eq.admin,role.eq.superuser');
      
      if (leadersError) {
        console.error('❌ Erro ao buscar líderes:', leadersError);
        return;
      }
      
      console.log('👥 Líderes (admin/superuser) encontrados:', allLeaders?.length || 0);
      console.log('📋 Detalhes dos líderes:', allLeaders);
      
      // Passo 4: Buscar todos os grupos para identificar líderes primários e secundários
      console.log('🔍 Buscando todos os grupos ativos...');
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('name, primary_leader, secondary_leader')
        .eq('status', 'active');
      
      if (groupsError) {
        console.error('❌ Erro ao buscar grupos:', groupsError);
      }
      
      console.log('🏢 Grupos encontrados:', allGroups?.length || 0);
      console.log('📋 Detalhes dos grupos:', allGroups);
      
      // Passo 5: Coletar todos os IDs de líderes dos grupos (filtrando valores válidos)
      const groupLeaderIds = new Set<string>();
      if (allGroups) {
        allGroups.forEach(group => {
          // Verificar se os IDs são válidos antes de adicionar
          if (group.primary_leader && group.primary_leader.trim() !== '') {
            groupLeaderIds.add(group.primary_leader);
          }
          if (group.secondary_leader && group.secondary_leader.trim() !== '') {
            groupLeaderIds.add(group.secondary_leader);
          }
        });
      }
      
      console.log('👥 IDs de líderes de grupos coletados:', Array.from(groupLeaderIds));
      
      // Passo 6: Buscar perfis dos líderes dos grupos que não são admin/superuser
      let groupLeadersProfiles: any[] = [];
      if (groupLeaderIds.size > 0) {
        const leaderIdsArray = Array.from(groupLeaderIds);
        console.log('🔍 Buscando perfis dos líderes de grupos:', leaderIdsArray);
        
        // Filtrar IDs válidos (não vazios e não nulos)
        const validLeaderIds = leaderIdsArray.filter(id => id && id.trim() !== '');
        
        if (validLeaderIds.length > 0) {
          const { data: groupLeaders, error: groupLeadersError } = await supabase
            .from('profiles')
            .select('id, first_name, role')
            .eq('status', 'active')
            .neq('id', userId)
            .in('id', validLeaderIds);
          
          if (!groupLeadersError && groupLeaders) {
            groupLeadersProfiles = groupLeaders;
            console.log('👥 Líderes de grupos encontrados:', groupLeadersProfiles.length);
            console.log('📋 Detalhes dos líderes de grupos:', groupLeadersProfiles);
          } else {
            console.error('❌ Erro ao buscar líderes de grupos:', groupLeadersError);
          }
        } else {
          console.log('⚠️ Nenhum ID válido de líder de grupo encontrado');
        }
      }
      
      // Passo 7: Combinar todos os líderes e remover duplicatas
      const allSubstitutes = [...(allLeaders || []), ...groupLeadersProfiles];
      const uniqueSubstitutes = allSubstitutes.filter((sub, index, self) => 
        index === self.findIndex(s => s.id === sub.id)
      );
      
      console.log('👥 Total de substitutos encontrados:', uniqueSubstitutes.length);
      console.log('📋 Lista completa de substitutos antes da formatação:', uniqueSubstitutes);
      
      // Passo 8: Formatar e ordenar substitutos
      const formattedSubstitutes = uniqueSubstitutes.map(sub => ({
        id: sub.id,
        first_name: sub.first_name,
        full_name: formatEmployeeName(sub),
        isPrimary: sub.id === primaryLeaderId,
        isSecondary: sub.id === secondaryLeaderId,
        isGroupLeader: groupLeaderIds.has(sub.id),
        role: sub.role
      }));
      
      // Ordenar: Líder primário primeiro, depois secundário, depois outros líderes de grupo, depois admin/superuser
      formattedSubstitutes.sort((a, b) => {
        // Líder primário sempre primeiro
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        
        // Líder secundário em segundo
        if (a.isSecondary && !b.isSecondary) return -1;
        if (!a.isSecondary && b.isSecondary) return 1;
        
        // Líderes de grupo em terceiro
        if (a.isGroupLeader && !b.isGroupLeader) return -1;
        if (!a.isGroupLeader && b.isGroupLeader) return 1;
        
        // Por fim, ordenar por nome
        return a.full_name.localeCompare(b.full_name);
      });
      
      setAvailableSubstitutes(formattedSubstitutes);
      
      // Passo 9: Pré-selecionar líder primário
      if (primaryLeaderId && formattedSubstitutes.some(sub => sub.id === primaryLeaderId)) {
        setSelectedSubstitute(primaryLeaderId);
        const selectedLeader = formattedSubstitutes.find(sub => sub.id === primaryLeaderId);
        console.log('✅ Líder primário pré-selecionado:', selectedLeader?.full_name);
      } else if (formattedSubstitutes.length > 0) {
        setSelectedSubstitute(formattedSubstitutes[0].id);
        console.log('✅ Primeiro substituto pré-selecionado:', formattedSubstitutes[0].full_name);
      } else {
        setSelectedSubstitute('none');
        console.log('⚠️ Nenhum substituto disponível');
      }
      
      console.log('📋 Lista final de substitutos:', formattedSubstitutes.map(sub => ({
        nome: sub.full_name,
        isPrimary: sub.isPrimary,
        isSecondary: sub.isSecondary,
        isGroupLeader: sub.isGroupLeader,
        role: sub.role
      })));
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar substitutos:', error);
    } finally {
      setIsLoadingSubstitutes(false);
    }
  };

  const openDialog = (request: Requestable) => {
    setSelectedRequest(request);
    setSelectedSubstitute('none'); // Reset do substituto selecionado
    setAvailableSubstitutes([]); // Reset da lista de substitutos
    
    // Carregar substitutos disponíveis para este funcionário
    if (request.user_id) {
      loadAvailableSubstitutes(request.user_id);
    }
    
    setIsDialogOpen(true);
  };

  // Function to close the dialog
  const closeDialog = () => {
    setSelectedRequest(null);
    setIsDialogOpen(false);
    setRejectReason('');
    setSelectedSubstitute('none');
    setAvailableSubstitutes([]);
  };
  
  // Function to close the edit dialog
  const closeEditDialog = () => {
    setSelectedRequest(null);
    setIsEditDialogOpen(false);
    setEditSubstituteId('none');
  };

  // Approve and reject functions
  const approveRequest = async (id: string) => {
    try {
      // Atualizar o status da solicitação
      const { data, error } = await updateRequestStatus(id, 'approved');
      
      if (error) {
        console.error('Erro ao aprovar requisição:', error);
        toast('Erro ao aprovar requisição', {
          description: error.message
        });
        return;
      }

      // Se um substituto foi selecionado, atualizar a solicitação com o substituto
      if (selectedSubstitute && selectedSubstitute !== 'none') {
        const { error: substituteError } = await supabase
          .from('requests')
          .update({ substitute_id: selectedSubstitute })
          .eq('id', id);
          
        if (substituteError) {
          console.error('Erro ao salvar substituto:', substituteError);
          toast('Solicitação aprovada, mas erro ao salvar substituto', {
            description: substituteError.message
          });
        } else {
          console.log('✅ Substituto salvo com sucesso:', selectedSubstitute);
        }
      }

      if (data) {
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === id ? { ...request, status: 'approved' } : request
          )
        );
        
        const substituteMessage = selectedSubstitute && selectedSubstitute !== 'none' ? 
          ' e substituto definido' : '';
        toast(`Solicitação aprovada com sucesso${substituteMessage}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar requisição:', error);
      toast('Erro ao aprovar requisição', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const rejectRequest = async (id: string) => {
    try {
      const { data, error } = await updateRequestStatus(id, 'rejected', rejectReason);
      
      if (error) {
        console.error('Erro ao rejeitar requisição:', error);
        toast('Erro ao rejeitar requisição', {
          description: error.message
        });
        return;
      }

      if (data) {
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === id ? { ...request, status: 'rejected' } : request
          )
        );
        toast('Solicitação rejeitada com sucesso');
        closeDialog();
      }
    } catch (error) {
      console.error('Erro ao rejeitar requisição:', error);
      toast('Erro ao rejeitar requisição', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };
  
  // Function to handle request deletion
  const openDeleteConfirm = (requestId: string) => {
    setRequestToDelete(requestId);
    setIsConfirmDeleteOpen(true);
  };
  
  const closeDeleteConfirm = () => {
    setRequestToDelete(null);
    setIsConfirmDeleteOpen(false);
  };
  
  const deleteRequest = async () => {
    if (!requestToDelete) return;
    
    try {
      console.log('Iniciando exclusão da solicitação:', requestToDelete);
      
      // Primeiro verificar o tipo da solicitação
      const requestToRemove = requests.find(req => req.id === requestToDelete);
      if (!requestToRemove) {
        toast('Erro ao excluir solicitação', {
          description: 'Solicitação não encontrada'
        });
        return;
      }
      
      console.log('Tipo da solicitação:', requestToRemove.type);
      
      // Verificar permissões RLS antes de prosseguir
      await checkAndFixRLS();
      console.log('Verificação RLS concluída');
      
      // Estratégia de exclusão baseada no tipo
      let deletionSuccess = false;
      let errors = [];
      
      // Para solicitações do tipo 'absence', excluir APENAS da tabela time_off
      if (requestToRemove.type === 'absence') {
        console.log('Tentando excluir absence da tabela time_off');
        const { error } = await supabase
          .from('time_off')
          .delete()
          .eq('id', requestToDelete);
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao excluir absence da tabela time_off:', error);
          errors.push(`time_off: ${error.message}`);
        } else {
          console.log('Exclusão da absence na tabela time_off bem-sucedida');
          console.log('🔍 Debug: ID excluído com sucesso da time_off:', requestToDelete);
          deletionSuccess = true;
          
          // Verificar imediatamente se o registro ainda existe
          supabase
            .from('time_off')
            .select('id')
            .eq('id', requestToDelete)
            .then(({ data: checkData, error: checkError }) => {
              if (checkError) {
                console.log('🔍 Debug: Erro ao verificar exclusão:', checkError);
              } else {
                console.log('🔍 Debug: Registros encontrados após exclusão:', checkData?.length || 0);
                if (checkData && checkData.length > 0) {
                  console.warn('⚠️ PROBLEMA: Registro ainda existe na time_off após exclusão!');
                }
              }
            });
        }
      } else {
        // Para outros tipos, excluir da tabela específica E da tabela requests
        
        // 1. Excluir da tabela específica
        if (requestToRemove.type === 'time-off') {
          console.log('Tentando excluir time-off da tabela time_off');
          const { error } = await supabase
            .from('time_off')
            .delete()
            .eq('id', requestToDelete);
          
          if (error && error.code !== 'PGRST116') {
            console.error('Erro ao excluir da tabela time_off:', error);
            errors.push(`time_off: ${error.message}`);
          } else {
            console.log('Exclusão da tabela time_off bem-sucedida');
            deletionSuccess = true;
          }
        } 
        else if (requestToRemove.type === 'early-departure') {
          console.log('Tentando excluir da tabela early_departures');
          const { error } = await supabase
            .from('early_departures')
            .delete()
            .eq('id', requestToDelete);
          
          if (error && error.code !== 'PGRST116') {
            console.error('Erro ao excluir da tabela early_departures:', error);
            errors.push(`early_departures: ${error.message}`);
          } else {
            console.log('Exclusão da tabela early_departures bem-sucedida');
            deletionSuccess = true;
          }
        }
        else if (requestToRemove.type === 'lateness') {
          console.log('Tentando excluir da tabela lateness');
          const { error } = await supabase
            .from('lateness')
            .delete()
            .eq('id', requestToDelete);
          
          if (error && error.code !== 'PGRST116') {
            console.error('Erro ao excluir da tabela lateness:', error);
            errors.push(`lateness: ${error.message}`);
          } else {
            console.log('Exclusão da tabela lateness bem-sucedida');
            deletionSuccess = true;
          }
        }
        
        // 2. Excluir da tabela requests (para todos exceto 'absence')
        console.log('Tentando excluir da tabela requests');
        const { error: requestsError } = await supabase
          .from('requests')
          .delete()
          .eq('id', requestToDelete);
        
        if (requestsError && requestsError.code !== 'PGRST116') {
          console.error('Erro ao excluir da tabela requests:', requestsError);
          errors.push(`requests: ${requestsError.message}`);
        } else {
          console.log('Exclusão da tabela requests bem-sucedida');
          deletionSuccess = true;
        }
      }
      
      // Verificar se pelo menos uma exclusão foi bem-sucedida
      if (!deletionSuccess) {
        console.error('Nenhuma exclusão foi bem-sucedida. Erros:', errors);
        toast('Erro ao excluir solicitação', {
          description: errors.length > 0 ? errors.join(', ') : 'Falha desconhecida na exclusão'
        });
        return;
      }
      
      // Se chegou até aqui, pelo menos uma exclusão foi bem-sucedida
      console.log('Exclusão bem-sucedida, atualizando interface');
      
      // Atualizar a lista local imediatamente
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestToDelete));
      
      toast('Solicitação excluída com sucesso');
      closeDeleteConfirm();
      
      // Recarregar a lista do servidor para garantir consistência
      console.log('Recarregando lista para garantir consistência...');
      await loadRequests();
      
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      toast('Erro ao excluir solicitação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };
  
  // Função para abrir o dialog de edição
  const openEditDialog = async (request: Requestable) => {
    setSelectedRequest(request);
    setEditType(request.type);
    setEditUserId(request.user_id);
    setEditReason(request.reason);
    setEditStartDate(new Date(request.date));
    setEditEndDate(request.endDate ? new Date(request.endDate) : undefined);
    setEditTime(request.time || '');
    setEditArrivalTime(request.arrivalTime || '');
    setEditStatus(request.status);
    setEditSubstituteId('none'); // Reset substituto
    
    // Buscar o substituto existente se for folga ou falta
    if (request.type === 'time-off' || request.type === 'absence') {
      try {
        const { data: timeOffData, error } = await supabase
          .from('time_off')
          .select('substitute_id')
          .eq('id', request.id)
          .single();
        
        if (!error && timeOffData?.substitute_id) {
          setEditSubstituteId(timeOffData.substitute_id);
        }
      } catch (error) {
        console.error('Erro ao buscar substitute_id da tabela time_off:', error);
        console.error('⚠️ POSSÍVEL CAUSA: A coluna substitute_id não existe na tabela time_off.');
        console.error('📋 SOLUÇÃO: Execute as migrações SQL conforme instruções em EXECUTAR-MIGRACOES-SUBSTITUTO.md');
        console.error('Erro ao buscar substituto:', error);
      }
    }
    // Para early-departure e lateness, buscar das tabelas específicas
    else if (request.type === 'early-departure') {
      try {
        const { data: earlyData, error } = await supabase
          .from('early_departures')
          .select('substitute_id')
          .eq('id', request.id)
          .single();
        
        if (!error && earlyData?.substitute_id) {
          setEditSubstituteId(earlyData.substitute_id);
        }
      } catch (error) {
        console.error('Erro ao buscar substitute_id da tabela early_departures:', error);
        console.error('⚠️ POSSÍVEL CAUSA: A coluna substitute_id não existe na tabela early_departures.');
        console.error('📋 SOLUÇÃO: Execute as migrações SQL conforme instruções em EXECUTAR-MIGRACOES-SUBSTITUTO.md');
        console.error('Erro ao buscar substituto:', error);
      }
    }
    else if (request.type === 'lateness') {
      try {
        const { data: latenessData, error } = await supabase
          .from('lateness')
          .select('*')
          .eq('id', request.id)
          .maybeSingle();
        
        if (!error && latenessData?.substitute_id) {
          setEditSubstituteId(latenessData.substitute_id);
        } else if (error) {
          console.warn('⚠️ Request lateness não encontrada na tabela lateness:', request.id);
          console.warn('📋 Isso pode indicar inconsistência de dados entre tabelas requests e lateness');
        }
      } catch (error) {
        console.error('Erro ao buscar dados da tabela lateness:', error);
        console.error('⚠️ POSSÍVEL CAUSA: Problema de RLS ou estrutura da tabela lateness.');
        console.error('📋 SOLUÇÃO: Verifique as configurações RLS da tabela lateness.');
      }
    }
    
    setIsEditDialogOpen(true);
  };
  
  // Função para salvar as alterações da edição
  const saveEdit = async () => {
    if (!selectedRequest) return;
    
    try {
      // Tratamento especial para "falta" (absence)
      // No caso de uma falta, devemos usar o tipo "time-off" no backend, mas com datas iguais
      // e manter "absence" apenas no frontend
      const isAbsence = editType === 'absence';
      
      // Use a RLSChecker para garantir que temos permissões 
      await checkAndFixRLS();
      
      const now = new Date().toISOString();
      
      
      // Calcular end_date de forma mais simples e clara
      let calculatedEndDate;
      
      if (isAbsence) {
        // Para "absence", as datas de início e fim são iguais
        calculatedEndDate = editStartDate ? editStartDate.toISOString() : now;
      } else if (editType === 'time-off') {
        // Para "time-off", usar exatamente as datas fornecidas
        if (editEndDate) {
          calculatedEndDate = editEndDate.toISOString();
        } else if (editStartDate) {
          // Se não há end_date, usar start_date como end_date (folga de 1 dia)
          calculatedEndDate = editStartDate.toISOString();
        } else {
          calculatedEndDate = now;
        }
      } else {
        // Para outros tipos (early-departure, lateness)
        calculatedEndDate = editEndDate ? editEndDate.toISOString() : undefined;
      }

      const updateData: any = {
        // Enviar o tipo correto para o backend (o backend já sabe lidar com 'absence')
        type: editType,
        user_id: editUserId,
        reason: editReason,
        start_date: editStartDate ? editStartDate.toISOString() : now,
        end_date: calculatedEndDate,
        time: editTime || undefined,
        arrival_time: editArrivalTime || undefined,
        status: editStatus
      };
      
      
      // Adicionar substituto se selecionado
      if (editSubstituteId && editSubstituteId !== 'none') {
        updateData.substitute_id = editSubstituteId;
      }
      
      
      const { data, error } = await updateRequest(selectedRequest.id, updateData);
      
      
      if (error) {
        console.error('Erro ao atualizar solicitação:', error);
        
        // Tente uma abordagem alternativa se for erro de RLS
        if (error.code === '42501') {
          console.log('Tentando abordagem alternativa devido a erro de RLS...');
          
          // Para casos de absence, tentar manipular diretamente as tabelas
          if (isAbsence) {
            // Verificar se já existe na tabela time_off
            const { data: existingTO, error: existingTOError } = await supabase
              .from('time_off')
              .select('*')
              .eq('id', selectedRequest.id)
              .maybeSingle();
            
            if (existingTOError && existingTOError.code !== 'PGRST116') {
              throw existingTOError;
            }
            
            // Se existir, atualizar
            if (existingTO) {
              const updateData: any = {
                user_id: editUserId,
                start_date: editStartDate ? editStartDate.toISOString() : now,
                end_date: editStartDate ? editStartDate.toISOString() : now,
                reason: editReason,
                status: editStatus,
                updated_at: now
              };
              
              // Adicionar substituto se selecionado (para folgas e faltas)
              if (isAbsence && editSubstituteId && editSubstituteId !== 'none') {
                updateData.substitute_id = editSubstituteId;
              }
              
              const { error: updateError } = await supabase
                .from('time_off')
                .update(updateData)
                .eq('id', selectedRequest.id);
              
              if (updateError) throw updateError;
            } 
            // Se não existir, inserir
            else {
              const insertData: any = {
                id: selectedRequest.id,
                user_id: editUserId,
                start_date: editStartDate ? editStartDate.toISOString() : now,
                end_date: editStartDate ? editStartDate.toISOString() : now,
                reason: editReason,
                status: editStatus
              };
              
              // Adicionar substituto se selecionado (para folgas e faltas)
              if (isAbsence && editSubstituteId && editSubstituteId !== 'none') {
                insertData.substitute_id = editSubstituteId;
              }
              
              const { error: insertError } = await supabase
                .from('time_off')
                .insert(insertData);
              
              if (insertError) throw insertError;
            }
            
            // Atualizar ou inserir na tabela requests para manter consistência
            const { data: existingReq, error: existingReqError } = await supabase
              .from('requests')
              .select('*')
              .eq('id', selectedRequest.id)
              .maybeSingle();
            
            if (existingReqError && existingReqError.code !== 'PGRST116') {
              throw existingReqError;
            }
            
            if (existingReq) {
              await supabase
                .from('requests')
                .update({
                  user_id: editUserId,
                  type: 'time-off',
                  start_date: editStartDate ? editStartDate.toISOString() : now,
                  end_date: editStartDate ? editStartDate.toISOString() : now,
                  reason: editReason,
                  status: editStatus,
                  updated_at: now
                })
                .eq('id', selectedRequest.id);
            } else {
              await supabase
                .from('requests')
                .insert({
                  id: selectedRequest.id,
                  user_id: editUserId,
                  type: 'time-off',
                  start_date: editStartDate ? editStartDate.toISOString() : now,
                  end_date: editStartDate ? editStartDate.toISOString() : now,
                  reason: editReason,
                  status: editStatus
                });
            }
          } else {
            toast('Erro ao atualizar solicitação', {
              description: error.message
            });
            return;
          }
        } else {
          toast('Erro ao atualizar solicitação', {
            description: error.message
          });
          return;
        }
      }
      
      // Atualizar a lista de solicitações
      const updatedRequests = requests.map(req => {
        if (req.id === selectedRequest.id) {
          const userName = users.find(u => u.id === editUserId)?.full_name || req.userName;
          
          return {
            ...req,
            type: editType as Requestable['type'], // Usar o tipo correto
            user_id: editUserId,
            userName: userName,
            reason: editReason,
            date: editStartDate ? editStartDate.toISOString() : req.date,
            endDate: isAbsence
              ? (editStartDate ? editStartDate.toISOString() : req.date)
              : (editEndDate ? editEndDate.toISOString() : req.endDate),
            time: editTime,
            arrivalTime: editArrivalTime,
            status: editStatus
          } as Requestable;
        }
        return req;
      });
      
      setRequests(updatedRequests);
      toast('Solicitação atualizada com sucesso');
      closeEditDialog();
      
      // Recarregar solicitações para garantir consistência
      loadRequests();
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
      toast('Erro ao atualizar solicitação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getAllUsers();
        if (result.success && result.data) {
          setUsers(result.data.map(user => ({
            id: user.id,
                      first_name: user.first_name,
            full_name: formatEmployeeName(user)
          })));
        } else {
          console.error('Erro ao carregar usuários:', result.error);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <RLSChecker />
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Solicitações</CardTitle>
                  <CardDescription>
                    Gerencie as solicitações de folgas, saídas antecipadas e atrasos
                  </CardDescription>
                </div>

              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar solicitações..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filtrar solicitações</DialogTitle>
                      <DialogDescription>
                        Selecione os filtros desejados para as solicitações.
                      </DialogDescription>
                    </DialogHeader>
                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as StatusType | 'all')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="pending">Pendentes</SelectItem>
                          <SelectItem value="approved">Aprovadas</SelectItem>
                          <SelectItem value="rejected">Rejeitadas</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <div className="relative overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Substituto</TableHead>
                        <TableHead>Data da Solicitação</TableHead>
                        <TableHead>Data Pedida</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={`${request.id}-${request.type}`}>
                          <TableCell>{request.userName}</TableCell>
                          <TableCell>
                            {request.type === 'time-off' && 'Folga'}
                            {request.type === 'early-departure' && 'Saída Antecipada'}
                            {request.type === 'lateness' && 'Atraso'}
                            {request.type === 'absence' && 'Falta'}
                          </TableCell>
                          <TableCell>{request.reason}</TableCell>
                          <TableCell>
                            {request.substituteName || '-'}
                          </TableCell>
                          <TableCell>{formatDateOnly(new Date(request.created_at))}</TableCell>
                          <TableCell>{formatDateOnly(new Date(request.date))}</TableCell>
                          <TableCell>
                            <StatusBadge 
                      status={request.status} 
                      reviewerName={request.reviewerName}
                      showReviewerInfo={true}
                    />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {/* Botão Editar - apenas para admin */}
                              {canFullyEditRequests && (
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(request)}>
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Editar
                                </Button>
                              )}
                              {/* Botão Aprovar/Rejeitar - para admin e superuser */}
                              {request.status === 'pending' && canEditRequests && (
                                <Button variant="ghost" size="sm" onClick={() => openDialog(request)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Aprovar/Rejeitar
                                </Button>
                              )}
                              {/* Botão Ver - quando não pode aprovar/rejeitar */}
                              {(request.status !== 'pending' || !canEditRequests) && (
                                <Button variant="ghost" size="sm" onClick={() => openDialog(request)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Ver
                                </Button>
                              )}
                              {/* Botão Excluir - apenas para admin */}
                              {canFullyEditRequests && (
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteConfirm(request.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            Nenhuma solicitação encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>

      {/* Dialog to show request details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a solicitação.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Usuário</Label>
                  <Input id="userName" value={selectedRequest.userName} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Input id="type" value={
                    selectedRequest.type === 'time-off' ? 'Folga' :
                    selectedRequest.type === 'early-departure' ? 'Saída Antecipada' :
                    selectedRequest.type === 'lateness' ? 'Atraso' :
                    selectedRequest.type === 'absence' ? 'Falta' : ''
                  } disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea id="reason" value={selectedRequest.reason} disabled />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" value={format(new Date(selectedRequest.date), 'yyyy-MM-dd', { locale: ptBR })} disabled />
                </div>
                {selectedRequest.endDate && selectedRequest.type === 'time-off' && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input id="endDate" value={format(new Date(selectedRequest.endDate), 'yyyy-MM-dd', { locale: ptBR })} disabled />
                  </div>
                )}
                {selectedRequest.time && selectedRequest.type === 'early-departure' && (
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora de Saída</Label>
                    <Input id="time" value={selectedRequest.time} disabled />
                  </div>
                )}
                {selectedRequest.arrivalTime && selectedRequest.type === 'lateness' && (
                  <div className="space-y-2">
                    <Label htmlFor="arrivalTime">Hora de Chegada</Label>
                    <Input id="arrivalTime" value={selectedRequest.arrivalTime} disabled />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                                    <StatusBadge 
                      status={selectedRequest.status} 
                      reviewerName={selectedRequest.reviewerName}
                      showReviewerInfo={true}
                    />
              </div>
              {selectedRequest.status === 'pending' && canEditRequests && (
                <>
                  {/* Campo de seleção de substituto */}
                  <div className="space-y-2">
                    <Label htmlFor="substitute">Substituto</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      O líder primário do grupo será pré-selecionado automaticamente. Todos os líderes disponíveis no sistema são mostrados.
                    </div>
                    {isLoadingSubstitutes ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Carregando líderes disponíveis...</span>
                      </div>
                    ) : availableSubstitutes.length > 0 ? (
                      <Select value={selectedSubstitute} onValueChange={setSelectedSubstitute}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um substituto (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum substituto</SelectItem>
                          {availableSubstitutes.map((substitute) => (
                            <SelectItem key={substitute.id} value={substitute.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {substitute.full_name}
                                  {substitute.isPrimary && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Líder Primário
                                    </span>
                                  )}
                                  {substitute.isSecondary && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Líder Secundário
                                    </span>
                                  )}
                                  {substitute.isGroupLeader && !substitute.isPrimary && !substitute.isSecondary && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                      Líder de Grupo
                                    </span>
                                  )}
                                  {substitute.role === 'admin' && (
                                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      Administrador
                                    </span>
                                  )}
                                  {substitute.role === 'superuser' && !substitute.isGroupLeader && (
                                    <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                      Superusuário
                                    </span>
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                        Nenhum líder disponível para substituição
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rejectReason">Motivo da Rejeição</Label>
                    <Textarea 
                      id="rejectReason" 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Informe o motivo da rejeição (opcional)"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={closeDialog}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        rejectRequest(selectedRequest.id);
                      }}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => {
                        approveRequest(selectedRequest.id);
                        closeDialog();
                      }}
                    >
                      Aprovar
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog to edit request */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Solicitação</DialogTitle>
            <DialogDescription>
              Edite as informações da solicitação
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editType">Tipo</Label>
                <Select
                  value={editType}
                  onValueChange={(value) => setEditType(value as 'time-off' | 'early-departure' | 'lateness' | 'absence')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time-off">Folga</SelectItem>
                    <SelectItem value="early-departure">Saída Antecipada</SelectItem>
                    <SelectItem value="lateness">Atraso</SelectItem>
                    <SelectItem value="absence">Falta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editUserId">Funcionário</Label>
                <Select
                  value={editUserId}
                  onValueChange={setEditUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editReason">Motivo</Label>
                <Textarea 
                  id="editReason" 
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Informe o motivo da solicitação"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editStartDate ? (
                          format(editStartDate, "yyyy-MM-dd", { locale: ptBR })
                        ) : (
                          "Selecione uma data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editStartDate}
                        onSelect={setEditStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {editType === 'time-off' && (
                  <div className="space-y-2">
                    <Label htmlFor="editEndDate">Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editEndDate ? (
                            format(editEndDate, "yyyy-MM-dd", { locale: ptBR })
                          ) : (
                            "Selecione uma data"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={editEndDate}
                          onSelect={setEditEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {editType === 'early-departure' && (
                  <div className="space-y-2">
                    <Label htmlFor="editTime">Hora de Saída</Label>
                    <Input
                      id="editTime"
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                    />
                  </div>
                )}
                
                {editType === 'lateness' && (
                  <div className="space-y-2">
                    <Label htmlFor="editArrivalTime">Hora de Chegada</Label>
                    <Input
                      id="editArrivalTime"
                      type="time"
                      value={editArrivalTime}
                      onChange={(e) => setEditArrivalTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {/* Campo de substituto - apenas para admins/superusers */}
              {(user?.role === 'admin' || user?.role === 'superuser') && (
                <div className="space-y-2">
                  <Label htmlFor="editSubstitute">Substituto (Opcional)</Label>
                  <Select 
                    value={editSubstituteId} 
                    onValueChange={setEditSubstituteId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um substituto..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum substituto</SelectItem>
                      {users
                        .sort((a, b) => {
                          // Primeiro superusers, depois admins, depois funcionários
                          const roleOrder = { superuser: 1, admin: 2, funcionario: 3 };
                          const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 4;
                          const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 4;
                          
                          if (aOrder !== bOrder) {
                            return aOrder - bOrder;
                          }
                          // Se mesmo role, ordernar por nome
                          return a.full_name.localeCompare(b.full_name);
                        })
                        .map((userOption) => (
                          <SelectItem key={userOption.id} value={userOption.id}>
                            <div className="flex items-center space-x-2">
                              <span>{userOption.full_name}</span>
                              {userOption.role === 'admin' && (
                                <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Admin</span>
                              )}
                              {userOption.role === 'superuser' && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Super</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <RadioGroup value={editStatus} onValueChange={(value) => setEditStatus(value as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="pending" />
                    <Label htmlFor="pending">Pendente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="approved" id="approved" />
                    <Label htmlFor="approved">Aprovado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rejected" id="rejected" />
                    <Label htmlFor="rejected">Rejeitado</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={closeEditDialog}>
                  Cancelar
                </Button>
                <Button onClick={saveEdit}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog to confirm deletion */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={closeDeleteConfirm}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteRequest}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
