import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se ainda é possível solicitar folga em uma data específica
 * @param requestDate Data da solicitação (formato YYYY-MM-DD)
 * @param userId ID do usuário (para excluir suas próprias solicitações pendentes)
 * @returns Promise<{canRequest: boolean, currentCount: number, maxAllowed: number, message?: string}>
 */
export const checkDailyLeaveLimit = async (
  requestDate: string, 
  userId?: string
): Promise<{
  canRequest: boolean;
  currentCount: number;
  maxAllowed: number;
  message?: string;
}> => {
  try {
  // Verificando limite de folgas para a data solicitada
    
    // Buscar limite global configurado
    const { data: limitConfig, error: limitError } = await supabase
      .from('daily_leave_limits')
      .select('max_leaves_per_day')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    // Verificar se conseguiu buscar o limite

    if (limitError || !limitConfig) {
      console.error('Erro ao buscar limite de folgas:', limitError);
      return {
        canRequest: true, // Se não conseguir verificar, permitir
        currentCount: 0,
        maxAllowed: 2 // Padrão
      };
    }

    const maxAllowed = limitConfig.max_leaves_per_day;

    // Buscar folgas já aprovadas para esta data (TODAS as fábricas)
    // Usar range de datas para buscar por data
    const dateStr = requestDate.split('T')[0];
    
    // Ajustar para timezone UTC (as folgas estão com +00:00)
    const startTime = `${dateStr}T00:00:00+00:00`;
    const endTime = `${dateStr}T23:59:59+00:00`;
    
    // Buscar folgas aprovadas de ambas as tabelas
    
    // 1. Buscar da tabela requests - verificar se a data está no RANGE (start_date até end_date)
    const { data: approvedLeavesFromRequests, error: requestsError } = await supabase
      .from('requests')
      .select('id, user_id, start_date, end_date, status, type')
      .eq('type', 'time-off')
      .eq('status', 'approved')
      .gte('start_date', startTime)
      .lte('start_date', endTime);

    // 2. Buscar da tabela time_off - verificar se a data está no RANGE (start_date até end_date)
    const { data: approvedLeavesFromTimeOff, error: timeOffError } = await supabase
      .from('time_off')
      .select('id, user_id, start_date, end_date, status')
      .eq('status', 'approved')
      .gte('start_date', startTime)
      .lte('start_date', endTime);

    // 3. Combinar os resultados
    const approvedLeaves = [
      ...(approvedLeavesFromRequests || []),
      ...(approvedLeavesFromTimeOff || [])
    ];


    const leavesError = requestsError || timeOffError;

    if (leavesError) {
      console.error('Erro ao buscar folgas aprovadas:', leavesError);
      return {
        canRequest: true, // Se não conseguir verificar, permitir
        currentCount: 0,
        maxAllowed
      };
    }

    const approvedCount = approvedLeaves?.length || 0;
    
    // Só bloqueia se tiver 2 ou mais aprovadas
    // Folgas pendentes não contam no limite
    const currentCount = approvedCount;
    const canRequest = currentCount < maxAllowed;

    return {
      canRequest,
      currentCount,
      maxAllowed,
      message: canRequest 
        ? undefined 
        : `Limite de folga atingido para esse dia. Qualquer dúvida fale com o responsável.`
    };

  } catch (error) {
    console.error('Erro ao verificar limite de folgas:', error);
    return {
      canRequest: true, // Em caso de erro, permitir
      currentCount: 0,
      maxAllowed: 2
    };
  }
};

/**
 * Busca o limite global configurado
 * @returns Promise<number> Limite máximo de folgas por dia
 */
export const getDailyLeaveLimit = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('daily_leave_limits')
      .select('max_leaves_per_day')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error || !data) {
      console.error('Erro ao buscar limite de folgas:', error);
      return 2; // Padrão
    }

    return data.max_leaves_per_day;
  } catch (error) {
    console.error('Erro ao buscar limite de folgas:', error);
    return 2; // Padrão
  }
};

/**
 * Atualiza o limite global de folgas
 * @param maxLeavesPerDay Novo limite máximo
 * @returns Promise<boolean> Sucesso da operação
 */
export const updateDailyLeaveLimit = async (
  maxLeavesPerDay: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('daily_leave_limits')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        max_leaves_per_day: maxLeavesPerDay,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao atualizar limite de folgas:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar limite de folgas:', error);
    return false;
  }
};
