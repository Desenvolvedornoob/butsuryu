import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Plus, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { toast } from 'sonner';
import GroupModal from '@/components/GroupModal';
import { supabase } from '@/integrations/supabase/client';
import { formatEmployeeName } from '@/utils/name-formatter';

const shiftDefaults = {
  'hayaban': { startTime: '08:00', endTime: '17:00', breakTime: '12:00', breakDuration: '1h' },
  'osoban': { startTime: '17:00', endTime: '02:00', breakTime: '21:00', breakDuration: '1h' },
  'hirokin': { startTime: '22:00', endTime: '07:00', breakTime: '02:00', breakDuration: '1h' }
};

interface Group {
  id: string;
  name: string;
  responsible: string;
  shifts: string[];
  primaryLeader: string;
  secondaryLeader: string;
  status: 'active' | 'inactive';
  shiftsWithDefaults?: any[];
  employees?: Array<{ id: string; name: string; department: string; prestadora: string }>;
}

export default function Groups() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isObserver = user?.role === 'observador';
  
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState<Partial<Group>>({
    name: '',
    responsible: '',
    shifts: [],
    primaryLeader: '',
    secondaryLeader: '',
    status: 'active'
  });

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');
        
      if (groupsError) {
        throw groupsError;
      }
      
      if (!groupsData || groupsData.length === 0) {
        setGroups([]);
        return;
      }
      
      const groupsWithShifts = await Promise.all(
        groupsData.map(async (group) => {
          // Buscar turnos do grupo
          const { data: shiftsData, error: shiftsError } = await supabase
            .from('group_shifts')
            .select('shift_name, start_time, end_time, break_time, break_duration')
            .eq('group_id', group.id);
            
          if (shiftsError) {
            console.error("Error fetching shifts:", shiftsError);
          }
          
          // Buscar funcionários do grupo usando o campo 'responsible' do grupo
          const { data: employeesData, error: employeesError } = await supabase
            .from('profiles')
            .select('id, first_name, department, prestadora')
            .eq('responsible', group.responsible)
            .eq('status', 'active');
            
          if (employeesError) {
            console.error(`Error fetching employees for group ${group.name}:`, employeesError);
          }
          
          // Transformar os dados dos funcionários
          const employees = employeesData ? employeesData.map(employee => ({
            id: employee.id,
            name: formatEmployeeName(employee),
            department: employee.department || 'N/A',
            prestadora: employee.prestadora || 'N/A'
          })) : [];
          
          return {
            ...group,
            id: group.id,
            name: group.name,
            responsible: group.responsible,
            primaryLeader: group.primary_leader,
            secondaryLeader: group.secondary_leader || '',
            status: group.status as 'active' | 'inactive',
            shifts: shiftsData?.map(shift => shift.shift_name) || [],
            employees: employees
          };
        })
      );
      
      setGroups(groupsWithShifts);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error('Erro ao carregar os grupos');
      setGroups([]); // Definir array vazio em caso de erro
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenNewGroupModal = () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar novos grupos');
      return;
    }
    setIsNewGroupModalOpen(true);
  };

  const handleOpenEditGroupModal = (group: Group) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar grupos');
      return;
    }
    setSelectedGroup({ ...group });
    setIsEditGroupModalOpen(true);
  };

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setIsDetailsModalOpen(true);
  };

  const handleNewGroup = async (groupData: Partial<Group>) => {
    if (isLoading) return;
    
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar grupos');
      return;
    }

    try {
      setIsLoading(true);
      
      if (groupData.name && groupData.responsible && groupData.primaryLeader) {
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
          const shiftsToInsert = groupData.shifts.map(shift => {
            const defaults = shiftDefaults[shift as keyof typeof shiftDefaults] || {
              startTime: '', 
              endTime: '', 
              breakTime: '', 
              breakDuration: '' 
            };
            
            return {
              group_id: groupResult.id,
              shift_name: shift,
              start_time: defaults.startTime,
              end_time: defaults.endTime,
              break_time: defaults.breakTime,
              break_duration: defaults.breakDuration
            };
          });
          
          const { error: shiftsError } = await supabase
            .from('group_shifts')
            .insert(shiftsToInsert);
            
          if (shiftsError) {
            console.error("Error inserting shifts:", shiftsError);
          }
        }
        
        await fetchGroups();
        setIsNewGroupModalOpen(false);
        setNewGroup({
          name: '',
          responsible: '',
          shifts: [],
          primaryLeader: '',
          secondaryLeader: '',
          status: 'active'
        });
        toast.success('Grupo criado com sucesso!');
      } else {
        toast.error('Preencha todos os campos obrigatórios');
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error('Erro ao criar grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGroup = async (groupData: Partial<Group>) => {
    if (isLoading) return;
    
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar grupos');
      return;
    }

    try {
      setIsLoading(true);
      
      if (groupData.id && groupData.name && groupData.responsible && groupData.primaryLeader) {
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
          const shiftsToInsert = groupData.shifts.map(shift => ({
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
        
        await fetchGroups();
        setIsEditGroupModalOpen(false);
        setSelectedGroup(null);
        toast.success('Grupo atualizado com sucesso!');
      }
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error('Erro ao atualizar grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGroupStatus = async (groupId: string) => {
    if (isLoading) return;
    
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar status de grupos');
      return;
    }

    try {
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
      
      toast.success('Status do grupo alterado com sucesso!');
    } catch (error) {
      console.error("Error toggling group status:", error);
      toast.error('Erro ao alterar status do grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNewGroupModal = () => {
    if (!isNewGroupModalOpen) {
      setNewGroup({
        name: '',
        responsible: '',
        shifts: [],
        primaryLeader: '',
        secondaryLeader: '',
        status: 'active'
      });
    }
  };

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Grupos</h1>
              <p className="text-muted-foreground">
                {isLoadingData ? (
                  "Carregando grupos..."
                ) : (
                  `${groups.length} ${groups.length === 1 ? 'grupo encontrado' : 'grupos encontrados'}`
                )}
              </p>
            </div>
            {isAdmin ? (
              <Dialog open={isNewGroupModalOpen} onOpenChange={setIsNewGroupModalOpen}>
                <Button onClick={handleOpenNewGroupModal} disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
                <GroupModal
                  isOpen={isNewGroupModalOpen}
                  onClose={() => setIsNewGroupModalOpen(false)}
                  group={newGroup}
                  onSave={handleNewGroup}
                  isLoading={isLoading}
                  isEditing={false}
                />
              </Dialog>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Acesso Restrito</AlertTitle>
                <AlertDescription>
                  Apenas administradores podem gerenciar grupos.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Grupos</CardTitle>
              <CardDescription>
                Gerencie os grupos de trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando grupos...</span>
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum grupo encontrado</h3>
                  <p className="text-gray-500 mb-4 max-w-sm">
                    {isAdmin 
                      ? "Comece criando seu primeiro grupo de trabalho."
                      : "Ainda não há grupos cadastrados no sistema."
                    }
                  </p>
                  {isAdmin && (
                    <Button onClick={handleOpenNewGroupModal}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Grupo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Responsável</TableHead>
                        <TableHead className="font-semibold">Turnos</TableHead>
                        <TableHead className="font-semibold">Funcionários</TableHead>
                        <TableHead className="font-semibold">Líder Primário</TableHead>
                        <TableHead className="font-semibold">Líder Secundário</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow key={group.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>{group.name}</TableCell>
                          <TableCell>{group.responsible}</TableCell>
                          <TableCell>{group.shifts.join(', ')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {group.employees?.length || 0} funcionários
                              </span>
                              {group.employees && group.employees.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(group);
                                  }}
                                  className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  Ver lista
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{group.primaryLeader}</TableCell>
                          <TableCell>{group.secondaryLeader}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              group.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {group.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleOpenEditGroupModal(group)}
                                    disabled={isLoading}
                                  >
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleGroupStatus(group.id)}
                                    disabled={isLoading}
                                  >
                                    {group.status === 'active' ? 'Desativar' : 'Ativar'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isEditGroupModalOpen} onOpenChange={setIsEditGroupModalOpen}>
            {selectedGroup && (
              <GroupModal
                isOpen={isEditGroupModalOpen}
                onClose={() => setIsEditGroupModalOpen(false)}
                group={selectedGroup}
                onSave={handleEditGroup}
                isLoading={isLoading}
                isEditing={true}
              />
            )}
          </Dialog>

          {/* Modal de Detalhes dos Funcionários - Simples como Factories */}
          <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Funcionários do {selectedGroup?.name}</DialogTitle>
                <DialogDescription>
                  Lista completa dos funcionários deste grupo
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {selectedGroup && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Informações do Grupo</h3>
                      <div className="mt-2 space-y-2">
                        <p><span className="font-medium">Responsável:</span> {selectedGroup.responsible}</p>
                        <p><span className="font-medium">Líder Primário:</span> {selectedGroup.primaryLeader}</p>
                        <p><span className="font-medium">Líder Secundário:</span> {selectedGroup.secondaryLeader || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium">Funcionários</h3>
                      <div className="mt-2">
                        {selectedGroup.employees && selectedGroup.employees.length > 0 ? (
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Departamento</TableHead>
                                  <TableHead>Prestadora</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedGroup.employees.map((employee) => (
                                  <TableRow key={employee.id}>
                                    <TableCell>{employee.name}</TableCell>
                                    <TableCell>{employee.department}</TableCell>
                                    <TableCell>{employee.prestadora}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Nenhum funcionário associado a este grupo</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedTransition>
    </>
  );
}