import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se há feriados/eventos que bloqueiam solicitações de folga
 * em um período específico para a fábrica do usuário
 */
export const checkBlockedDates = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<{ isBlocked: boolean; blockedDate?: { date: string; name: string } }> => {
  try {
    // Buscar fábrica do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('factory_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.factory_id) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return { isBlocked: false };
    }

    // Verificar feriados bloqueados para a fábrica do usuário
    const { data: blockedHolidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date, name')
      .eq('factory_id', userProfile.factory_id)
      .eq('blocks_time_off', true);

    if (holidaysError) {
      console.error('Erro ao buscar feriados bloqueados:', holidaysError);
      return { isBlocked: false };
    }

    if (!blockedHolidays || blockedHolidays.length === 0) {
      return { isBlocked: false };
    }

    // Verificar se alguma data no período solicitado está bloqueada
    const blockedDate = blockedHolidays.find(holiday => {
      const holidayDate = holiday.date;
      return holidayDate >= startDate && holidayDate <= endDate;
    });

    if (blockedDate) {
      return { 
        isBlocked: true, 
        blockedDate: { date: blockedDate.date, name: blockedDate.name }
      };
    }

    return { isBlocked: false };
  } catch (error) {
    console.error('Erro ao verificar feriados bloqueados:', error);
    return { isBlocked: false };
  }
};

/**
 * Busca todos os feriados bloqueados para a fábrica do usuário
 */
export const getBlockedDatesForUser = async (userId: string): Promise<string[]> => {
  try {
    // Buscar fábrica do usuário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('factory_id')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile?.factory_id) {
      return [];
    }

    // Verificar feriados bloqueados para a fábrica do usuário
    const { data: blockedHolidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('date')
      .eq('factory_id', userProfile.factory_id)
      .eq('blocks_time_off', true);

    if (holidaysError) {
      console.error('Erro ao buscar feriados bloqueados:', holidaysError);
      return [];
    }

    return blockedHolidays?.map(holiday => holiday.date) || [];
  } catch (error) {
    console.error('Erro ao buscar feriados bloqueados:', error);
    return [];
  }
};
