import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, Clock, LogOut, User, TrendingUp, Activity, 
  Calendar, AlertCircle, CheckCircle, XCircle, Timer 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { 
  fetchDataForCharts, 
  generateChartDataByType, 
  generateUserData,
  RequestData 
} from '@/lib/data-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface TodayEvent {
  id: string;
  type: string;
  userName: string;
  status: string;
  date: string;
  factoryName: string;
  groupName?: string;
  substituteName?: string;
  created_at: string;
  reason: string;
}

interface UpcomingEvent {
  id: string;
  type: string;
  userName: string;
  date: string;
  factoryName: string;
  groupName?: string;
  substituteName?: string;
  daysUntil: number;
}

interface EmployeeStats {
  name: string;
  timeOff: number;
  earlyDeparture: number;
  lateness: number;
  absence: number;
  total: number;
}

interface YearlyTotals {
  timeOff: number;
  earlyDeparture: number;
  lateness: number;
  absence: number;
  total: number;
}

const Monitoring = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { getText, isLoading: textsLoading } = useCustomTexts();
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const today = new Date();
  const todayString = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
  
  // Estados para os dados
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [employeeYearlyStats, setEmployeeYearlyStats] = useState<EmployeeStats[]>([]);
  const [chartDataByType, setChartDataByType] = useState<any[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<YearlyTotals>({
    timeOff: 0,
    earlyDeparture: 0,
    lateness: 0,
    absence: 0,
    total: 0
  });

  // Estados para filtros
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [factories, setFactories] = useState<Array<{id: string, name: string}>>([]);

  // Função para debug direto do banco
  const debugTodayData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Buscar diretamente de cada tabela para hoje com consultas mais específicas
      const { data: requestsToday, error: reqError } = await supabase
        .from('requests')
        .select('*')
        .gte('start_date', todayStr)
        .lt('start_date', `${todayStr}T23:59:59`);
      
      const { data: timeOffToday, error: timeError } = await supabase
        .from('time_off')
        .select('*')
        .or(`and(start_date.gte.${todayStr},start_date.lt.${todayStr}T23:59:59),and(end_date.gte.${todayStr},end_date.lt.${todayStr}T23:59:59)`);
        
      const { data: earlyDepToday, error: earlyError } = await supabase
        .from('early_departures')
        .select('*')
        .gte('date', todayStr)
        .lt('date', `${todayStr}T23:59:59`);
        
      const { data: latenessToday, error: lateError } = await supabase
        .from('lateness')
        .select('*')
        .gte('date', todayStr)
        .lt('date', `${todayStr}T23:59:59`);

      // Buscar também com date matching mais simples
      const { data: timeOffTodaySimple } = await supabase
        .from('time_off')
        .select('*')
        .eq('start_date', todayStr);
        
      const { data: earlyDepTodaySimple } = await supabase
        .from('early_departures')
        .select('*')
        .eq('date', todayStr);
        
      const { data: latenessTodaySimple } = await supabase
        .from('lateness')
        .select('*')
        .eq('date', todayStr);
        
      // Verificar se há dados nas tabelas em geral
      const { data: allTimeOff } = await supabase
        .from('time_off')
        .select('id, start_date, end_date, status')
        .limit(5);
        
      const { data: allEarlyDep } = await supabase
        .from('early_departures')
        .select('id, date, status')
        .limit(5);
        
      const { data: allLateness } = await supabase
        .from('lateness')
        .select('id, date, status')
        .limit(5);
      
      // Buscar também dados de perfis para verificar se os nomes estão corretos
      const { data: profiles } = await supabase
        .from('profiles')
                    .select('id, first_name, factory_id')
        .limit(5);
      
      console.log('📋 VERIFICAÇÃO GERAL (amostras):');
      console.log('- TimeOff total (amostra):', allTimeOff?.length || 0, allTimeOff || []);
      console.log('- EarlyDepartures total (amostra):', allEarlyDep?.length || 0, allEarlyDep || []);
      console.log('- Lateness total (amostra):', allLateness?.length || 0, allLateness || []);
      console.log('- Profiles (amostra):', profiles?.length || 0, profiles || []);
      
      console.log('1. Requests (range):', requestsToday?.length || 0, requestsToday || []);
      console.log('2. TimeOff (range):', timeOffToday?.length || 0, timeOffToday || []);
      console.log('3. EarlyDepartures (range):', earlyDepToday?.length || 0, earlyDepToday || []);
      console.log('4. Lateness (range):', latenessToday?.length || 0, latenessToday || []);
      
      console.log('🎯 CONSULTAS SIMPLES (equals) PARA HOJE:');
      console.log('1. TimeOff (simple):', timeOffTodaySimple?.length || 0, timeOffTodaySimple || []);
      console.log('2. EarlyDepartures (simple):', earlyDepTodaySimple?.length || 0, earlyDepTodaySimple || []);
      console.log('3. Lateness (simple):', latenessTodaySimple?.length || 0, latenessTodaySimple || []);
      
      // Log detalhado de cada registro encontrado para hoje
      
      if (requestsToday?.length) {
        console.log('📋 REQUESTS para hoje:');
        requestsToday.forEach((req, index) => {
          console.log(`  ${index + 1}. ID: ${req.id} | Tipo: ${req.type} | Status: ${req.status} | Data: ${req.start_date} | User: ${req.user_id}`);
        });
      }
      
      if (timeOffTodaySimple?.length) {
        console.log('📋 TIME_OFF para hoje:');
        timeOffTodaySimple.forEach((timeOff, index) => {
          const isAbsence = timeOff.start_date === timeOff.end_date;
          console.log(`  ${index + 1}. ID: ${timeOff.id} | Tipo: ${isAbsence ? 'absence' : 'time-off'} | Status: ${timeOff.status} | Início: ${timeOff.start_date} | Fim: ${timeOff.end_date} | User: ${timeOff.user_id}`);
        });
      }
      
      if (earlyDepTodaySimple?.length) {
        console.log('📋 EARLY_DEPARTURES para hoje:');
        earlyDepTodaySimple.forEach((earlyDep, index) => {
          console.log(`  ${index + 1}. ID: ${earlyDep.id} | Tipo: early-departure | Status: ${earlyDep.status} | Data: ${earlyDep.date} | User: ${earlyDep.user_id}`);
        });
      }
      
      if (latenessTodaySimple?.length) {
        console.log('📋 LATENESS para hoje:');
        latenessTodaySimple.forEach((lateness, index) => {
          console.log(`  ${index + 1}. ID: ${lateness.id} | Tipo: lateness | Status: ${lateness.status} | Data: ${lateness.date} | User: ${lateness.user_id}`);
        });
      }
      
      if (reqError) console.error('❌ Erro requests:', reqError);
      if (timeError) console.error('❌ Erro time_off:', timeError);
      if (earlyError) console.error('❌ Erro early_departures:', earlyError);
      if (lateError) console.error('❌ Erro lateness:', lateError);
      
    } catch (error) {
      console.error('❌ Erro no debug direto:', error);
    }
  };

  // Carregar dados
  useEffect(() => {
    loadFactories();
    loadMonitoringData();
  }, []);

  // Recarregar dados quando a fábrica selecionada mudar
  useEffect(() => {
    if (factories.length > 0) {
      loadMonitoringData();
    }
  }, [selectedFactory]);

  // Função para carregar fábricas
  const loadFactories = async () => {
    try {
      const { data: factoriesData, error } = await supabase
        .from('factories')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Erro ao carregar fábricas:', error);
        return;
      }

      setFactories(factoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar fábricas:', error);
    }
  };

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      
      // DEBUG: Verificar dados diretamente do banco para hoje
      await debugTodayData();
      
      // Buscar dados para o mês/ano selecionado (para gráficos)
      const monthlyData = await fetchDataForCharts({
        year: currentYear,
        month: currentMonth,
        factoryId: selectedFactory !== 'all' ? selectedFactory : undefined
      });
      
      // USAR A MESMA LÓGICA DO CALENDÁRIO: loadAllRequests()
      const { loadAllRequests } = await import('@/lib/requests');
      const requestsResult = await loadAllRequests();
      
      if (requestsResult.success && requestsResult.data) {
        // Carregar dados de fábricas e grupos para mapear corretamente
        const { data: factoriesData, error: factoriesError } = await supabase
          .from('factories')
          .select('id, name');
        
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, name, responsible');
        
        // Carregar perfis dos usuários para obter o campo responsible
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, responsible');
        
        if (factoriesError) {
          console.error('Erro ao carregar fábricas:', factoriesError);
        }
        
        if (groupsError) {
          console.error('Erro ao carregar grupos:', groupsError);
        }
        
        if (profilesError) {
          console.error('Erro ao carregar perfis:', profilesError);
        }
        
        // Criar mapas para busca rápida
        const factoriesMap = new Map();
        factoriesData?.forEach(factory => {
          factoriesMap.set(factory.id, factory.name);
        });
        
        const groupsMap = new Map();
        groupsData?.forEach(group => {
          groupsMap.set(group.responsible, group.name);
        });
        
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile.responsible);
        });
        
        
        // Converter para o formato esperado pelo processMonitoringData
        let yearlyData = requestsResult.data.map(req => {
          // Buscar o nome da fábrica
          const factoryName = req.factory_id ? factoriesMap.get(req.factory_id) : 'Fábrica não encontrada';
          
          // Buscar o grupo do funcionário
          const userResponsible = profilesMap.get(req.user_id);
          const groupName = userResponsible ? groupsMap.get(userResponsible) : 'Grupo não encontrado';
          
          
          return {
            id: req.id,
            type: req.type,
            status: req.status,
            date: req.date || req.start_date,
            endDate: req.endDate || req.end_date,
            userId: req.user_id || '',
            userName: req.userName || 'Usuário não encontrado',
            factoryId: req.factory_id || '',
            factoryName: factoryName || 'Fábrica não encontrada',
            groupName: groupName,
            prestadora: '',
            reason: req.reason,
            created_at: req.created_at,
            approved_by: req.approved_by,
            rejected_by: req.rejected_by,
            reviewed_at: req.reviewed_at,
            reviewerName: req.reviewerName,
            substituteId: req.substitute_id,
            substituteName: req.substituteName
          };
        });

        // Aplicar filtro de fábrica se não for "all"
        if (selectedFactory !== 'all') {
          yearlyData = yearlyData.filter(req => req.factoryId === selectedFactory);
        }
        
        // Processar dados
        processMonitoringData(monthlyData, yearlyData);
      } else {
        console.error('Erro ao carregar solicitações:', requestsResult.error);
        // Fallback para o método anterior
        const yearlyData = await fetchDataForCharts({});
        processMonitoringData(monthlyData, yearlyData);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados de monitoramento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de monitoramento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processMonitoringData = (monthlyData: RequestData[], yearlyData: RequestData[]) => {
    // Processar eventos de hoje - usar dados anuais para não perder eventos
    const today = new Date();
    // Usar formato local para evitar problemas de timezone
    const todayLocalStr = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
    
    
    
    // Debug: verificar distribuição de anos nos dados
    const yearDistribution = yearlyData.reduce((acc, item) => {
      const year = new Date(item.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    
    // Filtrar apenas eventos de hoje - USAR A MESMA LÓGICA DO CALENDÁRIO
    const todayEventsData = yearlyData.filter(item => {
      // USAR A MESMA LÓGICA DO CALENDÁRIO: comparar date e endDate
      const startDate = new Date(item.date || '');
      const endDate = new Date(item.endDate || item.date || '');
      const currentDate = new Date(todayLocalStr);
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(currentDate.getTime())) {
        console.warn(`🚨 [Monitoring] Data inválida encontrada:`, {
          startDate: item.date,
          endDate: item.endDate,
          requestId: item.id
        });
        return false;
      }
      
      // Comparar apenas as datas (ano, mês, dia) ignorando horários - MESMA LÓGICA DO CALENDÁRIO
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      const isInRange = currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
      const isValidStatus = item.status === 'approved' || item.status === 'pending';
      
      
      return isInRange && isValidStatus;
    }).map(item => ({
      id: item.id,
      type: getTypeLabel(item.type),
      userName: item.userName,
      status: item.status,
      date: item.date,
      factoryName: item.factoryName,
      groupName: item.groupName,
      substituteName: item.substituteName,
      created_at: item.created_at, // Adicionar created_at
      reason: item.reason // Adicionar reason
    }));
    
    // Log específico para faltas
    const totalAbsences = yearlyData.filter(item => item.type === 'absence').length;
    const todayAbsences = yearlyData.filter(item => {
      const itemDateStr = item.date.split('T')[0];
      const itemDate = new Date(itemDateStr);
      const todayDate = new Date(todayLocalStr);
      const isExactlyToday = itemDate.getTime() === todayDate.getTime();
      return item.type === 'absence' && isExactlyToday;
    }).length;
    
    
    
    
    // Processar próximos eventos (próximos 7 dias) - usar dados anuais
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingEventsData = yearlyData.filter(item => {
      const itemDate = new Date(item.date);
      // Normalizar datas para evitar problemas de horário
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const nextWeekOnly = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());
      
      const isFuture = itemDateOnly > todayOnly;
      const isWithinWeek = itemDateOnly <= nextWeekOnly;
      const isNotRejected = item.status !== 'rejected';
      
      return isFuture && isWithinWeek && isNotRejected;
    }).map(item => {
      const itemDate = new Date(item.date);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const daysUntil = Math.ceil((itemDateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: item.id,
        type: getTypeLabel(item.type),
        userName: item.userName,
        date: item.date,
        factoryName: item.factoryName,
        groupName: item.groupName,
        substituteName: item.substituteName,
        daysUntil
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil); // Ordenar por dias crescente
    
    
    // Filtrar dados rejeitados E eventos futuros para gráficos
    const filteredMonthlyData = monthlyData.filter(item => {
      const itemDate = new Date(item.date);
      const isNotRejected = item.status !== 'rejected';
      const isNotFuture = itemDate <= today;
      return isNotRejected && isNotFuture;
    });
    
    // Processar estatísticas por funcionário (mensal)
    const userData = generateUserData(filteredMonthlyData);
    const employeeStatsData = userData.map(user => ({
      name: user.user.split(' ').slice(0, 2).join(' '), // Apenas primeiro e segundo nome
      timeOff: user.timeOff,
      earlyDeparture: user.earlyDeparture,
      lateness: user.lateness,
      absence: user.absence,
      total: user.total
    })).sort((a, b) => b.total - a.total); // Todos os funcionários
    
    // Processar estatísticas por funcionário (anual) - apenas até hoje
    const filteredYearlyData = yearlyData.filter(item => {
      const itemDate = new Date(item.date);
      const isNotRejected = item.status !== 'rejected';
      const isNotFuture = itemDate <= today;
      return isNotRejected && isNotFuture;
    });
    const yearlyUserData = generateUserData(filteredYearlyData);
    const employeeYearlyStatsData = yearlyUserData.map(user => ({
      name: user.user.split(' ').slice(0, 2).join(' '), // Apenas primeiro e segundo nome
      timeOff: user.timeOff,
      earlyDeparture: user.earlyDeparture,
      lateness: user.lateness,
      absence: user.absence,
      total: user.total
    })).sort((a, b) => b.total - a.total); // Todos os funcionários
    
    // Processar gráfico de pizza
    const chartData = generateChartDataByType(filteredMonthlyData);
    
    // Calcular totais por tipo do ano (excluindo rejeitados)
    const yearlyTotalsData = {
      timeOff: filteredYearlyData.filter(item => item.type === 'time-off').length,
      earlyDeparture: filteredYearlyData.filter(item => item.type === 'early-departure').length,
      lateness: filteredYearlyData.filter(item => item.type === 'lateness').length,
      absence: filteredYearlyData.filter(item => item.type === 'absence').length,
      total: filteredYearlyData.length
    };
    
    // Atualizar estados
    setTodayEvents(todayEventsData);
    setUpcomingEvents(upcomingEventsData);
    setEmployeeStats(employeeStatsData);
    setEmployeeYearlyStats(employeeYearlyStatsData);
    setChartDataByType(chartData);
    setYearlyTotals(yearlyTotalsData);
  };

  // Função helper para identificar origem dos dados
  const getDataSource = (item: RequestData) => {
    // Baseado no tipo de dados, podemos inferir a origem
    if (item.type === 'time-off' || item.type === 'absence') {
      return 'time_off';
    } else if (item.type === 'early-departure') {
      return 'early_departures';
    } else if (item.type === 'lateness') {
      return 'lateness';
    } else {
      return 'requests';
    }
  };

  // Função para verificar duplicatas e integridade dos dados
  const analyzeDataIntegrity = (data: RequestData[], todayStr: string) => {
    
    // Verificar duplicatas por ID
    const idCounts = data.reduce((acc, item) => {
      acc[item.id] = (acc[item.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const duplicateIds = Object.entries(idCounts).filter(([_, count]) => count > 1);
    if (duplicateIds.length > 0) {
      console.warn('⚠️ IDs DUPLICADOS encontrados:', duplicateIds);
      duplicateIds.forEach(([id, count]) => {
        const duplicateItems = data.filter(item => item.id === id);
        console.warn(`  ID ${id} aparece ${count} vezes:`, duplicateItems);
      });
    } else {
      console.log('✅ Nenhum ID duplicado encontrado');
    }
    
    // Verificar dados para hoje especificamente
    const todayData = data.filter(item => item.date.split('T')[0] === todayStr);
    console.log(`📅 Análise de dados para hoje (${todayStr}):`);
    console.log(`  Total: ${todayData.length} registros`);
    
    // Agrupar por status
    const statusGroups = todayData.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, RequestData[]>);
    
    Object.entries(statusGroups).forEach(([status, items]) => {
      console.log(`  Status "${status}": ${items.length} registros`);
      items.forEach((item, index) => {
        console.log(`    ${index + 1}. ${item.userName} - ${item.type} - ${getDataSource(item)} - ID: ${item.id}`);
      });
    });
    
    // Verificar se há problemas de formato de data
    const invalidDates = todayData.filter(item => {
      const dateStr = item.date.split('T')[0];
      return !/^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    });
    
    if (invalidDates.length > 0) {
      console.warn('⚠️ DATAS COM FORMATO INVÁLIDO:', invalidDates.map(item => ({
        id: item.id,
        date: item.date,
        userName: item.userName
      })));
    } else {
      console.log('✅ Todas as datas estão no formato correto');
    }
    
    // Verificar se há usuários ou fábricas faltando
    const missingUserData = todayData.filter(item => 
      !item.userName || item.userName === 'Usuário não encontrado' ||
      !item.factoryName || item.factoryName === 'Fábrica não encontrada'
    );
    
    if (missingUserData.length > 0) {
      console.warn('⚠️ DADOS DE USUÁRIO/FÁBRICA FALTANDO:', missingUserData.map(item => ({
        id: item.id,
        userName: item.userName,
        factoryName: item.factoryName,
        userId: item.userId,
        factoryId: item.factoryId
      })));
    } else {
      console.log('✅ Todos os dados de usuário e fábrica estão completos');
    }
    
    return {
      totalRecords: data.length,
      todayRecords: todayData.length,
      duplicateIds: duplicateIds.length,
      invalidDates: invalidDates.length,
      missingUserData: missingUserData.length,
      statusBreakdown: Object.entries(statusGroups).map(([status, items]) => ({
        status,
        count: items.length
      }))
    };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'time-off': return 'Folga';
      case 'early-departure': return 'Saída Antecipada';
      case 'lateness': return 'Atraso';
      case 'absence': return 'Falta';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Timer className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Folga': return <CalendarDays className="h-4 w-4" style={{ color: '#3B82F6' }} />;
      case 'Saída Antecipada': return <LogOut className="h-4 w-4" style={{ color: '#8B5CF6' }} />;
      case 'Atraso': return <Clock className="h-4 w-4" style={{ color: '#EAB308' }} />;
      case 'Falta': return <User className="h-4 w-4" style={{ color: '#EF4444' }} />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBackgroundColor = (type: string) => {
    switch (type) {
      case 'Folga': return { backgroundColor: '#3B82F6' + '20' };
      case 'Saída Antecipada': return { backgroundColor: '#8B5CF6' + '20' };
      case 'Atraso': return { backgroundColor: '#EAB308' + '20' };
      case 'Falta': return { backgroundColor: '#EF4444' + '30' };
      default: return { backgroundColor: '#f1f5f9' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeitado</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#EAB308', '#EF4444', '#10B981', '#F97316'];

  // Função para renderizar labels apenas quando valor > 0
  const renderLabelIfNotZero = (value: any) => {
    return value > 0 ? value.toString() : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('monitoring.title')}</h1>
              <p className="text-muted-foreground">
                {t('monitoring.subtitle')}
              </p>
            </div>

            {/* Filtro de Fábrica */}
            <div className="mt-4 md:mt-0">
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('monitoring.selectFactory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('monitoring.allFactories')}</SelectItem>
                  {factories.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Eventos de Hoje e Próximos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Acontecimentos de Hoje */}
            <Card>
                            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Acontecimentos de Hoje ({todayEvents.length})
                </CardTitle> 
                <CardDescription>
                  Solicitações aprovadas/pendentes que acontecem hoje ({todayString})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {todayEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum evento hoje</p>
                      <p className="text-sm">Não há solicitações para hoje</p>
                    </div>
                  ) : (
                    todayEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg" style={getTypeBackgroundColor(event.type)}>
                        <div className="flex items-center gap-3">
                          {getTypeIcon(event.type)}
                          {getStatusIcon(event.status)}
                          <div>
                            <p className="font-medium">{event.userName}</p>
                            <p className="text-sm text-muted-foreground">{event.type} - {event.factoryName}</p>
                            <p className="text-xs text-blue-500">👥 {event.groupName || 'Grupo não encontrado'}</p>
                            {event.substituteName && (
                              <p className="text-xs text-green-600">🔄 Substituto: {event.substituteName}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Próximos Eventos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Próximos Eventos
                </CardTitle>
                <CardDescription>
                  Eventos dos próximos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum evento próximo</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg" style={getTypeBackgroundColor(event.type)}>
                        <div className="flex items-center gap-3">
                          {getTypeIcon(event.type)}
                          <div>
                            <p className="font-medium">{event.userName}</p>
                            <p className="text-sm text-muted-foreground">{event.type} - {event.factoryName}</p>
                            <p className="text-xs text-blue-500">👥 {event.groupName || 'Grupo não encontrado'}</p>
                            {event.substituteName && (
                              <p className="text-xs text-green-600">🔄 Substituto: {event.substituteName}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(event.date).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.daysUntil === 1 ? 'Amanhã' : `Em ${event.daysUntil} dias`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle>Funcionários - Acontecimentos do Mês</CardTitle>
                <CardDescription>
                  Funcionários com ocorrências até hoje em {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employeeStats.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado encontrado</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Mostrando {employeeStats.length} funcionários - dados mensais
                    </p>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={employeeStats} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          tick={{ fontSize: 10 }}
                          interval={0}
                        />
                        <YAxis 
                          allowDecimals={false}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name={textsLoading ? 'Folgas' : getText('charts.timeOff', currentLanguage, 'Folgas')}>
                          <LabelList dataKey="timeOff" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                        <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name={textsLoading ? 'Saídas Antecipadas' : getText('charts.earlyDeparture', currentLanguage, 'Saídas Antecipadas')}>
                          <LabelList dataKey="earlyDeparture" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                        <Bar dataKey="lateness" stackId="a" fill="#EAB308" name={textsLoading ? 'Atrasos' : getText('charts.lateness', currentLanguage, 'Atrasos')}>
                          <LabelList dataKey="lateness" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                        <Bar dataKey="absence" stackId="a" fill="#EF4444" name={textsLoading ? 'Faltas' : getText('charts.absence', currentLanguage, 'Faltas')}>
                          <LabelList dataKey="absence" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Tipos de Acontecimentos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Acontecimentos</CardTitle>
                <CardDescription>
                  Tipos de ocorrências até hoje em {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartDataByType.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado encontrado</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={chartDataByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartDataByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Funcionários - Dados Anuais */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Funcionários - Acontecimentos do Ano</CardTitle>
              <CardDescription>
                Funcionários com ocorrências até hoje em {currentYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeYearlyStats.length === 0 ? (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado encontrado</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Mostrando {employeeYearlyStats.length} funcionários - dados anuais
                  </p>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={employeeYearlyStats} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 10 }}
                        interval={0}
                      />
                      <YAxis 
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name={textsLoading ? 'Folgas' : getText('charts.timeOff', currentLanguage, 'Folgas')}>
                        <LabelList dataKey="timeOff" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                      </Bar>
                      <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name={textsLoading ? 'Saídas Antecipadas' : getText('charts.earlyDeparture', currentLanguage, 'Saídas Antecipadas')}>
                        <LabelList dataKey="earlyDeparture" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                      </Bar>
                      <Bar dataKey="lateness" stackId="a" fill="#EAB308" name={textsLoading ? 'Atrasos' : getText('charts.lateness', currentLanguage, 'Atrasos')}>
                        <LabelList dataKey="lateness" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                      </Bar>
                      <Bar dataKey="absence" stackId="a" fill="#EF4444" name={textsLoading ? 'Faltas' : getText('charts.absence', currentLanguage, 'Faltas')}>
                        <LabelList dataKey="absence" position="center" fill="white" fontSize={12} formatter={renderLabelIfNotZero} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totais por Tipo do Ano */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Total de Acontecimentos até Hoje em {currentYear}</CardTitle>
              <CardDescription>
                Quantidade acumulada por tipo de evento (apenas eventos já ocorridos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#3B82F6' + '25' }}>
                  <div className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{yearlyTotals.timeOff}</div>
                  <div className="text-sm" style={{ color: '#3B82F6' }}>Folgas</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#8B5CF6' + '25' }}>
                  <div className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>{yearlyTotals.earlyDeparture}</div>
                  <div className="text-sm" style={{ color: '#8B5CF6' }}>Saídas Antecipadas</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#EAB308' + '25' }}>
                  <div className="text-2xl font-bold" style={{ color: '#EAB308' }}>{yearlyTotals.lateness}</div>
                  <div className="text-sm" style={{ color: '#EAB308' }}>Atrasos</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#EF4444' + '25' }}>
                  <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>{yearlyTotals.absence}</div>
                  <div className="text-sm" style={{ color: '#EF4444' }}>Faltas</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{yearlyTotals.total}</div>
                  <div className="text-sm text-gray-700">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>
    </>
  );
};

export default Monitoring; 