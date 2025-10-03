import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'time-off' | 'early-departure' | 'lateness' | 'absence';

export interface DataFilters {
  year?: number;
  month?: number;
  userId?: string;
  factoryId?: string;
  requestType?: RequestType;
  reason?: string;
  prestadora?: string;
  substituteId?: string;
}

// Função helper para detectar se é um motivo personalizado "Outros"
const isCustomOthersReason = (reason: string): boolean => {
  if (!reason) return false;
  
  const lowerReason = reason.toLowerCase().trim();
  
  // Padrões que indicam motivo personalizado "Outros":
  
  // 1. Começa com "outros" ou "outro"
  if (lowerReason.startsWith('outros') || lowerReason.startsWith('outro')) {
    return true;
  }
  
  // 2. Contém " - " e a parte base inclui "outro"
  if (reason.includes(' - ')) {
    const basePart = reason.split(' - ')[0].trim().toLowerCase();
    if (basePart.includes('outro')) {
      return true;
    }
  }
  
  // 3. Contém ": " e a parte base inclui "outro"
  if (reason.includes(': ')) {
    const basePart = reason.split(': ')[0].trim().toLowerCase();
    if (basePart.includes('outro')) {
      return true;
    }
  }
  
  // 4. Outros padrões comuns de motivos personalizados
  if (lowerReason.includes('outro motivo') || 
      lowerReason.includes('outros motivos') ||
      lowerReason.includes('motivo pessoal') ||
      lowerReason.includes('personalizado')) {
    return true;
  }
  
  return false;
};

export interface RequestData {
  id: string;
  type: RequestType;
  status: RequestStatus;
  date: string;
  endDate?: string;
  userId: string;
  userName: string;
  factoryId: string;
  factoryName: string;
  groupName?: string;
  prestadora?: string;
  reason?: string;
  created_at: string;
  approved_by?: string;
  rejected_by?: string;
  reviewed_at?: string;
  reviewerName?: string;
  substituteId?: string;
  substituteName?: string;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface MonthlyData {
  month: string;
  timeOff: number;
  earlyDeparture: number;
  lateness: number;
  absence: number;
}

export interface FactoryData {
  factory: string;
  total: number;
  timeOff: number;
  absence: number;
  lateness: number;
  earlyDeparture: number;
}

export interface UserData {
  user: string;
  total: number;
  timeOff: number;
  earlyDeparture: number;
  lateness: number;
  absence: number;
}

export interface ReasonsData {
  reason: string;
  count: number;
  percentage: number;
  fill?: string;
}

export interface ReasonUserData {
  user: string;
  count: number;
  fill?: string;
}

// Função para buscar dados dos gráficos
export const fetchDataForCharts = async (filters: DataFilters = {}) => {
  try {
    // Buscar dados de todas as tabelas de solicitações
    const { data: requestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*');

    if (requestsError) {
      console.error('Erro ao buscar requests:', requestsError);
      throw requestsError;
    }

    const { data: timeOffData, error: timeOffError } = await supabase
      .from('time_off')
      .select('*');

    if (timeOffError) {
      console.error('Erro ao buscar time_off:', timeOffError);
      throw timeOffError;
    }

    const { data: earlyDeparturesData, error: earlyDeparturesError } = await supabase
      .from('early_departures')
      .select('*');

    if (earlyDeparturesError) {
      console.error('Erro ao buscar early_departures:', earlyDeparturesError);
      throw earlyDeparturesError;
    }

    const { data: latenessData, error: latenessError } = await supabase
      .from('lateness')
      .select('*');

    if (latenessError) {
      console.error('Erro ao buscar lateness:', latenessError);
      throw latenessError;
    }

    // Buscar perfis para mapear revisores
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
              .select('id, first_name, factory_id, prestadora');

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    // Buscar fábricas
    const { data: factoriesData, error: factoriesError } = await supabase
      .from('factories')
      .select('id, name');

    if (factoriesError) {
      console.error('Erro ao buscar factories:', factoriesError);
      throw factoriesError;
    }

    // Criar mapas para busca rápida
    const profilesMap = new Map();
    profilesData?.forEach(profile => {
      profilesMap.set(profile.id, profile.first_name);
    });

    const factoriesMap = new Map();
    factoriesData?.forEach(factory => {
      factoriesMap.set(factory.id, factory.name);
    });

    // Processar dados das requests - evitar duplicações usando Set de IDs processados
    const processedRequests: RequestData[] = [];
    const processedIds = new Set<string>();
    
    
    
    // Processar requests (fonte principal)
    
    requestsData?.forEach(req => {
      // Buscar o usuário nos profiles
      const userProfile = profilesData?.find(p => p.id === req.user_id);
      const factoryName = userProfile?.factory_id ? factoriesMap.get(userProfile.factory_id) : 'Fábrica não encontrada';
      
      // Buscar substituto se existir
      let substituteId = undefined;
      let substituteName = undefined;
      if (req.substitute_id) {
        const substituteProfile = profilesData?.find(p => p.id === req.substitute_id);
        substituteId = req.substitute_id;
        substituteName = substituteProfile ? substituteProfile.first_name : 'Substituto não encontrado';
      }
      
      processedRequests.push({
        id: req.id,
        type: req.type as RequestType,
        status: req.status as RequestStatus,
        date: req.start_date,
        endDate: req.end_date,
        userId: req.user_id || '',
        userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
        factoryId: userProfile?.factory_id || '',
        factoryName: factoryName || 'Fábrica não encontrada',
        prestadora: userProfile?.prestadora || '',
        reason: req.reason,
        created_at: req.created_at,
        approved_by: req.approved_by,
        rejected_by: req.rejected_by,
        reviewed_at: req.reviewed_at,
        reviewerName: req.approved_by ? profilesMap.get(req.approved_by) : 
                     req.rejected_by ? profilesMap.get(req.rejected_by) : undefined,
        substituteId: substituteId,
        substituteName: substituteName
      });
      
      // Marcar como processado
      processedIds.add(req.id);
    });
    
    // Processar time_off (apenas os que não estão em requests)
    
    timeOffData?.forEach(timeOff => {
      // Pular se já foi processado via requests
      if (processedIds.has(timeOff.id)) {
        return;
      }
      
      // Buscar o usuário nos profiles
      const userProfile = profilesData?.find(p => p.id === timeOff.user_id);
      const factoryName = userProfile?.factory_id ? factoriesMap.get(userProfile.factory_id) : 'Fábrica não encontrada';
      
      // Buscar o tipo original na tabela requests
      const originalRequest = requestsData?.find(req => req.id === timeOff.id);
      const originalType = originalRequest?.type || 'time-off';
      
      // LÓGICA CORRIGIDA: 
      // 1. Se há registro na requests com tipo específico, usar esse tipo
      // 2. Se NÃO há registro na requests E start_date === end_date, então é absence (falta)
      // 3. Caso contrário, é time-off (folga normal)
      const isAbsence = originalRequest?.type === 'absence' || 
                       (!originalRequest && timeOff.start_date === timeOff.end_date);
      
      // Buscar substituto se existir
      let substituteId = undefined;
      let substituteName = undefined;
      if (timeOff.substitute_id) {
        const substituteProfile = profilesData?.find(p => p.id === timeOff.substitute_id);
        substituteId = timeOff.substitute_id;
        substituteName = substituteProfile ? substituteProfile.first_name : 'Substituto não encontrado';
      }
      
      processedRequests.push({
        id: timeOff.id,
        type: isAbsence ? 'absence' : originalType,
        status: timeOff.status as RequestStatus,
        date: timeOff.start_date,
        endDate: timeOff.end_date,
        userId: timeOff.user_id || '',
        userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
        factoryId: userProfile?.factory_id || '',
        factoryName: factoryName || 'Fábrica não encontrada',
        prestadora: userProfile?.prestadora || '',
        reason: timeOff.reason,
        created_at: timeOff.created_at,
        approved_by: timeOff.approved_by,
        rejected_by: timeOff.rejected_by,
        reviewed_at: timeOff.reviewed_at,
        reviewerName: timeOff.approved_by ? profilesMap.get(timeOff.approved_by) : 
                     timeOff.rejected_by ? profilesMap.get(timeOff.rejected_by) : undefined,
        substituteId: substituteId,
        substituteName: substituteName
      });
      
      // Marcar como processado
      processedIds.add(timeOff.id);
    });

    // Processar early_departures (apenas os que não estão em requests)
    earlyDeparturesData?.forEach(earlyDep => {
      // Pular se já foi processado via requests
      if (processedIds.has(earlyDep.id)) {
        return;
      }
      
      // Buscar o usuário nos profiles
      const userProfile = profilesData?.find(p => p.id === earlyDep.user_id);
      const factoryName = userProfile?.factory_id ? factoriesMap.get(userProfile.factory_id) : 'Fábrica não encontrada';
      
      // Buscar substituto se existir
      let substituteId = undefined;
      let substituteName = undefined;
      if (earlyDep.substitute_id) {
        const substituteProfile = profilesData?.find(p => p.id === earlyDep.substitute_id);
        substituteId = earlyDep.substitute_id;
        substituteName = substituteProfile ? substituteProfile.first_name : 'Substituto não encontrado';
      }
      
      processedRequests.push({
        id: earlyDep.id,
        type: 'early-departure',
        status: earlyDep.status as RequestStatus,
        date: earlyDep.date,
        endDate: earlyDep.date, // Para saídas antecipadas, data de início = fim
        userId: earlyDep.user_id || '',
        userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
        factoryId: userProfile?.factory_id || '',
        factoryName: factoryName || 'Fábrica não encontrada',
        prestadora: userProfile?.prestadora || '',
        reason: earlyDep.reason,
        created_at: earlyDep.created_at,
        approved_by: earlyDep.approved_by,
        rejected_by: earlyDep.rejected_by,
        reviewed_at: earlyDep.reviewed_at,
        reviewerName: earlyDep.approved_by ? profilesMap.get(earlyDep.approved_by) : 
                     earlyDep.rejected_by ? profilesMap.get(earlyDep.rejected_by) : undefined,
        substituteId: substituteId,
        substituteName: substituteName
      });
      
      // Marcar como processado
      processedIds.add(earlyDep.id);
    });

    // Processar lateness (apenas os que não estão em requests)
    latenessData?.forEach(lateness => {
      // Pular se já foi processado via requests
      if (processedIds.has(lateness.id)) {
        return;
      }
      
      // Buscar o usuário nos profiles
      const userProfile = profilesData?.find(p => p.id === lateness.user_id);
      const factoryName = userProfile?.factory_id ? factoriesMap.get(userProfile.factory_id) : 'Fábrica não encontrada';
      
      // Buscar substituto se existir
      let substituteId = undefined;
      let substituteName = undefined;
      if (lateness.substitute_id) {
        const substituteProfile = profilesData?.find(p => p.id === lateness.substitute_id);
        substituteId = lateness.substitute_id;
        substituteName = substituteProfile ? substituteProfile.first_name : 'Substituto não encontrado';
      }
      
      processedRequests.push({
        id: lateness.id,
        type: 'lateness',
        status: lateness.status as RequestStatus,
        date: lateness.date,
        endDate: lateness.date, // Para atrasos, data de início = fim
        userId: lateness.user_id || '',
        userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
        factoryId: userProfile?.factory_id || '',
        factoryName: factoryName || 'Fábrica não encontrada',
        prestadora: userProfile?.prestadora || '',
        reason: lateness.reason,
        created_at: lateness.created_at,
        approved_by: lateness.approved_by,
        rejected_by: lateness.rejected_by,
        reviewed_at: lateness.reviewed_at,
        reviewerName: lateness.approved_by ? profilesMap.get(lateness.approved_by) : 
                     lateness.rejected_by ? profilesMap.get(lateness.rejected_by) : undefined,
        substituteId: substituteId,
        substituteName: substituteName
      });
      
      // Marcar como processado
      processedIds.add(lateness.id);
    });

    // Aplicar filtros
    let filteredData = processedRequests;

    if (filters.year) {
      filteredData = filteredData.filter(item => 
        new Date(item.date).getFullYear() === filters.year
      );
    }

    if (filters.month) {
      filteredData = filteredData.filter(item => 
        new Date(item.date).getMonth() + 1 === filters.month
      );
    }

    if (filters.userId) {
      filteredData = filteredData.filter(item => item.userId === filters.userId);
    }

    if (filters.factoryId) {
      filteredData = filteredData.filter(item => item.factoryId === filters.factoryId);
    }

    if (filters.requestType) {
      filteredData = filteredData.filter(item => item.type === filters.requestType);
    }

    if (filters.reason) {
      filteredData = filteredData.filter(item => {
        // Se o filtro for "Outros", buscar todos os motivos personalizados
        if (filters.reason === 'Outros') {
          return isCustomOthersReason(item.reason || '');
        }
        // Para outros filtros, busca exata
        return item.reason === filters.reason;
      });
    }

    if (filters.prestadora) {
      filteredData = filteredData.filter(item => item.prestadora === filters.prestadora);
    }

    if (filters.substituteId) {
      filteredData = filteredData.filter(item => item.substituteId === filters.substituteId);
    }

    return filteredData;
  } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    throw error;
  }
}

// Função para calcular duração em dias de uma solicitação
export const calculateDurationInDays = (request: RequestData): number => {
  // Para tipos que não têm duração (early-departure, lateness), sempre é 1 dia
  if (request.type === 'early-departure' || request.type === 'lateness') {
    return 1;
  }
  
  // Para time-off e absence, calcular diferença entre datas
  if (request.endDate || request.end_date) {
    const startDate = new Date(request.date || request.start_date);
    const endDate = new Date(request.endDate || request.end_date);
    
    // Calcular diferença em milissegundos e converter para dias
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia inicial
    
    return diffDays;
  }
  
  // Se não tem end_date, é um dia apenas
  return 1;
};;

// Função para gerar dados dos gráficos por tipo
export const generateChartDataByType = (data: RequestData[]): ChartData[] => {
  const typeCount = {
    'time-off': 0,
    'early-departure': 0,
    'lateness': 0,
    'absence': 0
  };

  // Filtrar apenas requests aprovados
  const approvedData = data.filter(item => item.status === 'approved');

  approvedData.forEach(item => {
    // Calcular dias usando a função calculateDurationInDays
    const days = calculateDurationInDays(item);
    typeCount[item.type] += days;
  });

  const result = [
    { name: 'Folgas', value: typeCount['time-off'], fill: '#3B82F6' },
    { name: 'Saídas Antecipadas', value: typeCount['early-departure'], fill: '#8B5CF6' },
    { name: 'Atrasos', value: typeCount['lateness'], fill: '#EAB308' },
    { name: 'Faltas', value: typeCount['absence'], fill: '#EF4444' }
  ];

  // Se não há dados, retornar array vazio para evitar gráfico com valores zero
  const hasData = result.some(item => item.value > 0);
  return hasData ? result : [];
};



// Função para gerar dados mensais
export const generateMonthlyData = (data: RequestData[], selectedYear?: number, selectedMonth?: number): MonthlyData[] => {
  const monthlyData: { [key: string]: MonthlyData } = {};

  // Se um mês específico foi selecionado, garantir que ele seja incluído mesmo sem dados
  if (selectedYear && selectedMonth) {
    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'short' });
    
    monthlyData[monthKey] = {
      month: monthName,
      timeOff: 0,
      earlyDeparture: 0,
      lateness: 0,
      absence: 0
    };
  } else if (selectedYear) {
    // Se apenas o ano foi selecionado, incluir todos os meses do ano
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${selectedYear}-${String(month).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, month - 1).toLocaleDateString('pt-BR', { month: 'short' });
      
      monthlyData[monthKey] = {
        month: monthName,
        timeOff: 0,
        earlyDeparture: 0,
        lateness: 0,
        absence: 0
      };
    }
  }

  // Filtrar apenas requests aprovados
  const approvedData = data.filter(item => item.status === 'approved');

  // Processar dados existentes
  approvedData.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        timeOff: 0,
        earlyDeparture: 0,
        lateness: 0,
        absence: 0
      };
    }

    // Calcular dias usando a função calculateDurationInDays
    const days = calculateDurationInDays(item);
    
    switch (item.type) {
      case 'time-off':
        monthlyData[monthKey].timeOff += days;
        break;
      case 'early-departure':
        monthlyData[monthKey].earlyDeparture += days;
        break;
      case 'lateness':
        monthlyData[monthKey].lateness += days;
        break;
      case 'absence':
        monthlyData[monthKey].absence += days;
        break;
    }
  });

  // Ordenar por chave do mês (YYYY-MM) para garantir ordem cronológica
  const result = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  
  // Se não há dados e nenhum filtro específico foi aplicado, retornar array vazio
  if (data.length === 0 && !selectedYear && !selectedMonth) {
    return [];
  }
  
  return result;
};

// Função para gerar dados por fábrica
export const generateFactoryData = (data: RequestData[]): FactoryData[] => {
  const factoryData: { [key: string]: FactoryData } = {};

  // Filtrar apenas dados aprovados
  const approvedData = data.filter(item => item.status === 'approved');

  approvedData.forEach(item => {
    if (!factoryData[item.factoryName]) {
      factoryData[item.factoryName] = {
        factory: item.factoryName,
        total: 0,
        timeOff: 0,
        absence: 0,
        lateness: 0,
        earlyDeparture: 0
      };
    }

    const days = calculateDurationInDays(item);
    factoryData[item.factoryName].total += days;
    
    switch (item.type) {
      case 'time-off':
        factoryData[item.factoryName].timeOff += days;
        break;
      case 'absence':
        factoryData[item.factoryName].absence += days;
        break;
      case 'lateness':
        factoryData[item.factoryName].lateness += days;
        break;
      case 'early-departure':
        factoryData[item.factoryName].earlyDeparture += days;
        break;
    }
  });

  return Object.values(factoryData);
};

// Função para gerar dados por usuário
export const generateUserData = (data: RequestData[]): UserData[] => {
  const userData: { [key: string]: UserData } = {};

  // Filtrar apenas dados aprovados
  const approvedData = data.filter(item => item.status === 'approved');

  approvedData.forEach(item => {
    if (!userData[item.userName]) {
      userData[item.userName] = {
        user: item.userName,
        total: 0,
        timeOff: 0,
        earlyDeparture: 0,
        lateness: 0,
        absence: 0
      };
    }

    const days = calculateDurationInDays(item);
    userData[item.userName].total += days;
    
    switch (item.type) {
      case 'time-off':
        userData[item.userName].timeOff += days;
        break;
      case 'early-departure':
        userData[item.userName].earlyDeparture += days;
        break;
      case 'lateness':
        userData[item.userName].lateness += days;
        break;
      case 'absence':
        userData[item.userName].absence += days;
        break;
    }
  });

  return Object.values(userData).sort((a, b) => b.total - a.total);
};

// Função para gerar dados dos motivos
export const generateReasonsData = (data: RequestData[]): ReasonsData[] => {
  const reasonsCount: { [key: string]: number } = {};
  
  // Filtrar apenas dados aprovados para o gráfico de motivos
  const approvedData = data.filter(item => item.status === 'approved');
  
  // Contar motivos e normalizar motivos personalizados
  approvedData.forEach(item => {
    if (item.reason) {
      let normalizedReason = item.reason;
      
      // Normalizar motivos personalizados para "Outros"
      if (isCustomOthersReason(item.reason)) {
        normalizedReason = 'Outros';
      }
      
      // Calcular dias usando a função calculateDurationInDays
      const days = calculateDurationInDays(item);
      reasonsCount[normalizedReason] = (reasonsCount[normalizedReason] || 0) + days;
    }
  });

  const total = Object.values(reasonsCount).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return [];
  }

  // Cores para os gráficos
  const colors = [
    '#3B82F6', '#8B5CF6', '#EAB308', '#F97316', '#10B981', '#EF4444',
    '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5A2B', '#059669',
    '#7C3AED', '#DC2626', '#0891B2', '#CA8A04', '#9333EA', '#BE123C'
  ];

  // Converter para array e ordenar por contagem
  const reasonsArray = Object.entries(reasonsCount)
    .map(([reason, count], index) => ({
      reason,
      count,
      percentage: Math.round((count / total) * 100),
      fill: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count);

  return reasonsArray;
};

// Função para gerar dados de usuários por motivo específico
export const generateReasonUserData = (data: RequestData[], selectedReason: string): ReasonUserData[] => {
  const userCount: { [key: string]: number } = {};
  
  // Filtrar apenas dados aprovados para o motivo específico
  const filteredData = data.filter(item => {
    if (item.status !== 'approved' || !item.reason) return false;
    
    // Normalizar motivo se necessário
    let normalizedReason = item.reason;
    if (isCustomOthersReason(item.reason)) {
      normalizedReason = 'Outros';
    }
    
    return normalizedReason === selectedReason;
  });
  
  // Contar quantas vezes cada usuário usou esse motivo
  filteredData.forEach(item => {
    userCount[item.userName] = (userCount[item.userName] || 0) + 1;
  });

  const total = Object.values(userCount).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return [];
  }

  // Cores para os gráficos
  const colors = [
    '#3B82F6', '#8B5CF6', '#EAB308', '#F97316', '#10B981', '#EF4444',
    '#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5A2B', '#059669',
    '#7C3AED', '#DC2626', '#0891B2', '#CA8A04', '#9333EA', '#BE123C'
  ];

  // Converter para array e ordenar por contagem
  const usersArray = Object.entries(userCount)
    .map(([user, count], index) => ({
      user,
      count,
      fill: colors[index % colors.length]
    }))
    .sort((a, b) => b.count - a.count);

  return usersArray;
};

// Função para buscar dados específicos do usuário
export const fetchUserData = async (userId: string) => {
  const data = await fetchDataForCharts({ userId });
  return data;
};

// Função para buscar usuários para filtros
export const fetchUsersForFilter = async () => {
  const { data, error } = await supabase
    .from('profiles')
            .select('id, first_name, factory_id')
    .order('first_name');

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }

  return data?.map(user => ({
    id: user.id,
            name: user.first_name
  })) || [];
};

// Função para buscar fábricas para filtros
export const fetchFactoriesForFilter = async () => {
  const { data, error } = await supabase
    .from('factories')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Erro ao buscar fábricas:', error);
    throw error;
  }

  return data?.map(factory => ({
    id: factory.id,
    name: factory.name
  })) || [];
};

// Função para buscar substitutos para filtros
export const fetchSubstitutesForFilter = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name')
    .order('first_name');

  if (error) {
    console.error('Erro ao buscar substitutos:', error);
    throw error;
  }

  return data?.map(substitute => ({
    id: substitute.id,
    name: substitute.first_name
  })) || [];
};

// Função para buscar prestadoras para filtros
export const fetchPrestadorasForFilter = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('prestadora')
    .not('prestadora', 'is', null)
    .not('prestadora', 'eq', '');

  if (error) {
    console.error('Erro ao buscar prestadoras:', error);
    throw error;
  }

  const prestadoras = data?.map(p => p.prestadora).filter(Boolean) || [];
  const uniquePrestadoras = [...new Set(prestadoras)];
  
  return uniquePrestadoras.sort();
};

// Função para buscar motivos únicos para filtros
export const fetchReasonsForFilter = async (requestType?: RequestType): Promise<string[]> => {
  try {
    let requestsData: any[] = [];
    let timeOffData: any[] = [];

    // Se um tipo específico for fornecido, filtrar por tipo
    if (requestType) {
      if (requestType === 'time-off' || requestType === 'absence') {
        // Para folgas e faltas, buscar na tabela time_off
        const { data, error } = await supabase
          .from('time_off')
          .select('reason, start_date, end_date')
          .not('reason', 'is', null);

        if (error) {
          console.error('Erro ao buscar motivos do time_off:', error);
          throw error;
        }

        // Filtrar por tipo (absence = start_date === end_date, time-off = start_date !== end_date)
        if (requestType === 'absence') {
          timeOffData = data?.filter(item => item.start_date === item.end_date) || [];
        } else {
          timeOffData = data?.filter(item => item.start_date !== item.end_date) || [];
        }
      } else if (requestType === 'early-departure') {
        // Para saídas antecipadas, buscar na tabela early_departures
        const { data, error } = await supabase
          .from('early_departures')
          .select('reason')
          .not('reason', 'is', null);

        if (error) {
          console.error('Erro ao buscar motivos das early_departures:', error);
          throw error;
        }

        requestsData = data || [];
      } else if (requestType === 'lateness') {
        // Para atrasos, buscar na tabela lateness
        const { data, error } = await supabase
          .from('lateness')
          .select('reason')
          .not('reason', 'is', null);

        if (error) {
          console.error('Erro ao buscar motivos das lateness:', error);
          throw error;
        }

        requestsData = data || [];
      } else {
        // Para outros tipos, buscar na tabela requests
        const { data, error } = await supabase
          .from('requests')
          .select('reason')
          .eq('type', requestType)
          .not('reason', 'is', null);

        if (error) {
          console.error('Erro ao buscar motivos das requests:', error);
          throw error;
        }

        requestsData = data || [];
      }
    } else {
      // Se nenhum tipo for especificado, buscar todos os motivos de todas as tabelas
      const { data: reqData, error: requestsError } = await supabase
        .from('requests')
        .select('reason')
        .not('reason', 'is', null);

      if (requestsError) {
        console.error('Erro ao buscar motivos das requests:', requestsError);
        throw requestsError;
      }

      const { data: timeData, error: timeOffError } = await supabase
        .from('time_off')
        .select('reason')
        .not('reason', 'is', null);

      if (timeOffError) {
        console.error('Erro ao buscar motivos do time_off:', timeOffError);
        throw timeOffError;
      }

      const { data: earlyDepData, error: earlyDepError } = await supabase
        .from('early_departures')
        .select('reason')
        .not('reason', 'is', null);

      if (earlyDepError) {
        console.error('Erro ao buscar motivos das early_departures:', earlyDepError);
        throw earlyDepError;
      }

      const { data: latenessDataReasons, error: latenessErrorReasons } = await supabase
        .from('lateness')
        .select('reason')
        .not('reason', 'is', null);

      if (latenessErrorReasons) {
        console.error('Erro ao buscar motivos das lateness:', latenessErrorReasons);
        throw latenessErrorReasons;
      }

      requestsData = [...(reqData || []), ...(earlyDepData || []), ...(latenessDataReasons || [])];
      timeOffData = timeData || [];
    }

    // Combinar e extrair motivos únicos
    const allReasons = [
      ...(requestsData?.map(item => item.reason).filter(Boolean) || []),
      ...(timeOffData?.map(item => item.reason).filter(Boolean) || [])
    ];

    // Normalizar motivos personalizados usando a função helper
    const normalizedReasons = allReasons.map(reason => {
      if (isCustomOthersReason(reason)) {
        return 'Outros';
      }
      return reason;
    });

    // Log para debug - mostrar quantos motivos foram normalizados
    const originalCount = allReasons.length;
    const normalizedCount = normalizedReasons.filter(r => r === 'Outros').length;
    const originalOthersCount = allReasons.filter(r => isCustomOthersReason(r)).length;
    
        const uniqueReasons = [...new Set(normalizedReasons)].sort();
    return uniqueReasons;
  } catch (error) {
    console.error('Erro ao buscar motivos únicos:', error);
    return [];
  }
}; 