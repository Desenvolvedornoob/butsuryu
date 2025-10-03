// Script de teste para verificar as funções da dashboard
// Execute este script no console do navegador na página da dashboard

console.log('🔍 Testando funções da dashboard...');

// Função para testar loadRequests
async function testLoadRequests() {
  try {
    console.log('📋 Testando loadRequests...');
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário ID:', user.id);
    
    // Testar loadRequests
    const result = await loadRequests(user.id);
    console.log('📊 Resultado loadRequests:', result);
    
    if (result.success) {
      console.log('✅ loadRequests funcionando! Total de requests:', result.data.length);
      
      // Mostrar estatísticas por tipo
      const stats = result.data.reduce((acc, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Estatísticas por tipo:', stats);
    } else {
      console.error('❌ Erro em loadRequests:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar loadRequests:', error);
  }
}

// Função para testar loadAllRequests
async function testLoadAllRequests() {
  try {
    console.log('📋 Testando loadAllRequests...');
    
    const result = await loadAllRequests();
    console.log('📊 Resultado loadAllRequests:', result);
    
    if (result.success) {
      console.log('✅ loadAllRequests funcionando! Total de requests:', result.data.length);
      
      // Mostrar estatísticas por tipo
      const stats = result.data.reduce((acc, req) => {
        acc[req.type] = (acc[req.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Estatísticas por tipo:', stats);
    } else {
      console.error('❌ Erro em loadAllRequests:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar loadAllRequests:', error);
  }
}

// Função para testar consultas diretas ao banco
async function testDirectQueries() {
  try {
    console.log('📋 Testando consultas diretas...');
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário ID:', user.id);
    
    // Testar cada tabela individualmente
    const tables = ['requests', 'time_off', 'early_departures', 'lateness'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`❌ Erro ao consultar ${table}:`, error);
        } else {
          console.log(`✅ ${table}: ${data.length} registros encontrados`);
          if (data.length > 0) {
            console.log(`📄 Primeiro registro de ${table}:`, data[0]);
          }
        }
      } catch (err) {
        console.error(`❌ Erro ao consultar ${table}:`, err);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar consultas diretas:', error);
  }
}

// Função para testar políticas RLS
async function testRLSPolicies() {
  try {
    console.log('📋 Testando políticas RLS...');
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário ID:', user.id);
    
    // Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('👤 Perfil do usuário:', profile);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar políticas RLS:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes da dashboard...');
  
  await testRLSPolicies();
  await testDirectQueries();
  await testLoadRequests();
  await testLoadAllRequests();
  
  console.log('✅ Testes concluídos!');
}

// Executar testes
runAllTests();
