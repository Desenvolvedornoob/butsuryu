import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface DismissalFilters {
  year?: number;
  month?: number;
  factoryId?: string;
  department?: string;
  reason?: string;
  prestadora?: string;
}

export interface DismissalData {
  id: string;
  first_name: string;
  name_japanese?: string;
  phone: string;
  department: string;
  factoryId: string;
  factoryName: string;
  responsible: string;
  dismissal_reason?: string;
  created_at: string;
  updated_at: string;
  city?: string;
  hire_date?: string;
  birth_date?: string;
  prestadora?: string;
}

export interface DismissalChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface MonthlyDismissalData {
  month: string;
  count: number;
}

export interface FactoryDismissalData {
  factory: string;
  count: number;
}

export interface ReasonDismissalData {
  reason: string;
  count: number;
  percentage: number;
}

export interface DepartmentDismissalData {
  department: string;
  count: number;
}

// Função principal para buscar dados de desligamentos
export const fetchDismissalData = async (filters: DismissalFilters = {}) => {
  try {
    console.log('🔍 Buscando dados de desligamentos com filtros:', filters);
    
    // Buscar perfis com status 'desligamento'
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        name_japanese,
        phone,
        department,
        factory_id,
        responsible,
        dismissal_reason,
        created_at,
        updated_at,
        city,
        hire_date,
        birth_date,
        prestadora
      `)
      .eq('status', 'desligamento');

    // Aplicar filtros
    if (filters.factoryId) {
      query = query.eq('factory_id', filters.factoryId);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    if (filters.reason) {
      if (filters.reason === 'Outro') {
        // Para "Outro", buscar registros que começam com "Outro:"
        query = query.like('dismissal_reason', 'Outro:%');
      } else {
        query = query.eq('dismissal_reason', filters.reason);
      }
    }

    if (filters.prestadora) {
      query = query.eq('prestadora', filters.prestadora);
    }

    const { data: dismissalProfiles, error: profilesError } = await query;

    if (profilesError) {
      console.error('Erro ao buscar perfis de desligamento:', profilesError);
      throw profilesError;
    }

    // Buscar fábricas para mapear nomes
    const { data: factoriesData, error: factoriesError } = await supabase
      .from('factories')
      .select('id, name');

    if (factoriesError) {
      console.error('Erro ao buscar fábricas:', factoriesError);
      throw factoriesError;
    }

    // Processar dados
    const processedData: DismissalData[] = (dismissalProfiles || []).map(profile => {
      const factory = factoriesData?.find(f => f.id === profile.factory_id);
      return {
        id: profile.id,
        first_name: profile.first_name || '',
        name_japanese: profile.name_japanese || '',
        phone: profile.phone || '',
        department: profile.department || '',
        factoryId: profile.factory_id || '',
        factoryName: factory?.name || 'N/A',
        responsible: profile.responsible || '',
        dismissal_reason: profile.dismissal_reason || '',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        city: profile.city || '',
        hire_date: profile.hire_date || '',
        birth_date: profile.birth_date || '',
        prestadora: profile.prestadora || ''
      };
    });

    // Aplicar filtros de data após processamento
    let filteredData = processedData;

    if (filters.year || filters.month) {
      filteredData = processedData.filter(item => {
        const updatedDate = new Date(item.updated_at);
        
        if (filters.year && updatedDate.getFullYear() !== filters.year) {
          return false;
        }
        
        if (filters.month && updatedDate.getMonth() + 1 !== filters.month) {
          return false;
        }
        
        return true;
      });
    }

    console.log(`✅ Dados de desligamento retornados: ${filteredData.length} registros`);
    return filteredData;
  } catch (error) {
    console.error('Erro ao buscar dados de desligamentos:', error);
    throw error;
  }
};

// Gerar dados para gráfico por motivo
export const generateDismissalByReason = (data: DismissalData[]): ReasonDismissalData[] => {
  const reasonCounts = data.reduce((acc, item) => {
    let reason = item.dismissal_reason || 'Não informado';
    
    // Agrupar motivos personalizados como "Outro"
    if (reason.startsWith('Outro:')) {
      reason = 'Outro';
    }
    
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = data.length;
  
  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
};

// Gerar dados para gráfico por fábrica
export const generateDismissalByFactory = (data: DismissalData[]): FactoryDismissalData[] => {
  const factoryCounts = data.reduce((acc, item) => {
    const factory = item.factoryName || 'N/A';
    acc[factory] = (acc[factory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(factoryCounts)
    .map(([factory, count]) => ({ factory, count }))
    .sort((a, b) => b.count - a.count);
};

// Gerar dados para gráfico por departamento
export const generateDismissalByDepartment = (data: DismissalData[]): DepartmentDismissalData[] => {
  const departmentCounts = data.reduce((acc, item) => {
    const department = item.department || 'N/A';
    acc[department] = (acc[department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(departmentCounts)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);
};

// Gerar dados mensais
export const generateMonthlyDismissalData = (data: DismissalData[]): MonthlyDismissalData[] => {
  const monthlyCounts = data.reduce((acc, item) => {
    const date = new Date(item.updated_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

// Buscar fábricas para filtros
export const fetchFactoriesForDismissalFilter = async () => {
  try {
    const { data, error } = await supabase
      .from('factories')
      .select('id, name')
      .order('name');

    if (error) throw error;
    
    return data?.map(factory => ({
      id: factory.id,
      name: factory.name
    })) || [];
  } catch (error) {
    console.error('Erro ao buscar fábricas:', error);
    return [];
  }
};

// Buscar departamentos únicos para filtros
export const fetchDepartmentsForDismissalFilter = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .eq('status', 'desligamento')
      .not('department', 'is', null);

    if (error) throw error;
    
    const departments = [...new Set(data?.map(p => p.department).filter(Boolean))] || [];
    return departments.sort();
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    return [];
  }
};

// Buscar motivos únicos para filtros
export const fetchReasonsForDismissalFilter = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('dismissal_reason')
      .eq('status', 'desligamento')
      .not('dismissal_reason', 'is', null);

    if (error) throw error;
    
    const reasons = data?.map(p => p.dismissal_reason).filter(Boolean) || [];
    const uniqueReasons = [...new Set(reasons.map(reason => {
      // Agrupar motivos personalizados como "Outro"
      if (reason?.startsWith('Outro:')) {
        return 'Outro';
      }
      return reason;
    }).filter(Boolean))];
    
    return uniqueReasons.sort();
  } catch (error) {
    console.error('Erro ao buscar motivos:', error);
    return [];
  }
};

// Buscar prestadoras para filtro
export const fetchPrestadorasForDismissalFilter = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('prestadora')
      .eq('status', 'desligamento')
      .not('prestadora', 'is', null);

    if (error) throw error;
    
    const prestadoras = data?.map(p => p.prestadora).filter(Boolean) || [];
    const uniquePrestadoras = [...new Set(prestadoras)];
    
    return uniquePrestadoras.sort();
  } catch (error) {
    console.error('Erro ao buscar prestadoras:', error);
    return [];
  }
};

// Calcular estatísticas gerais
export const calculateDismissalStats = (data: DismissalData[]) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const thisYear = data.filter(item => 
    new Date(item.updated_at).getFullYear() === currentYear
  ).length;
  
  const thisMonth = data.filter(item => {
    const date = new Date(item.updated_at);
    return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
  }).length;
  
  const byFactory = generateDismissalByFactory(data);
  const byReason = generateDismissalByReason(data);
  
  return {
    total: data.length,
    thisYear,
    thisMonth,
    topFactory: byFactory[0]?.factory || 'N/A',
    topReason: byReason[0]?.reason || 'N/A'
  };
};
