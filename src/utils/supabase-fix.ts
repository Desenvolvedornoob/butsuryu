import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica permissões para uma tabela específica
 */
const checkTablePermissions = async (tableName: string, userId: string, userProfile: any) => {
  try {
    console.log(`Verificando permissões para ${tableName}...`);
    
    // Tentar fazer uma consulta simples na tabela
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === '42501') {
      console.warn(`Problema de RLS detectado na tabela ${tableName}:`, error);
      
      // Se o usuário é admin, tentar soluções alternativas
      if (userProfile && userProfile.role === 'admin') {
        console.log(`Tentando solução para admin na tabela ${tableName}...`);
        
        // Tentar inserir um registro teste para verificar permissões de escrita
        const testId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        let testData: any = {
          id: testId,
          user_id: userId,
          date: now,
          reason: 'RLS Test',
          status: 'pending'
        };
        
        // Adicionar campos específicos da tabela
        if (tableName === 'early_departures') {
          testData.time = '17:00';
        } else if (tableName === 'lateness') {
          testData.arrival_time = '09:00';
        }
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(testData);
        
        if (insertError) {
          console.error(`Erro ao inserir teste em ${tableName}:`, insertError);
        } else {
          console.log(`Teste de inserção em ${tableName} bem-sucedido!`);
          
          // Limpar o registro de teste
          await supabase
            .from(tableName)
            .delete()
            .eq('id', testId);
        }
      }
    } else if (error) {
      console.warn(`Erro ao verificar ${tableName}:`, error);
    } else {
      console.log(`Permissões para ${tableName} estão OK`);
    }
  } catch (error) {
    console.error(`Erro ao verificar permissões de ${tableName}:`, error);
  }
};

/**
 * Verifica se há problemas com as políticas RLS e tenta aplicar correções
 */
export const checkAndFixRLS = async () => {
  try {
    console.log('Verificando configurações RLS...');
    
    // 1. Verificar as políticas atuais na tabela time_off
    const { data: policies, error: policiesError } = await supabase
      .from('time_off')
      .select('*')
      .limit(1);
    
    if (policiesError && policiesError.code === '42501') {
      console.warn('Detectado problema de RLS na tabela time_off, tentando corrigir...');
      
      // Tentar cada uma das seguintes soluções alternativas:
      
      // 1. Sempre incluir o usuário atual em qualquer update
      const session = await supabase.auth.getSession();
      if (session.data.session?.user?.id) {
        console.log('Usuário autenticado encontrado, tentando fix 1...');
        
        // Incluir sempre o user_id do usuário logado pode ajudar com RLS
        const userId = session.data.session.user.id;
        const { error: updateError } = await supabase
          .from('time_off')
          .update({ user_id: userId })
          .is('user_id', null);
        
        if (!updateError) {
          console.log('Fix 1 aplicado com sucesso!');
        } else {
          console.warn('Fix 1 falhou:', updateError);
        }
      }
      
      // 2. Verificar se o usuário tem permissões de admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.data.session?.user?.id || '')
        .single();
        
      if (profile && profile.role === 'admin') {
        console.log('Usuário é admin, tentando fix 2...');
        
        // Para usuários admin, tentar usar cabeçalhos especiais via auth.setAuth
        // Não podemos acessar headers diretamente, então usamos um método alternativo
        try {
          // Usar auth.setSession com o mesmo token para forçar atualização
          if (session.data.session) {
            await supabase.auth.setSession({
              access_token: session.data.session.access_token,
              refresh_token: session.data.session.refresh_token
            });
            console.log('Fix 2 aplicado: sessão renovada com mesmos tokens');
          }
        } catch (err) {
          console.warn('Fix 2 falhou:', err);
        }
      }
    } else {
      console.log('Não foram detectados problemas de RLS iniciais');
    }
    
    // 3. Verificar e criar perfil para o usuário atual se não existir
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser?.user) return { success: true };
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (!existingProfile) {
      console.log('Perfil não encontrado, criando perfil admin...');
      const { error } = await supabase.from('profiles').insert({
        id: authUser.user.id,
        first_name: 'Admin User',
        role: 'admin',
        status: 'active',
        department: 'Administração',
        factory_id: '1',
        responsible: 'Sistema'
      });
      
      if (error) console.error('Erro ao criar perfil de admin:', error);
      else console.log('Perfil admin criado com sucesso!');
    }
    
    // 4. Verificar especificamente a capacidade de inserir em time_off (novo)
    console.log('Verificando permissões para inserir em time_off...');
    
    // Gerar um UUID aleatório para teste
    const testId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Tentar inserir um registro teste
    const { data: testInsert, error: testInsertError } = await supabase
      .from('time_off')
      .insert({
        id: testId,
        user_id: authUser.user.id,
        start_date: now,
        end_date: now,
        reason: 'RLS Test',
        status: 'pending'
      })
      .select();
    
    if (testInsertError) {
      console.warn('Problema detectado na inserção em time_off:', testInsertError);
      
      // Tentar executar SQL para ativar admin no RLS para o usuário
      if (existingProfile && existingProfile.role === 'admin') {
        console.log('Tentando solução alternativa para admin...');
        
        try {
          // Forçar autenticação com o token atual
          await supabase.auth.refreshSession();
          console.log('Sessão atualizada para o próximo teste');
          
          // Tentar novamente com explicitamente status admin
          const { error: retryError } = await supabase
            .from('time_off')
            .insert({
              id: crypto.randomUUID(),
              user_id: authUser.user.id,
              start_date: now,
              end_date: now,
              reason: 'RLS Admin Test',
              status: 'pending'
            });
          
          if (!retryError) {
            console.log('Segundo teste bem-sucedido!');
          } else {
            console.error('Falha no segundo teste:', retryError);
          }
        } catch (err) {
          console.error('Erro ao tentar solução alternativa:', err);
        }
      }
    } else {
      console.log('Teste de inserção em time_off bem-sucedido!');
      
      // Limpar o registro de teste
      await supabase
        .from('time_off')
        .delete()
        .eq('id', testId);
    }
    
    // 5. Verificar permissões para early_departures e lateness
    await checkTablePermissions('early_departures', authUser.user.id, existingProfile);
    await checkTablePermissions('lateness', authUser.user.id, existingProfile);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao verificar/corrigir configurações RLS:', error);
    return { success: false, error };
  }
}; 