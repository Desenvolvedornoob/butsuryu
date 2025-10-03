import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, MoreVertical, Users, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import ShiftModal from '@/components/ShiftModal';
import GroupModal from '@/components/GroupModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  breakDuration: string;
  status: 'active' | 'inactive';
  originalName?: string;
}

interface Group {
  id: string;
  name: string;
  responsible: string;
  shifts: Shift[];
  status: 'active' | 'inactive';
  primaryLeader: string;
  secondaryLeader: string;
}

interface GroupForModal {
  id: string;
  name: string;
  responsible: string;
  shifts: string[];
  status: 'active' | 'inactive';
  primaryLeader: string;
  secondaryLeader: string;
}

export default function Shifts() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState(false);
  const [isDeleteShiftModalOpen, setIsDeleteShiftModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newGroup, setNewGroup] = useState<Partial<GroupForModal>>({
    name: '',
    responsible: '',
    primaryLeader: '',
    secondaryLeader: '',
    shifts: [],
    status: 'active'
  });
  const [newShift, setNewShift] = useState<Partial<Shift>>({
    name: '',
    startTime: '',
    endTime: '',
    breakTime: '',
    breakDuration: '',
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const fetchGroups = async () => {
    try {
      setIsLoadingData(true);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');
        
      if (groupsError) {
        throw groupsError;
      }
      
      const groupsWithShifts = await Promise.all(
        groupsData.map(async (group) => {
          const { data: shiftsData, error: shiftsError } = await supabase
            .from('group_shifts')
            .select('shift_name, start_time, end_time, break_time, break_duration')
            .eq('group_id', group.id);
            
          if (shiftsError) {
            console.error("Error fetching shifts:", shiftsError);
            return {
              ...group,
              id: group.id,
              name: group.name,
              responsible: group.responsible,
              primaryLeader: group.primary_leader,
              secondaryLeader: group.secondary_leader || '',
              status: group.status as 'active' | 'inactive',
              shifts: []
            };
          }
          
          const shifts: Shift[] = shiftsData.map(shift => ({
            id: `${group.id}-${shift.shift_name}`,
            name: shift.shift_name,
            startTime: shift.start_time || getShiftTime(shift.shift_name, 'start'),
            endTime: shift.end_time || getShiftTime(shift.shift_name, 'end'),
            breakTime: shift.break_time || getShiftTime(shift.shift_name, 'break'),
            breakDuration: shift.break_duration || '1h',
            status: 'active'
          }));
          
          return {
            ...group,
            id: group.id,
            name: group.name,
            responsible: group.responsible,
            primaryLeader: group.primary_leader,
            secondaryLeader: group.secondary_leader || '',
            status: group.status as 'active' | 'inactive',
            shifts
          };
        })
      );
      
      setGroups(groupsWithShifts);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error('Erro ao carregar os grupos');
    } finally {
      setIsLoadingData(false);
    }
  };

  const getShiftTime = (shiftName: string, type: 'start' | 'end' | 'break') => {
    const shiftTimes = {
      'hayaban': { start: '08:00', end: '17:00', break: '12:00' },
      'osoban': { start: '17:00', end: '02:00', break: '21:00' },
      'hirokin': { start: '22:00', end: '07:00', break: '02:00' }
    };
    
    const shift = shiftTimes[shiftName as keyof typeof shiftTimes] || 
                 { start: '00:00', end: '00:00', break: '00:00' };
    
    return shift[type];
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const convertGroupToModalFormat = (group: Group): GroupForModal => {
    return {
      ...group,
      shifts: group.shifts.map(shift => shift.name)
    };
  };

  const convertModalGroupToGroupFormat = (modalGroup: Partial<GroupForModal>): Partial<Group> => {
    if (!modalGroup.shifts) return modalGroup as unknown as Partial<Group>;
    
    const group: Partial<Group> = {
      ...modalGroup,
      shifts: modalGroup.shifts.map(shiftName => ({
        id: `${modalGroup.id}-${shiftName}`,
        name: shiftName,
        startTime: getShiftTime(shiftName, 'start'),
        endTime: getShiftTime(shiftName, 'end'),
        breakTime: getShiftTime(shiftName, 'break'),
        breakDuration: '1h',
        status: 'active'
      }))
    };
    
    return group;
  };

  const handleNewGroup = async (groupData: Partial<GroupForModal>) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar grupos');
      return;
    }
    
    try {
      if (isLoading) return;
      
      setIsLoading(true);
      
      if (!groupData.name || !groupData.responsible || !groupData.primaryLeader) {
        toast.error("Preencha todos os campos obrigatórios.");
        setIsLoading(false);
        return;
      }
      
      const { data: groupResult, error: groupError } = await supabase
        .from('groups')
        .insert([
          {
            name: groupData.name,
            responsible: groupData.responsible,
            primary_leader: groupData.primaryLeader,
            secondary_leader: groupData.secondaryLeader || null,
            status: 'active'
          }
        ])
        .select('*')
        .single();
        
      if (groupError) {
        throw groupError;
      }
      
      if (groupData.shifts && groupData.shifts.length > 0 && groupResult) {
        const shiftNames = groupData.shifts;
            
        if (shiftNames.length > 0) {
          const shiftsToInsert = shiftNames.map(shift => ({
            group_id: groupResult.id,
            shift_name: shift
          }));
          
          const { error: shiftsError } = await supabase
            .from('group_shifts')
            .insert(shiftsToInsert);
            
          if (shiftsError) {
            console.error("Error inserting shifts:", shiftsError);
          }
        }
      }
      
      await fetchGroups();
      
      setIsNewGroupModalOpen(false);
      
      toast.success(`O grupo ${groupData.name} foi criado com sucesso.`);
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      toast.error("Ocorreu um erro ao criar o grupo. Tente novamente.");
    } finally {
      setIsLoading(false);
      setNewGroup({
        name: '',
        responsible: '',
        primaryLeader: '',
        secondaryLeader: '',
        shifts: [],
        status: 'active'
      });
    }
  };

  const handleEditGroup = async (groupData: Partial<GroupForModal>) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar grupos');
      return;
    }
    
    try {
      if (isLoading) return;
      
      setIsLoading(true);
      
      if (!groupData.id || !groupData.name || !groupData.responsible || !groupData.primaryLeader) {
        toast.error("Dados incompletos ou inválidos.");
        setIsLoading(false);
        return;
      }
      
      const { error: groupError } = await supabase
        .from('groups')
        .update({
          name: groupData.name,
          responsible: groupData.responsible,
          primary_leader: groupData.primaryLeader,
          secondary_leader: groupData.secondaryLeader || null,
          status: groupData.status
        })
        .eq('id', groupData.id);
        
      if (groupError) {
        throw groupError;
      }
      
      const { error: deleteShiftsError } = await supabase
        .from('group_shifts')
        .delete()
        .eq('group_id', groupData.id);
        
      if (deleteShiftsError) {
        console.error("Error deleting shifts:", deleteShiftsError);
      }
      
      if (groupData.shifts && groupData.shifts.length > 0) {
        const shiftNames = groupData.shifts;
            
        if (shiftNames.length > 0) {
          const shiftsToInsert = shiftNames.map(shift => ({
            group_id: groupData.id as string,
            shift_name: shift
          }));
          
          const { error: shiftsError } = await supabase
            .from('group_shifts')
            .insert(shiftsToInsert);
            
          if (shiftsError) {
            console.error("Error inserting shifts:", shiftsError);
          }
        }
      }
      
      await fetchGroups();
      
      setIsEditGroupModalOpen(false);
      
      toast.success("As alterações foram salvas com sucesso.");
    } catch (error) {
      console.error("Erro ao editar grupo:", error);
      toast.error("Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsLoading(false);
      setNewGroup({
        name: '',
        responsible: '',
        primaryLeader: '',
        secondaryLeader: '',
        shifts: [],
        status: 'active'
      });
      setTimeout(() => {
        setSelectedGroup(null);
      }, 100);
    }
  };

  const handleToggleGroupStatus = async (groupId: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar grupos');
      return;
    }
    
    try {
      if (isLoading) return;
      
      setIsLoading(true);
      
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        throw new Error('Grupo não encontrado');
      }
      
      const newStatus = group.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('groups')
        .update({ status: newStatus })
        .eq('id', groupId);
        
      if (error) {
        throw error;
      }
      
      await fetchGroups();
      
      toast.success(`O grupo foi ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (error) {
      console.error("Erro ao alterar status do grupo:", error);
      toast.error("Ocorreu um erro ao alterar o status do grupo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewShift = async (shiftData: Partial<Shift>) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    try {
      if (isLoading || !selectedGroup) return;
      
      setIsLoading(true);
      
      if (!shiftData.name || !shiftData.startTime || !shiftData.endTime) {
        toast.error("Preencha todos os campos obrigatórios.");
        setIsLoading(false);
        return;
      }
      
      const shiftName = shiftData.name.toLowerCase();
      
      if (['hayaban', 'osoban', 'hirokin'].includes(shiftName)) {
        const { data: existingShifts, error: checkError } = await supabase
          .from('group_shifts')
          .select('shift_name')
          .eq('group_id', selectedGroup.id)
          .eq('shift_name', shiftName);
          
        if (checkError) {
          console.error("Erro ao verificar turnos existentes:", checkError);
          throw checkError;
        }
        
        if (existingShifts && existingShifts.length > 0) {
          toast.error(`O turno ${shiftName} já existe neste grupo.`);
          setIsLoading(false);
          return;
        }
        
        const { error } = await supabase
          .from('group_shifts')
          .insert({
            group_id: selectedGroup.id,
            shift_name: shiftName,
            start_time: shiftData.startTime,
            end_time: shiftData.endTime,
            break_time: shiftData.breakTime,
            break_duration: shiftData.breakDuration
          });
          
        if (error) {
          throw error;
        }
        
        await fetchGroups();
        
        setIsNewShiftModalOpen(false);
        
        toast.success(`O turno ${shiftData.name} foi adicionado com sucesso.`);
      } else {
        toast.error("O nome do turno deve ser hayaban, osoban ou hirokin.");
      }
    } catch (error) {
      console.error("Erro ao adicionar turno:", error);
      toast.error("Ocorreu um erro ao adicionar o turno. Tente novamente.");
    } finally {
      setIsLoading(false);
      setNewShift({
        name: '',
        startTime: '',
        endTime: '',
        breakTime: '',
        breakDuration: '',
        status: 'active'
      });
      setTimeout(() => {
        setSelectedGroup(null);
      }, 100);
    }
  };

  const handleEditShift = async (shiftData: Partial<Shift>) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    try {
      if (isLoading || !selectedGroup || !selectedShift) return;
      
      setIsLoading(true);
      
      if (!shiftData.name || !shiftData.startTime || !shiftData.endTime) {
        toast.error("Preencha todos os campos obrigatórios.");
        setIsLoading(false);
        return;
      }
      
      console.log("Dados recebidos para edição:", shiftData);
      
      if (!selectedShift.id || !selectedShift.id.includes('-')) {
        toast.error("ID do turno inválido.");
        setIsLoading(false);
        return;
      }
      
      const lastHyphenIndex = selectedShift.id.lastIndexOf('-');
      const groupId = selectedShift.id.substring(0, lastHyphenIndex);
      const shiftName = selectedShift.id.substring(lastHyphenIndex + 1);
      
      if (groupId !== selectedGroup.id) {
        console.error(`ID do grupo não corresponde: ${groupId} vs ${selectedGroup.id}`);
        toast.error("Erro ao identificar o grupo do turno.");
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('group_shifts')
        .update({
          start_time: shiftData.startTime,
          end_time: shiftData.endTime,
          break_time: shiftData.breakTime,
          break_duration: shiftData.breakDuration
        })
        .eq('group_id', groupId)
        .eq('shift_name', shiftName);
        
      if (error) {
        console.error("Erro ao atualizar turno no banco de dados:", error);
        throw error;
      }
      
      setGroups(prevGroups => 
        prevGroups.map(group => {
          if (group.id === selectedGroup.id) {
            return {
              ...group,
              shifts: group.shifts.map(shift => {
                if (shift.id === selectedShift.id) {
                  return {
                    ...shift,
                    startTime: shiftData.startTime || shift.startTime,
                    endTime: shiftData.endTime || shift.endTime,
                    breakTime: shiftData.breakTime || shift.breakTime,
                    breakDuration: shiftData.breakDuration || shift.breakDuration
                  };
                }
                return shift;
              })
            };
          }
          return group;
        })
      );
      
      setIsEditShiftModalOpen(false);
      
      toast.success("As alterações foram salvas com sucesso.");
    } catch (error: any) {
      console.error("Erro ao editar turno:", error);
      toast.error(error.message || "Ocorreu um erro ao salvar as alterações. Tente novamente.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSelectedShift(null);
        setSelectedGroup(null);
      }, 100);
    }
  };

  const handleToggleShiftStatus = async (groupId: string, shiftId: string) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    toast.info("A funcionalidade de ativar/desativar turnos ainda não está disponível.");
    return;
  };

  const handleDeleteShift = async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    try {
      if (isLoading || !selectedGroup || !selectedShift) return;
      
      setIsLoading(true);
      
      if (!selectedShift.id || !selectedShift.id.includes('-')) {
        toast.error("ID do turno inválido.");
        setIsLoading(false);
        return;
      }
      
      const lastHyphenIndex = selectedShift.id.lastIndexOf('-');
      const groupId = selectedShift.id.substring(0, lastHyphenIndex);
      const shiftName = selectedShift.id.substring(lastHyphenIndex + 1);
      
      if (groupId !== selectedGroup.id) {
        console.error(`ID do grupo não corresponde: ${groupId} vs ${selectedGroup.id}`);
        toast.error("Erro ao identificar o grupo do turno.");
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('group_shifts')
        .delete()
        .eq('group_id', groupId)
        .eq('shift_name', shiftName);
        
      if (error) {
        console.error("Erro ao excluir turno no banco de dados:", error);
        throw error;
      }
      
      setGroups(prevGroups => 
        prevGroups.map(group => {
          if (group.id === selectedGroup.id) {
            return {
              ...group,
              shifts: group.shifts.filter(shift => shift.id !== selectedShift.id)
            };
          }
          return group;
        })
      );
      
      setIsDeleteShiftModalOpen(false);
      
      toast.success("Turno excluído com sucesso.");
    } catch (error: any) {
      console.error("Erro ao excluir turno:", error);
      toast.error(error.message || "Ocorreu um erro ao excluir o turno. Tente novamente.");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSelectedShift(null);
        setSelectedGroup(null);
      }, 100);
    }
  };

  const handleOpenNewShiftModal = (group: Group) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    if (isLoading) return;
    
    setSelectedGroup(JSON.parse(JSON.stringify(group)));
    setNewShift({
      name: '',
      startTime: '',
      endTime: '',
      breakTime: '',
      breakDuration: '',
      status: 'active'
    });
    setIsNewShiftModalOpen(true);
  };

  const handleOpenEditShiftModal = (group: Group, shift: Shift) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    if (isLoading) return;
    
    setSelectedGroup(JSON.parse(JSON.stringify(group)));
    setSelectedShift(JSON.parse(JSON.stringify(shift)));
    setIsEditShiftModalOpen(true);
  };

  const handleOpenEditGroupModal = (group: Group) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar grupos');
      return;
    }
    
    if (isLoading) return;
    
    const groupForModal = convertGroupToModalFormat(group);
    setSelectedGroup(JSON.parse(JSON.stringify(group)));
    setIsEditGroupModalOpen(true);
  };

  const handleOpenDeleteShiftModal = (group: Group, shift: Shift) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem gerenciar turnos');
      return;
    }
    
    if (isLoading) return;
    
    setSelectedGroup(JSON.parse(JSON.stringify(group)));
    setSelectedShift(JSON.parse(JSON.stringify(shift)));
    setIsDeleteShiftModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Grupos</h1>
              <p className="text-muted-foreground">Gerencie os grupos e seus turnos de trabalho</p>
            </div>
            {isAdmin ? (
              <Dialog open={isNewGroupModalOpen} onOpenChange={(open) => {
                if (!isLoading) setIsNewGroupModalOpen(open);
              }}>
                <Button 
                  className="mt-4 md:mt-0" 
                  onClick={() => setIsNewGroupModalOpen(true)}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
                {isNewGroupModalOpen && (
                  <GroupModal
                    isOpen={isNewGroupModalOpen}
                    onClose={() => setIsNewGroupModalOpen(false)}
                    group={newGroup}
                    onSave={handleNewGroup}
                    isLoading={isLoading}
                    isEditing={false}
                  />
                )}
              </Dialog>
            ) : null}
          </div>

          {!isAdmin && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Acesso restrito</AlertTitle>
              <AlertDescription>
                Apenas administradores podem gerenciar grupos. Você pode visualizar os grupos existentes.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-8">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar grupos..."
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex justify-center items-center h-32">
                  <p>Carregando grupos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Líder Primário</TableHead>
                      <TableHead>Líder Secundário</TableHead>
                      <TableHead>Qtde. Turnos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>{group.name}</TableCell>
                          <TableCell>{group.responsible}</TableCell>
                          <TableCell>{group.primaryLeader}</TableCell>
                          <TableCell>{group.secondaryLeader}</TableCell>
                          <TableCell>{group.shifts.length}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              group.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {group.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEditGroupModal(group)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenNewShiftModal(group)}>
                                    Adicionar Turno
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleGroupStatus(group.id)}
                                  >
                                    {group.status === 'active' ? 'Desativar' : 'Ativar'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum grupo encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {groups.map((group) => (
            <Card key={group.id} className="mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      {group.name} - Turnos
                    </CardTitle>
                    <CardDescription>Responsável: {group.responsible}</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleOpenNewShiftModal(group)}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Turno
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Término</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.shifts.length > 0 ? (
                      group.shifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell>{shift.name}</TableCell>
                          <TableCell>{shift.startTime}</TableCell>
                          <TableCell>{shift.endTime}</TableCell>
                          <TableCell>{shift.breakTime}</TableCell>
                          <TableCell>{shift.breakDuration}</TableCell>
                          <TableCell>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenEditShiftModal(group, shift)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenDeleteShiftModal(group, shift)}
                                    className="text-destructive"
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleShiftStatus(group.id, shift.id)}
                                  >
                                    Desativar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum turno cadastrado para este grupo
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedTransition>

      <Dialog open={isEditGroupModalOpen} onOpenChange={(open) => {
        if (!isLoading) setIsEditGroupModalOpen(open);
      }}>
        {isEditGroupModalOpen && selectedGroup && (
          <GroupModal
            isOpen={isEditGroupModalOpen}
            onClose={() => setIsEditGroupModalOpen(false)}
            group={convertGroupToModalFormat(selectedGroup)}
            onSave={handleEditGroup as unknown as (group: Partial<GroupForModal>) => void}
            isLoading={isLoading}
            isEditing={true}
          />
        )}
      </Dialog>

      <Dialog open={isNewShiftModalOpen} onOpenChange={(open) => {
        if (!isLoading) setIsNewShiftModalOpen(open);
      }}>
        {isNewShiftModalOpen && selectedGroup && (
          <ShiftModal
            isOpen={isNewShiftModalOpen}
            onClose={() => setIsNewShiftModalOpen(false)}
            shift={newShift}
            onSave={handleNewShift}
            isLoading={isLoading}
            isEditing={false}
          />
        )}
      </Dialog>

      <Dialog open={isEditShiftModalOpen} onOpenChange={(open) => {
        if (!isLoading) setIsEditShiftModalOpen(open);
      }}>
        {isEditShiftModalOpen && selectedShift && (
          <ShiftModal
            isOpen={isEditShiftModalOpen}
            onClose={() => setIsEditShiftModalOpen(false)}
            shift={selectedShift}
            onSave={handleEditShift}
            isLoading={isLoading}
            isEditing={true}
          />
        )}
      </Dialog>

      <Dialog open={isDeleteShiftModalOpen} onOpenChange={(open) => {
        if (!isLoading) setIsDeleteShiftModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Turno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este turno? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedShift && (
              <div className="space-y-2">
                <p><strong>Nome:</strong> {selectedShift.name}</p>
                <p><strong>Horário:</strong> {selectedShift.startTime} - {selectedShift.endTime}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteShiftModalOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteShift}
              disabled={isLoading}
            >
              {isLoading ? 'Excluindo...' : 'Excluir Turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
