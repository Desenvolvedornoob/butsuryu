import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEmployeeName } from '@/utils/name-formatter';
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, MoreVertical, Building2, Calendar, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isWeekend, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';

interface Factory {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

interface FactoryWithRelations extends Factory {
  shifts: string[];
  holidays: Array<{ date: string; name: string; blocks_time_off?: boolean }>;
  employees: Array<{ id: string; name: string; shift: string }>;
}

const initialFactories = [
  {
    id: 1,
    name: 'Fábrica São Paulo',
    shifts: ['Grupo Manhã', 'Grupo Tarde', 'Grupo Noite'],
    holidays: [
      { date: '2024-01-01', name: 'Ano Novo' },
      { date: '2024-02-12', name: 'Carnaval' }
    ],
    employees: [
      { id: 1, name: 'João Silva', shift: 'Grupo Manhã' },
      { id: 2, name: 'Maria Santos', shift: 'Grupo Tarde' },
      { id: 3, name: 'Pedro Oliveira', shift: 'Grupo Noite' }
    ]
  },
  {
    id: 2,
    name: 'Fábrica Rio de Janeiro',
    shifts: ['Grupo Manhã', 'Grupo Tarde'],
    holidays: [
      { date: '2024-01-01', name: 'Ano Novo' }
    ],
    employees: [
      { id: 4, name: 'Ana Costa', shift: 'Grupo Manhã' },
      { id: 5, name: 'Carlos Lima', shift: 'Grupo Tarde' }
    ]
  },
];

export default function Factories() {
  const { user } = useAuth();
  const [factories, setFactories] = useState<FactoryWithRelations[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<FactoryWithRelations | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editedFactory, setEditedFactory] = useState<FactoryWithRelations | null>(null);
  const [newFactory, setNewFactory] = useState<Omit<FactoryWithRelations, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    address: '',
    shifts: [],
    holidays: [],
    employees: []
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [holidayName, setHolidayName] = useState('');
  const [blocksTimeOff, setBlocksTimeOff] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para sistema de rotação de turnos
  const [shiftRotation, setShiftRotation] = useState<{[key: string]: {turno1: string[], turno2: string[]}}>({});
  const [showShiftCalendar, setShowShiftCalendar] = useState(false);
  
  // Estados para configuração de turno da manhã
  const [morningTurno, setMorningTurno] = useState<number>(1);
  const [showMorningTurnoConfig, setShowMorningTurnoConfig] = useState(false);
  const [dailyLeaveLimit, setDailyLeaveLimit] = useState<number>(2);
  const [showDailyLimitConfig, setShowDailyLimitConfig] = useState(false);
  

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        setIsLoading(true);
        const { data: factoriesData, error: factoriesError } = await supabase
          .from('factories')
          .select('*')
          .order('name');

        if (factoriesError) {
          throw factoriesError;
        }

        // Buscar feriados e grupos para cada fábrica
        const factoriesWithRelations = await Promise.all(
          (factoriesData || []).map(async (factory) => {
            // Buscar feriados
            const { data: holidaysData, error: holidaysError } = await supabase
              .from('holidays')
              .select('*')
              .eq('factory_id', factory.id);

            if (holidaysError) {
              console.error('Error fetching holidays:', holidaysError);
            }

            // Buscar grupos (shifts)
            const { data: shiftsData, error: shiftsError } = await supabase
              .from('shifts')
              .select('*')
              .eq('factory_id', factory.id);

            if (shiftsError) {
              console.error('Error fetching shifts:', shiftsError);
            }
            
            // Buscar funcionários associados a esta fábrica usando a tabela employee_factories
            // Em vez de usar apenas o campo factory_id da tabela profiles
            const { data: employeesData, error: employeesError } = await supabase
              .from('employee_factories')
              .select('employee_id, profiles:employee_id(id, first_name)')
              .eq('factory_id', factory.id);
              
            if (employeesError) {
              console.error('Error fetching employees for factory:', employeesError);
            }
            
            console.log(`Funcionários encontrados para fábrica ${factory.name} via employee_factories:`, employeesData);

            // Transformar os dados para o formato esperado
            const employees = employeesData ? employeesData.map(record => ({
              id: record.profiles.id,
              name: formatEmployeeName(record.profiles),
              shift: ''  // Poderíamos buscar o turno do funcionário se necessário
            })) : [];

            return {
              ...factory,
              holidays: holidaysData || [],
              shifts: shiftsData?.map(shift => shift.name) || [],
              employees: employees
            };
          })
        );

        setFactories(factoriesWithRelations);
      } catch (error) {
        console.error("Error fetching factories:", error);
        toast.error("Erro ao carregar fábricas");
        setFactories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFactories();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const { data, error } = await supabase
          .from('groups')
          .select('name')
          .eq('status', 'active')
          .order('name');

        if (error) {
          throw error;
        }

        const groupNames = data.map(group => group.name);
        setAvailableGroups(groupNames);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Erro ao carregar grupos");
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // Carregar configuração do turno da manhã
  useEffect(() => {
    loadMorningTurnoConfig();
  }, []);



  const handleEdit = async (factory: typeof factories[0]) => {
    setSelectedFactory(factory);
    setEditedFactory({ ...factory });
    setIsEditDialogOpen(true);
    
    // Carregar configurações de turnos da fábrica
    try {
      const { data: shiftConfigData, error } = await supabase
        .from('factory_shift_config')
        .select('turno, groups')
        .eq('factory_id', factory.id);

      if (error) {
        console.error('Erro ao carregar configurações de turnos:', error);
        return;
      }

      if (shiftConfigData && shiftConfigData.length > 0) {
        const turno1 = shiftConfigData.find(config => config.turno === 1)?.groups || [];
        const turno2 = shiftConfigData.find(config => config.turno === 2)?.groups || [];
        
        setShiftRotation(prev => ({
          ...prev,
          [factory.id]: { turno1, turno2 }
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de turnos:', error);
    }

    // Carregar limite global de folgas por dia
    await loadDailyLeaveLimit();
  };

  const handleSave = async () => {
    if (!editedFactory) return;
    
    try {
      // Atualizar dados básicos da fábrica
      const { error: factoryError } = await supabase
        .from('factories')
        .update({
          name: editedFactory.name,
          address: editedFactory.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedFactory.id);

      if (factoryError) throw factoryError;

      // Atualizar grupos (shifts)
      const { error: deleteShiftsError } = await supabase
        .from('shifts')
        .delete()
        .eq('factory_id', editedFactory.id);

      if (deleteShiftsError) throw deleteShiftsError;

      if (editedFactory.shifts.length > 0) {
        const shiftsToInsert = editedFactory.shifts.map(shift => ({
          factory_id: editedFactory.id,
          name: shift,
          start_time: '08:00',
          end_time: '17:00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertShiftsError } = await supabase
          .from('shifts')
          .insert(shiftsToInsert);

        if (insertShiftsError) throw insertShiftsError;
      }

      // Atualizar configurações de turnos
      const currentShiftConfig = shiftRotation[editedFactory.id];
      if (currentShiftConfig) {
        // Deletar configurações antigas
        const { error: deleteShiftConfigError } = await supabase
          .from('factory_shift_config')
          .delete()
          .eq('factory_id', editedFactory.id);

        if (deleteShiftConfigError) throw deleteShiftConfigError;

        // Inserir novas configurações
        const shiftConfigToInsert = [
          {
            factory_id: editedFactory.id,
            turno: 1,
            groups: currentShiftConfig.turno1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            factory_id: editedFactory.id,
            turno: 2,
            groups: currentShiftConfig.turno2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const { error: insertShiftConfigError } = await supabase
          .from('factory_shift_config')
          .insert(shiftConfigToInsert);

        if (insertShiftConfigError) throw insertShiftConfigError;
      }

      // Atualizar feriados
      const { error: deleteHolidaysError } = await supabase
        .from('holidays')
        .delete()
        .eq('factory_id', editedFactory.id);

      if (deleteHolidaysError) throw deleteHolidaysError;

      if (editedFactory.holidays.length > 0) {
        const holidaysToInsert = editedFactory.holidays.map(holiday => ({
          factory_id: editedFactory.id,
          date: holiday.date,
          name: holiday.name,
          blocks_time_off: holiday.blocks_time_off || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: insertHolidaysError } = await supabase
          .from('holidays')
          .insert(holidaysToInsert);

        if (insertHolidaysError) throw insertHolidaysError;
      }

      // Recarregar todas as fábricas
      const { data: factoriesData, error: factoriesError } = await supabase
        .from('factories')
        .select('*')
        .order('name');

      if (factoriesError) throw factoriesError;

      // Buscar feriados e grupos para cada fábrica
      const factoriesWithRelations = await Promise.all(
        (factoriesData || []).map(async (factory) => {
          // Buscar feriados
          const { data: holidaysData, error: holidaysError } = await supabase
            .from('holidays')
            .select('*')
            .eq('factory_id', factory.id);

          if (holidaysError) {
            console.error('Error fetching holidays:', holidaysError);
          }

          // Buscar grupos (shifts)
          const { data: shiftsData, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('factory_id', factory.id);

          if (shiftsError) {
            console.error('Error fetching shifts:', shiftsError);
          }

          return {
            ...factory,
            holidays: holidaysData || [],
            shifts: shiftsData?.map(shift => shift.name) || [],
            employees: []
          };
        })
      );

      setFactories(factoriesWithRelations);
      toast.success('Fábrica atualizada com sucesso!');
      
      setIsEditDialogOpen(false);
      setTimeout(() => {
        setSelectedFactory(null);
        setEditedFactory(null);
      }, 100);
    } catch (error) {
      console.error('Error updating factory:', error);
      toast.error('Erro ao atualizar fábrica');
    }
  };

  const handleAddHoliday = async () => {
    if (!editedFactory || !selectedDate || !holidayName) return;

    const newHoliday = {
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: holidayName,
      blocks_time_off: blocksTimeOff,
      factory_id: editedFactory.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('holidays')
        .insert([newHoliday]);

      if (error) throw error;

      // Atualizar o estado local
      setEditedFactory(prev => {
        if (!prev) return null;
        return {
          ...prev,
          holidays: [...prev.holidays, newHoliday]
        };
      });

      setHolidayName('');
      setBlocksTimeOff(false);
      toast.success('Feriado adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Erro ao adicionar feriado');
    }
  };

  const handleRemoveHoliday = async (date) => {
    if (!editedFactory) return;

    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('factory_id', editedFactory.id)
        .eq('date', date);

      if (error) throw error;

      // Atualizar o estado local
      setEditedFactory(prev => {
        if (!prev) return null;
        return {
          ...prev,
          holidays: prev.holidays.filter(h => h.date !== date)
        };
      });

      toast.success('Feriado removido com sucesso!');
    } catch (error) {
      console.error('Error removing holiday:', error);
      toast.error('Erro ao remover feriado');
    }
  };

  const handleDeleteFactory = async (factoryId) => {
    try {
      const { error } = await supabase
        .from('factories')
        .delete()
        .eq('id', factoryId);

      if (error) throw error;

      // Atualizar o estado local
      const updatedFactories = factories.filter(f => f.id !== factoryId);
      setFactories(updatedFactories);
      toast.success('Fábrica excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting factory:', error);
      toast.error('Erro ao excluir fábrica');
    }
  };

  const isHoliday = (date: Date) => {
    if (!editedFactory) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return editedFactory.holidays.some(holiday => 
      holiday.date === dateStr
    );
  };

  const getHolidayName = (date: Date) => {
    if (!editedFactory) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = editedFactory.holidays.find(h => h.date === dateStr);
    return holiday?.name || null;
  };

  // Função para calcular a semana atual (alternando entre 1 e 2)
  const getCurrentWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;
    return (weekNumber % 2) === 0 ? 2 : 1;
  };

  // Função para obter grupos do turno ativo (1 ou 2)
  const getActiveShiftGroups = (factoryId: string, weekNumber: number) => {
    const factoryRotation = shiftRotation[factoryId];
    if (!factoryRotation) return [];
    
    return weekNumber === 1 ? factoryRotation.turno1 : factoryRotation.turno2;
  };

  // Função para verificar se um grupo está no turno da manhã na semana atual
  const isGroupInMorningShift = (factoryId: string, groupName: string, date: Date) => {
    const weekNumber = getCurrentWeekNumber(date);
    const activeGroups = getActiveShiftGroups(factoryId, weekNumber);
    return activeGroups.includes(groupName);
  };


  // Função para configurar turnos de uma fábrica
  const configureShiftRotation = (factoryId: string, turno1: string[], turno2: string[]) => {
    setShiftRotation(prev => ({
      ...prev,
      [factoryId]: { turno1, turno2 }
    }));
  };

  // Função para carregar configuração do turno da manhã
  const loadMorningTurnoConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('morning_shift_setting')
        .select('morning_turno')
        .eq('id', 'current')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      setMorningTurno(data?.morning_turno || 1);
    } catch (error) {
      console.error('Erro ao carregar configuração do turno da manhã:', error);
    }
  };

  // Função para salvar configuração do turno da manhã
  const saveMorningTurnoConfig = async (turno: number) => {
    try {
      const { error } = await supabase
        .from('morning_shift_setting')
        .upsert({
          id: 'current',
          morning_turno: turno,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMorningTurno(turno);
      toast.success('Configuração do turno da manhã salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração do turno da manhã:', error);
      toast.error('Erro ao salvar configuração do turno da manhã');
    }
  };

  // Função para carregar limite global de folgas por dia
  const loadDailyLeaveLimit = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_leave_limits')
        .select('max_leaves_per_day')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setDailyLeaveLimit(data?.max_leaves_per_day || 2);
    } catch (error) {
      console.error('Erro ao carregar limite de folgas:', error);
      setDailyLeaveLimit(2);
    }
  };

  // Função para salvar limite global de folgas por dia
  const saveDailyLeaveLimit = async (limit: number) => {
    try {
      const { error } = await supabase
        .from('daily_leave_limits')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          max_leaves_per_day: limit,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setDailyLeaveLimit(limit);
      setShowDailyLimitConfig(false);
      toast.success('Configuração de limite de folgas salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar limite de folgas:', error);
      toast.error('Erro ao salvar configuração');
    }
  };


  // Função para obter grupos disponíveis para configuração de turnos
  const getAvailableGroupsForShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      return [];
    }
  };

  const handleAddFactory = async () => {
    if (!newFactory.name) {
      toast.error('O nome da fábrica é obrigatório!');
      return;
    }

    try {
      // Inserir fábrica
      const { data: factoryData, error: factoryError } = await supabase
        .from('factories')
        .insert([{
          name: newFactory.name,
          address: newFactory.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (factoryError) throw factoryError;

      // Inserir grupos (shifts)
      if (newFactory.shifts.length > 0) {
        const shiftsToInsert = newFactory.shifts.map(shift => ({
          factory_id: factoryData.id,
          name: shift,
          start_time: '08:00',
          end_time: '17:00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: shiftsError } = await supabase
          .from('shifts')
          .insert(shiftsToInsert);

        if (shiftsError) throw shiftsError;
      }

      // Inserir feriados
      if (newFactory.holidays.length > 0) {
        const holidaysToInsert = newFactory.holidays.map(holiday => ({
          factory_id: factoryData.id,
          date: holiday.date,
          name: holiday.name,
          blocks_time_off: holiday.blocks_time_off || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: holidaysError } = await supabase
          .from('holidays')
          .insert(holidaysToInsert);

        if (holidaysError) throw holidaysError;
      }

      // Recarregar todas as fábricas
      const { data: factoriesData, error: factoriesError } = await supabase
        .from('factories')
        .select('*')
        .order('name');

      if (factoriesError) throw factoriesError;

      // Buscar feriados e grupos para cada fábrica
      const factoriesWithRelations = await Promise.all(
        (factoriesData || []).map(async (factory) => {
          // Buscar feriados
          const { data: holidaysData, error: holidaysError } = await supabase
            .from('holidays')
            .select('*')
            .eq('factory_id', factory.id);

          if (holidaysError) {
            console.error('Error fetching holidays:', holidaysError);
          }

          // Buscar grupos (shifts)
          const { data: shiftsData, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('factory_id', factory.id);

          if (shiftsError) {
            console.error('Error fetching shifts:', shiftsError);
          }

          return {
            ...factory,
            holidays: holidaysData || [],
            shifts: shiftsData?.map(shift => shift.name) || [],
            employees: []
          };
        })
      );

      setFactories(factoriesWithRelations);
      
      setIsAddDialogOpen(false);
      setTimeout(() => {
        setNewFactory({
          name: '',
          address: '',
          shifts: [],
          holidays: [],
          employees: []
        });
      }, 100);
      
      toast.success('Fábrica adicionada com sucesso!');
    } catch (error) {
      console.error('Error adding factory:', error);
      toast.error('Erro ao adicionar fábrica');
    }
  };

  const handleViewDetails = (factory: typeof factories[0]) => {
    setSelectedFactory(factory);
    setIsDetailsDialogOpen(true);
  };

  const closeEditDialog = () => {
    // Close the dialog first
    setIsEditDialogOpen(false);
    
    // Then reset the state after a small delay
    setTimeout(() => {
      setSelectedFactory(null);
      setEditedFactory(null);
    }, 100);
  };

  const closeDetailsDialog = () => {
    // Close the dialog first
    setIsDetailsDialogOpen(false);
    
    // Then reset the state after a small delay
    setTimeout(() => {
      setSelectedFactory(null);
    }, 100);
  };

  const closeAddDialog = () => {
    // Close the dialog first
    setIsAddDialogOpen(false);
    
    // Then reset the state after a small delay
    setTimeout(() => {
      setNewFactory({
        name: '',
        address: '',
        shifts: [],
        holidays: [],
        employees: []
      });
    }, 100);
  };

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Fábricas</h1>
              <p className="text-muted-foreground">Gerencie as fábricas e seus grupos</p>
            </div>
            {user?.role === 'admin' && (
              <Button 
                className="mt-4 md:mt-0"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Fábrica
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar fábricas..."
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando fábricas...</span>
                </div>
              ) : factories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma fábrica encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione uma nova fábrica para começar
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Fábrica
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupos</TableHead>
                      <TableHead>Feriados</TableHead>
                      <TableHead>Funcionários</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factories?.map((factory) => (
                      <TableRow key={factory.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            {factory.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {factory.shifts?.map((shift) => (
                              <span
                                key={shift}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {shift}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {factory.holidays?.map((holiday) => (
                              <span
                                key={holiday.date}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {holiday.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {factory.employees?.length || 0} funcionários
                          </span>
                          {factory.employees && factory.employees.length > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(factory);
                              }}
                              className="ml-2 text-xs text-blue-600 hover:underline"
                            >
                              Ver lista
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          {user?.role === 'observador' ? (
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(factory)}>
                              Ver detalhes
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(factory)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewDetails(factory)}>
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteFactory(factory.id)}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Fábrica</DialogTitle>
            <DialogDescription>
              Gerencie os dados da fábrica, grupos e feriados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Fábrica</Label>
                <Input
                  id="name"
                  value={editedFactory?.name || ''}
                  onChange={(e) => setEditedFactory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <Label>Grupos Disponíveis</Label>
                {isLoadingGroups ? (
                  <div className="grid grid-cols-1 gap-2 p-4 rounded-md border flex items-center justify-center min-h-[100px]">
                    <p className="text-muted-foreground">Carregando grupos...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 p-4 rounded-md border max-h-[200px] overflow-y-auto">
                    {availableGroups.length > 0 ? (
                      availableGroups.map((group) => (
                        <div key={group} className="flex items-center space-x-2">
                          <Checkbox
                            id={`shift-${group}`}
                            checked={editedFactory?.shifts?.includes(group) || false}
                            onCheckedChange={(checked) => {
                              setEditedFactory(prev => {
                                if (!prev) return null;
                                const newShifts = checked
                                  ? [...(prev.shifts || []), group]
                                  : (prev.shifts || []).filter(s => s !== group);
                                return { ...prev, shifts: newShifts };
                              });
                            }}
                          />
                          <Label htmlFor={`shift-${group}`}>{group}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhum grupo disponível</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Funcionários</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {editedFactory?.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Grupo: {employee.shift}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label>Feriados e Eventos</Label>
                <div className="space-y-4">
                  <div className="p-4 rounded-md border">
                    <TooltipProvider>
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={pt}
                        className="rounded-md"
                        modifiers={{
                          weekend: (date) => isWeekend(date),
                          holiday: (date) => isHoliday(date),
                        }}
                        modifiersStyles={{
                          weekend: {
                            color: '#ef4444', // vermelho
                            fontWeight: 'bold',
                          },
                          holiday: {
                            backgroundColor: '#fce7f3', // rosa claro
                            color: '#db2777', // rosa
                            fontWeight: 'bold',
                          },
                        }}
                        components={{
                          DayContent: ({ date }) => {
                            const holidayName = getHolidayName(date);
                            if (!holidayName) return <span>{format(date, 'd')}</span>;

                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer">{format(date, 'd')}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{holidayName}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          },
                        }}
                      />
                    </TooltipProvider>
                  </div>
                  

                  {/* Seção de Configuração do Turno da Manhã */}
                  <div className="p-4 rounded-md border bg-blue-50">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Configuração do Turno da Manhã</h4>
                          <p className="text-sm text-blue-700">Defina qual turno (ímpar ou par) está de manhã</p>
                        </div>
                        <Button
                          onClick={() => setShowMorningTurnoConfig(!showMorningTurnoConfig)}
                          variant="outline"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {showMorningTurnoConfig ? 'Ocultar' : 'Configurar'} Turno da Manhã
                        </Button>
                      </div>
                      
                      <div className="p-3 bg-white rounded-md border">
                        <div className="text-sm text-gray-600">
                          <strong>Turno atual de manhã:</strong> {morningTurno === 1 ? 'Turno 1 (Semana ímpar)' : 'Turno 2 (Semana par)'}
                          <br />
                          <strong>Semana atual:</strong> {selectedDate ? getCurrentWeekNumber(selectedDate) : getCurrentWeekNumber(new Date())} ({selectedDate ? (getCurrentWeekNumber(selectedDate) === 1 ? 'Ímpar' : 'Par') : (getCurrentWeekNumber(new Date()) === 1 ? 'Ímpar' : 'Par')})
                          <br />
                          <strong>Status:</strong> {selectedDate ? 
                            (getCurrentWeekNumber(selectedDate) === morningTurno ? 'Turno da manhã ativo' : 'Turno da noite ativo') :
                            (getCurrentWeekNumber(new Date()) === morningTurno ? 'Turno da manhã ativo' : 'Turno da noite ativo')
                          }
                        </div>
                      </div>
                      
                      {showMorningTurnoConfig && (
                        <MorningTurnoConfig 
                          currentTurno={morningTurno}
                          onSave={saveMorningTurnoConfig}
                        />
                      )}
                    </div>
                  </div>

                  {/* Seção de Configuração de Limite de Folgas */}
                  <div className="p-4 rounded-md border bg-purple-50">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-900">Configuração Global de Limite de Folgas por Dia</h4>
                          <p className="text-sm text-purple-700">Defina quantas pessoas podem solicitar folga no mesmo dia (TODAS as fábricas)</p>
                        </div>
                        <Button
                          onClick={() => setShowDailyLimitConfig(!showDailyLimitConfig)}
                          variant="outline"
                          size="sm"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {showDailyLimitConfig ? 'Ocultar' : 'Configurar'} Limite
                        </Button>
                      </div>
                      
                      <div className="p-3 bg-white rounded-md border">
                        <div className="text-sm text-gray-600">
                          <strong>Limite atual:</strong> {dailyLeaveLimit} {dailyLeaveLimit === 1 ? 'pessoa' : 'pessoas'} por dia
                          <br />
                          <strong>Descrição:</strong> Máximo de folgas APROVADAS permitidas no mesmo dia (TODAS as fábricas)
                          <br />
                          <strong>Regra:</strong> Folgas pendentes não contam no limite. Só bloqueia quando atingir o limite de aprovadas.
                        </div>
                      </div>
                      
                      {showDailyLimitConfig && (
                        <DailyLeaveLimitConfig 
                          currentLimit={dailyLeaveLimit}
                          onSave={saveDailyLeaveLimit}
                        />
                      )}
                    </div>
                  </div>

                  {/* Seção de Configuração de Turnos */}
                  <div className="p-4 rounded-md border bg-green-50">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">Configuração de Turnos por Semana</h4>
                          <p className="text-sm text-green-700">Configure quais grupos trabalham em cada turno. O sistema alterna automaticamente entre semana ímpar (1) e par (2). Apenas grupos do turno ativo podem solicitar folgas.</p>
                        </div>
                        <Button
                          onClick={() => setShowShiftCalendar(!showShiftCalendar)}
                          variant="outline"
                          size="sm"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {showShiftCalendar ? 'Ocultar' : 'Configurar'} Turnos
                        </Button>
                      </div>
                      
                      {selectedDate && (
                        <div className="p-3 bg-white rounded-md border">
                          <div className="text-sm text-gray-600">
                            <strong>Data selecionada:</strong> {format(selectedDate, 'dd/MM/yyyy')}
                            <br />
                            <strong>Semana atual:</strong> {getCurrentWeekNumber(selectedDate)} ({getCurrentWeekNumber(selectedDate) === 1 ? 'Ímpar' : 'Par'})
                            <br />
                            <strong>Turno ativo (manhã):</strong> {getActiveShiftGroups(editedFactory?.id || '', getCurrentWeekNumber(selectedDate)).length > 0 ? 
                              getActiveShiftGroups(editedFactory?.id || '', getCurrentWeekNumber(selectedDate)).join(', ') : 
                              'Nenhum grupo configurado'}
                            <br />
                            <strong>Turno da noite:</strong> {getActiveShiftGroups(editedFactory?.id || '', getCurrentWeekNumber(selectedDate) === 1 ? 2 : 1).length > 0 ? 
                              getActiveShiftGroups(editedFactory?.id || '', getCurrentWeekNumber(selectedDate) === 1 ? 2 : 1).join(', ') : 
                              'Nenhum grupo configurado'}
                          </div>
                        </div>
                      )}
                      
                      {showShiftCalendar && (
                        <ShiftConfiguration 
                          factoryId={editedFactory?.id || ''}
                          currentRotation={shiftRotation[editedFactory?.id || '']}
                          onConfigure={configureShiftRotation}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do feriado/evento"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleAddHoliday}>
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blocks-timeoff"
                        checked={blocksTimeOff}
                        onCheckedChange={setBlocksTimeOff}
                      />
                      <Label htmlFor="blocks-timeoff" className="text-sm">
                        🚫 Bloquear solicitações de folga neste dia
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Feriados Cadastrados</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {editedFactory?.holidays.map((holiday) => (
                    <div
                      key={holiday.date}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{holiday.name}</p>
                          {holiday.blocks_time_off && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              🚫 Bloqueia folgas
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "dd 'de' MMMM", { locale: pt })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHoliday(holiday.date)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Fábrica</DialogTitle>
            <DialogDescription>
              Adicione uma nova fábrica ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="new-name">Nome da Fábrica</Label>
                <Input
                  id="new-name"
                  value={newFactory.name}
                  onChange={(e) => setNewFactory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <Label>Grupos Disponíveis</Label>
                {isLoadingGroups ? (
                  <div className="grid grid-cols-1 gap-2 p-4 rounded-md border flex items-center justify-center min-h-[100px]">
                    <p className="text-muted-foreground">Carregando grupos...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 p-4 rounded-md border max-h-[200px] overflow-y-auto">
                    {availableGroups.length > 0 ? (
                      availableGroups.map((group) => (
                        <div key={group} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-shift-${group}`}
                            checked={newFactory.shifts.includes(group)}
                            onCheckedChange={(checked) => {
                              setNewFactory(prev => {
                                const newShifts = checked
                                  ? [...prev.shifts, group]
                                  : prev.shifts.filter(s => s !== group);
                                return { ...prev, shifts: newShifts };
                              });
                            }}
                          />
                          <Label htmlFor={`new-shift-${group}`}>{group}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhum grupo disponível</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label>Feriados e Eventos</Label>
                <div className="space-y-4">
                  <div className="p-4 rounded-md border">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={pt}
                      className="rounded-md"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do feriado/evento"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => {
                        if (!selectedDate || !holidayName) return;
                        setNewFactory(prev => ({
                          ...prev,
                          holidays: [...prev.holidays, {
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            name: holidayName,
                            blocks_time_off: blocksTimeOff
                          }]
                        }));
                        setHolidayName('');
                        setBlocksTimeOff(false);
                      }}>
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-blocks-timeoff"
                        checked={blocksTimeOff}
                        onCheckedChange={setBlocksTimeOff}
                      />
                      <Label htmlFor="new-blocks-timeoff" className="text-sm">
                        🚫 Bloquear solicitações de folga neste dia
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Feriados Cadastrados</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {newFactory.holidays.map((holiday, index) => (
                    <div
                      key={`${holiday.date}-${holiday.name}`}
                      className="flex items-center justify-between p-3 rounded-md border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{holiday.name}</p>
                          {holiday.blocks_time_off && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              🚫 Bloqueia folgas
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), "dd 'de' MMMM", { locale: pt })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewFactory(prev => ({
                            ...prev,
                            holidays: prev.holidays.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFactory}>
              Adicionar Fábrica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Fábrica</DialogTitle>
            <DialogDescription>
              Informações completas sobre {selectedFactory?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedFactory && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Informações Básicas</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Nome:</span> {selectedFactory.name}</p>
                    <p><span className="font-medium">Endereço:</span> {selectedFactory.address || 'Não informado'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Grupos</h3>
                  <div className="mt-2">
                    {selectedFactory.shifts && selectedFactory.shifts.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedFactory.shifts.map((shift) => (
                          <span
                            key={shift}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {shift}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum grupo cadastrado</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Feriados</h3>
                  <div className="mt-2">
                    {selectedFactory.holidays && selectedFactory.holidays.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedFactory.holidays.map((holiday) => (
                          <span
                            key={holiday.date}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {holiday.name} ({holiday.date})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum feriado cadastrado</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Funcionários</h3>
                  <div className="mt-2">
                    {selectedFactory.employees && selectedFactory.employees.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedFactory.employees.map((employee) => (
                              <TableRow key={employee.id}>
                                <TableCell>{employee.name}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum funcionário associado a esta fábrica</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={closeDetailsDialog}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


// Componente para configuração do turno da manhã
const MorningTurnoConfig = ({ 
  currentTurno, 
  onSave 
}: { 
  currentTurno: number; 
  onSave: (turno: number) => void;
}) => {
  const [selectedTurno, setSelectedTurno] = useState<number>(currentTurno);

  useEffect(() => {
    setSelectedTurno(currentTurno);
  }, [currentTurno]);

  const handleSave = () => {
    onSave(selectedTurno);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h5 className="font-medium text-blue-800">Selecione qual turno está de manhã:</h5>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="turno1-morning"
              name="morning-turno"
              value={1}
              checked={selectedTurno === 1}
              onChange={() => setSelectedTurno(1)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="turno1-morning" className="text-sm font-medium">
              Turno 1 (Semana ímpar) - Grupos trabalham de manhã nas semanas ímpares
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="turno2-morning"
              name="morning-turno"
              value={2}
              checked={selectedTurno === 2}
              onChange={() => setSelectedTurno(2)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="turno2-morning" className="text-sm font-medium">
              Turno 2 (Semana par) - Grupos trabalham de manhã nas semanas pares
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
};

// Componente para configuração de limite de folgas por dia
const DailyLeaveLimitConfig = ({ 
  currentLimit, 
  onSave 
}: { 
  currentLimit: number; 
  onSave: (limit: number) => void;
}) => {
  const [selectedLimit, setSelectedLimit] = useState<number>(currentLimit);

  useEffect(() => {
    setSelectedLimit(currentLimit);
  }, [currentLimit]);

  const handleSave = () => {
    onSave(selectedLimit);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h5 className="font-medium text-purple-800">Configure o limite global de folgas por dia:</h5>
        <p className="text-sm text-purple-600">
          Defina quantas pessoas podem ter folgas APROVADAS no mesmo dia (TODAS as fábricas).
        </p>
        <p className="text-xs text-purple-500">
          ⚠️ Folgas pendentes não contam no limite. Só bloqueia quando atingir o limite de aprovadas.
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((limit) => (
            <div key={limit} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`limit-${limit}`}
                name="daily-limit"
                value={limit}
                checked={selectedLimit === limit}
                onChange={() => setSelectedLimit(limit)}
                className="h-4 w-4 text-purple-600"
              />
              <label htmlFor={`limit-${limit}`} className="text-sm font-medium">
                {limit} {limit === 1 ? 'pessoa' : 'pessoas'} por dia
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
};

// Componente para configuração de turnos
const ShiftConfiguration = ({ 
  factoryId, 
  currentRotation, 
  onConfigure 
}: { 
  factoryId: string; 
  currentRotation?: { turno1: string[]; turno2: string[] }; 
  onConfigure: (factoryId: string, turno1: string[], turno2: string[]) => void;
}) => {
  const [availableGroups, setAvailableGroups] = useState<{id: string; name: string}[]>([]);
  const [turno1Groups, setTurno1Groups] = useState<string[]>(currentRotation?.turno1 || []);
  const [turno2Groups, setTurno2Groups] = useState<string[]>(currentRotation?.turno2 || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('groups')
          .select('id, name')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setAvailableGroups(data || []);
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        toast.error('Erro ao carregar grupos');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  useEffect(() => {
    if (currentRotation) {
      setTurno1Groups(currentRotation.turno1);
      setTurno2Groups(currentRotation.turno2);
    }
  }, [currentRotation]);

  const handleGroupToggle = (groupName: string, turno: 'turno1' | 'turno2') => {
    if (turno === 'turno1') {
      setTurno1Groups(prev => 
        prev.includes(groupName) 
          ? prev.filter(g => g !== groupName)
          : [...prev, groupName]
      );
    } else {
      setTurno2Groups(prev => 
        prev.includes(groupName) 
          ? prev.filter(g => g !== groupName)
          : [...prev, groupName]
      );
    }
  };

  const handleSave = () => {
    onConfigure(factoryId, turno1Groups, turno2Groups);
    toast.success('Configuração de turnos salva com sucesso!');
  };

  if (loading) {
    return <div className="text-center py-4">Carregando grupos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Turno 1 */}
                <div className="space-y-3">
                  <h5 className="font-medium text-green-800">Turno 1 (Semana ímpar)</h5>
                  <p className="text-xs text-green-600">Grupos que trabalham de manhã nas semanas ímpares</p>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {availableGroups.map(group => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`turno1-${group.id}`}
                  checked={turno1Groups.includes(group.name)}
                  onCheckedChange={() => handleGroupToggle(group.name, 'turno1')}
                />
                <Label htmlFor={`turno1-${group.id}`} className="text-sm">
                  {group.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

                {/* Turno 2 */}
                <div className="space-y-3">
                  <h5 className="font-medium text-green-800">Turno 2 (Semana par)</h5>
                  <p className="text-xs text-green-600">Grupos que trabalham de manhã nas semanas pares</p>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {availableGroups.map(group => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`turno2-${group.id}`}
                  checked={turno2Groups.includes(group.name)}
                  onCheckedChange={() => handleGroupToggle(group.name, 'turno2')}
                />
                <Label htmlFor={`turno2-${group.id}`} className="text-sm">
                  {group.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
};
