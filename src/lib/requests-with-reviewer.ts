import { supabase } from '@/integrations/supabase/client';
import { checkAndFixRLS } from '@/utils/supabase-fix';

/**
 * Versão atualizada de loadAllRequests que inclui informações do revisor
 * Use esta função após executar o script add-approved-by-fields.sql
 */
export const loadAllRequestsWithReviewer = async () => {
  try {
    console.log('Iniciando loadAllRequestsWithReviewer...');
    
    // Verificar e corrigir RLS primeiro
    await checkAndFixRLS();
    
    // Buscar todas as solicitações da tabela requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*');

    if (requestsError) {
      console.error('Erro ao buscar requests:', requestsError);
      throw requestsError;
    }

    // Buscar todas as solicitações da tabela time_off
    const { data: timeOffData, error: timeOffError } = await supabase
      .from('time_off')
      .select('*');

    if (timeOffError) {
      console.error('Erro ao buscar time_off:', timeOffError);
      throw timeOffError;
    }

    // Buscar todos os perfis de usuários para fazer o join manualmente
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name');

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    // Criar um mapa de perfis para acesso rápido
    const profilesMap = new Map();
    profilesData?.forEach(profile => {
      profilesMap.set(profile.id, profile.first_name);
    });

    // Formatar todas as requisições no mesmo formato
    const formattedRequests = [
      ...(requestsData || []).map(req => ({
        id: req.id,
        type: req.type,
        status: req.status,
        date: req.start_date,
        endDate: req.end_date,
        time: req.time,
        arrivalTime: req.arrival_time,
        reason: req.reason,
        created_at: req.created_at,
        user_id: req.user_id,
        userName: profilesMap.get(req.user_id) || 'Usuário não encontrado',
        approved_by: req.approved_by,
        rejected_by: req.rejected_by,
        reviewed_at: req.reviewed_at,
        rejectReason: (req as any).reject_reason || null,
        reviewerName: req.approved_by ? profilesMap.get(req.approved_by) : 
                     req.rejected_by ? profilesMap.get(req.rejected_by) : null
      })),
      ...(timeOffData || []).map(timeOff => ({
        id: timeOff.id,
        type: 'time-off' as const,
        status: timeOff.status,
        date: timeOff.start_date,
        endDate: timeOff.end_date,
        reason: timeOff.reason,
        created_at: timeOff.created_at,
        user_id: timeOff.user_id,
        userName: profilesMap.get(timeOff.user_id) || 'Usuário não encontrado',
        approved_by: timeOff.approved_by,
        rejected_by: timeOff.rejected_by,
        reviewed_at: timeOff.reviewed_at,
        rejectReason: timeOff.reject_reason,
        reviewerName: timeOff.approved_by ? profilesMap.get(timeOff.approved_by) : 
                     timeOff.rejected_by ? profilesMap.get(timeOff.rejected_by) : null
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('FormattedRequests com revisor:', formattedRequests);

    return { success: true, data: formattedRequests };
  } catch (error) {
    console.error('Erro ao carregar todas as requisições com revisor:', error);
    return { success: false, error };
  }
}; 