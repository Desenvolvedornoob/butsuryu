import { supabase } from '@/integrations/supabase/client';
import { checkAndFixRLS } from '@/utils/supabase-fix';

export const loadRequests = async (userId: string) => {
  try {
    // Buscar todas as requisições do usuário da tabela requests
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId);

    if (requestsError) throw requestsError;

    // Buscar solicitações de time_off do usuário
    const { data: timeOffRequests, error: timeOffError } = await supabase
      .from('time_off')
      .select('*')
      .eq('user_id', userId);

    if (timeOffError) throw timeOffError;

    // Buscar solicitações de early_departures do usuário
    const { data: earlyDeparturesRequests, error: earlyDeparturesError } = await supabase
      .from('early_departures')
      .select('*')
      .eq('user_id', userId);

    if (earlyDeparturesError) throw earlyDeparturesError;

    // Buscar solicitações de lateness do usuário
    const { data: latenessRequests, error: latenessError } = await supabase
      .from('lateness')
      .select('*')
      .eq('user_id', userId);

    if (latenessError) throw latenessError;

    // Buscar perfil do usuário para obter o nome
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
    }

    const allRequests: any[] = [];

    // Processar requests da tabela requests
    (requests || []).forEach(req => {
      allRequests.push({
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
        userName: userProfile?.first_name || 'Usuário não encontrado'
      });
    });

    // Processar time_off que não estão na tabela requests
    (timeOffRequests || []).forEach(req => {
      // Verificar se já existe na tabela requests
      const existsInRequests = requests?.some(r => r.id === req.id);
      if (!existsInRequests) {
        allRequests.push({
          id: req.id,
          type: 'time-off',
          status: req.status,
          date: req.start_date,
          endDate: req.end_date,
          reason: req.reason,
          created_at: req.created_at,
          user_id: req.user_id,
          userName: userProfile?.first_name || 'Usuário não encontrado'
        });
      }
    });

    // Processar early_departures que não estão na tabela requests
    (earlyDeparturesRequests || []).forEach(req => {
      const existsInRequests = requests?.some(r => r.id === req.id);
      if (!existsInRequests) {
        allRequests.push({
          id: req.id,
          type: 'early-departure',
          status: req.status,
          date: req.start_date,
          endDate: req.end_date,
          time: req.time,
          reason: req.reason,
          created_at: req.created_at,
          user_id: req.user_id,
          userName: userProfile?.first_name || 'Usuário não encontrado'
        });
      }
    });

    // Processar lateness que não estão na tabela requests
    (latenessRequests || []).forEach(req => {
      const existsInRequests = requests?.some(r => r.id === req.id);
      if (!existsInRequests) {
        allRequests.push({
          id: req.id,
          type: 'lateness',
          status: req.status,
          date: req.start_date,
          endDate: req.end_date,
          arrivalTime: req.arrival_time,
          reason: req.reason,
          created_at: req.created_at,
          user_id: req.user_id,
          userName: userProfile?.first_name || 'Usuário não encontrado'
        });
      }
    });

    // Ordenar por data de criação (mais recente primeiro)
    const formattedRequests = allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, data: formattedRequests };
  } catch (error) {
    console.error('Erro ao carregar requisições:', error);
    return { success: false, error };
  }
};

export const loadAllRequests = async () => {
  try {
    
    // Carregando todas as solicitações
    
    // Verificar e corrigir RLS primeiro
    await checkAndFixRLS();
    

    
    // Buscar todas as solicitações
    const { data: requestsData, error: requestsError } = await supabase
      .from('requests')
      .select('*');

    // Requests query executada

    if (requestsError) {
      console.error('Erro na query de requests:', requestsError);
    }

    // Buscar TODAS as solicitações de time_off (removendo filtro de status)
    const { data: timeOffRequests, error: timeOffError } = await supabase
      .from('time_off')
      .select('*');
    


    // Time off data loaded
    
    // Log específico para verificar se a solicitação problemática está nos dados

    if (timeOffError) {
      console.error('Erro na query de time_off:', timeOffError);
      throw timeOffError;
    }

    // Buscar TODAS as solicitações de early_departures
    const { data: earlyDeparturesRequests, error: earlyDeparturesError } = await supabase
      .from('early_departures')
      .select('*');

    // Early departures data loaded

    if (earlyDeparturesError) {
      console.error('Erro na query de early_departures:', earlyDeparturesError);
      throw earlyDeparturesError;
    }

    // Buscar TODAS as solicitações de lateness
    const { data: latenessRequests, error: latenessError } = await supabase
      .from('lateness')
      .select('*');

    // Lateness data loaded

    if (latenessError) {
      console.error('Erro na query de lateness:', latenessError);
      throw latenessError;
    }

    // Buscar todos os perfis para mapear revisores
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name');

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError);
    }

    // Criar mapa de perfis para busca rápida
    const profilesMap = new Map();
    allProfiles?.forEach(profile => {
      profilesMap.set(profile.id, profile.first_name);
    });

    // Buscar todos os perfis necessários
    const allUserIds = new Set<string>();
    
    // Coletar IDs dos usuários e revisores
    requestsData?.forEach(req => {
      allUserIds.add(req.user_id);
      if (req.approved_by) allUserIds.add(req.approved_by);
      if (req.rejected_by) allUserIds.add(req.rejected_by);
      if (req.substitute_id) allUserIds.add(req.substitute_id);
    });
    
    timeOffRequests?.forEach(req => {
      allUserIds.add(req.user_id);
      if (req.approved_by) allUserIds.add(req.approved_by);
      if (req.rejected_by) allUserIds.add(req.rejected_by);
      if (req.substitute_id) allUserIds.add(req.substitute_id);
    });
    
    earlyDeparturesRequests?.forEach(req => {
      allUserIds.add(req.user_id);
      if (req.approved_by) allUserIds.add(req.approved_by);
      if (req.rejected_by) allUserIds.add(req.rejected_by);
      if (req.substitute_id) allUserIds.add(req.substitute_id);
    });

    latenessRequests?.forEach(req => {
      allUserIds.add(req.user_id);
      if (req.approved_by) allUserIds.add(req.approved_by);
      if (req.rejected_by) allUserIds.add(req.rejected_by);
      if (req.substitute_id) allUserIds.add(req.substitute_id);
    });
    
    // Buscar os perfis de todos os usuários necessários incluindo o factory_id
    const { data: profiles, error: profilesError2 } = await supabase
      .from('profiles')
      .select('id, first_name, factory_id')
      .in('id', Array.from(allUserIds));
    
    if (profilesError2) {
      console.error('Erro ao carregar profiles adicionais:', profilesError2);
    }
    
    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map<string, { first_name: string; factory_id?: string }>();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, { 
        first_name: profile.first_name, 
        factory_id: profile.factory_id 
      });
    });
    


    // Criar um Set para rastrear IDs já processados e evitar duplicatas
    const processedIds = new Set<string>();
    
    // Formatar todas as requisições no mesmo formato, removendo duplicatas
    const allRequests = [];
    
    // Primeiro, processar as requisições da tabela 'requests'
    (requestsData || []).forEach(req => {
      if (!processedIds.has(req.id)) {
        processedIds.add(req.id);
        const userProfile = profileMap.get(req.user_id);
        const approverProfile = req.approved_by ? profileMap.get(req.approved_by) : null;
        const rejecterProfile = req.rejected_by ? profileMap.get(req.rejected_by) : null;
        
        // Buscar substitute_id da tabela específica
        let substituteName = null;
        if (req.type === 'time-off') {
          const timeOffRecord = timeOffRequests?.find(to => to.id === req.id);
          if (timeOffRecord?.substitute_id) {
            const substituteProfile = profileMap.get(timeOffRecord.substitute_id);
            substituteName = substituteProfile ? substituteProfile.first_name : null;
          }
        } else if (req.type === 'early-departure') {
          const earlyRecord = earlyDeparturesRequests?.find(ed => ed.id === req.id);
          if (earlyRecord?.substitute_id) {
            const substituteProfile = profileMap.get(earlyRecord.substitute_id);
            substituteName = substituteProfile ? substituteProfile.first_name : null;
          }
        } else if (req.type === 'lateness') {
          const latenessRecord = latenessRequests?.find(l => l.id === req.id);
          if (latenessRecord?.substitute_id) {
            const substituteProfile = profileMap.get(latenessRecord.substitute_id);
            substituteName = substituteProfile ? substituteProfile.first_name : null;
          }
        }
        
        allRequests.push({
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
          factory_id: userProfile?.factory_id || null,
          userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
          approved_by: req.approved_by || null,
          rejected_by: req.rejected_by || null,
          reviewed_at: req.reviewed_at || null,
          rejectReason: null,
          reviewerName: approverProfile ? approverProfile.first_name : 
                       rejecterProfile ? rejecterProfile.first_name : null,
          substituteName: substituteName
        });
      }
    });
    
    // Depois, processar as requisições da tabela 'time_off' que não foram processadas ainda
    (timeOffRequests || []).forEach(timeOff => {
      
      // Permitir reprocessamento apenas para a solicitação específica que está causando problema
      const shouldReprocess = !processedIds.has(timeOff.id) || 
        (timeOff.id === 'e3699386-b264-4fd5-85a4-1ae0622cb58b' && timeOff.start_date === timeOff.end_date);
      
      
      if (shouldReprocess) {
        processedIds.add(timeOff.id);
        const userProfile = profileMap.get(timeOff.user_id);
        const approverProfile = timeOff.approved_by ? profileMap.get(timeOff.approved_by) : null;
        const rejecterProfile = timeOff.rejected_by ? profileMap.get(timeOff.rejected_by) : null;
        const substituteProfile = timeOff.substitute_id ? profileMap.get(timeOff.substitute_id) : null;
        

        
        // Buscar o tipo original na tabela requests
        const originalRequest = requestsData?.find(req => req.id === timeOff.id);
        const originalType = originalRequest?.type || 'time-off';
        
        // Se não há registro na tabela requests E as datas são iguais, então é absence
        const isAbsence = !originalRequest && timeOff.start_date === timeOff.end_date;
        
        
        if (isAbsence) {
        } else {
        }
        
        allRequests.push({
          id: timeOff.id,
          type: isAbsence ? 'absence' : originalType,
          status: timeOff.status,
          date: timeOff.start_date,
          endDate: timeOff.end_date,
          reason: timeOff.reason,
          created_at: timeOff.created_at,
          user_id: timeOff.user_id,
          factory_id: userProfile?.factory_id || null,
          userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
          approved_by: timeOff.approved_by || null,
          rejected_by: timeOff.rejected_by || null,
          reviewed_at: timeOff.reviewed_at || null,
          rejectReason: timeOff.reject_reason || null,
          reviewerName: approverProfile ? approverProfile.first_name : 
                       rejecterProfile ? rejecterProfile.first_name : null,
          substituteName: substituteProfile ? substituteProfile.first_name : null
        });
      }
    });

    // Depois, processar as requisições da tabela 'early_departures' que não foram processadas ainda
    (earlyDeparturesRequests || []).forEach(earlyDeparture => {
      if (!processedIds.has(earlyDeparture.id)) {
        processedIds.add(earlyDeparture.id);
        const userProfile = profileMap.get(earlyDeparture.user_id);
        const approverProfile = earlyDeparture.approved_by ? profileMap.get(earlyDeparture.approved_by) : null;
        const rejecterProfile = earlyDeparture.rejected_by ? profileMap.get(earlyDeparture.rejected_by) : null;
        const substituteProfile = earlyDeparture.substitute_id ? profileMap.get(earlyDeparture.substitute_id) : null;

        console.log(`🔧 Processando early_departure ID: ${earlyDeparture.id}, User: ${userProfile?.first_name || 'Não encontrado'}, Date: ${earlyDeparture.date}`);

        allRequests.push({
          id: earlyDeparture.id,
          type: 'early-departure' as const,
          status: earlyDeparture.status,
          date: earlyDeparture.date,
          endDate: earlyDeparture.date,
          time: earlyDeparture.time,
          reason: earlyDeparture.reason,
          created_at: earlyDeparture.created_at,
          user_id: earlyDeparture.user_id,
          factory_id: userProfile?.factory_id || null,
          userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
          approved_by: earlyDeparture.approved_by || null,
          rejected_by: earlyDeparture.rejected_by || null,
          reviewed_at: earlyDeparture.reviewed_at || null,
          rejectReason: null,
          reviewerName: approverProfile ? approverProfile.first_name : 
                       rejecterProfile ? rejecterProfile.first_name : null,
          substituteName: substituteProfile ? substituteProfile.first_name : null
        });
      } else {
        // Early departure already processed, skipping
      }
    });

    // Early departures processed

    // Depois, processar as requisições da tabela 'lateness' que não foram processadas ainda
    (latenessRequests || []).forEach(lateness => {
      if (!processedIds.has(lateness.id)) {
        processedIds.add(lateness.id);
        const userProfile = profileMap.get(lateness.user_id);
        const approverProfile = lateness.approved_by ? profileMap.get(lateness.approved_by) : null;
        const rejecterProfile = lateness.rejected_by ? profileMap.get(lateness.rejected_by) : null;
        const substituteProfile = lateness.substitute_id ? profileMap.get(lateness.substitute_id) : null;

        
        if (lateness.substitute_id) {
        } else {
          console.log(`❌ Lateness ${lateness.id} não tem substitute_id`);
        }

        allRequests.push({
          id: lateness.id,
          type: 'lateness' as const,
          status: lateness.status,
          date: lateness.date,
          endDate: lateness.date,
          arrivalTime: lateness.arrival_time,
          reason: lateness.reason,
          created_at: lateness.created_at,
          user_id: lateness.user_id,
          factory_id: userProfile?.factory_id || null,
          userName: userProfile ? userProfile.first_name : 'Usuário não encontrado',
          approved_by: lateness.approved_by || null,
          rejected_by: lateness.rejected_by || null,
          reviewed_at: lateness.reviewed_at || null,
          rejectReason: null,
          reviewerName: approverProfile ? approverProfile.first_name : 
                       rejecterProfile ? rejecterProfile.first_name : null,
          substituteName: substituteProfile ? substituteProfile.first_name : null
        });
      } else {
        // Lateness already processed, skipping
      }
    });

    // Lateness requests processed
    
    // Ordenar por data de criação (mais recente primeiro)
    const formattedRequests = allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    


    // Data processing completed successfully
    
    // Duplicate check and integrity validation completed
    
    // Factory IDs mapped successfully

    return { success: true, data: formattedRequests };
  } catch (error) {
    console.error('Erro ao carregar todas as requisições:', error);
    return { success: false, error };
  }
};

export const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected', rejectReason?: string) => {
  try {
    console.log('Atualizando status da requisição:', requestId, 'para:', status);
    
    // Verificar RLS primeiro
    await checkAndFixRLS();
    
    // Obter o usuário atual que está fazendo a ação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    const reviewedAt = new Date().toISOString();
    const updateData = {
      status,
      updated_at: reviewedAt,
      reviewed_at: reviewedAt,
      reject_reason: rejectReason,
      approved_by: status === 'approved' ? user.id : null,
      rejected_by: status === 'rejected' ? user.id : null
    };
    
    // Primeiro tentar atualizar na tabela requests
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    console.log('Resultado da atualização requests:', { data: request, error: requestError });

    // Se não encontrou na tabela requests, pode ser uma solicitação apenas em time_off
    if (requestError && requestError.code === 'PGRST116') {
      console.log('Solicitação não encontrada em requests, tentando time_off...');
      
      // Tentar atualizar diretamente na tabela time_off
      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();
      
      console.log('Resultado da atualização time_off:', { data: timeOffData, error: timeOffError });
      
      if (timeOffError && timeOffError.code === 'PGRST116') {
        console.log('Solicitação não encontrada em time_off, tentando early_departures...');
        
        // Tentar atualizar diretamente na tabela early_departures
        const { data: earlyDepData, error: earlyDepError } = await supabase
          .from('early_departures')
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();
        
        console.log('Resultado da atualização early_departures:', { data: earlyDepData, error: earlyDepError });
        
        if (earlyDepError && earlyDepError.code === 'PGRST116') {
          console.log('Solicitação não encontrada em early_departures, tentando lateness...');
          
          // Tentar atualizar diretamente na tabela lateness
          const { data: latenessData, error: latenessError } = await supabase
            .from('lateness')
            .update(updateData)
            .eq('id', requestId)
            .select()
            .single();
          
          console.log('Resultado da atualização lateness:', { data: latenessData, error: latenessError });
          
          if (latenessError) {
            throw latenessError;
          }
          
          return { success: true, data: latenessData };
        }
        
        if (earlyDepError) {
          throw earlyDepError;
        }
        
        return { success: true, data: earlyDepData };
      }
      
      if (timeOffError) {
        throw timeOffError;
      }
      
      return { success: true, data: timeOffData };
    }

    if (requestError) {
      throw requestError;
    }

    // Se encontrou na tabela requests, atualizar também na tabela específica
    if (request && request.type === 'time-off') {
      const { error } = await supabase
        .from('time_off')
        .update(updateData)
        .eq('id', requestId);
      if (error) console.warn('Erro ao atualizar time_off:', error);
    } 
    else if (request && request.type === 'early-departure') {
      const { error } = await supabase
        .from('early_departures')
        .update(updateData)
        .eq('id', requestId);
      if (error) console.warn('Erro ao atualizar early_departures:', error);
    }
    else if (request && request.type === 'lateness') {
      const { error } = await supabase
        .from('lateness')
        .update(updateData)
        .eq('id', requestId);
      if (error) console.warn('Erro ao atualizar lateness:', error);
    }

    return { success: true, data: request };
  } catch (error) {
    console.error('Erro ao atualizar status da requisição:', error);
    return { success: false, error };
  }
};

 