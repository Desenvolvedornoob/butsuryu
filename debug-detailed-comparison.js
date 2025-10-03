// Script de debug detalhado para comparar dados entre Dashboard e My Data
// Execute este script no console do navegador

console.log('🔍 DEBUG DETALHADO - COMPARANDO DADOS...');

async function debugDetailedComparison() {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user.id);
    
    // 1. Debug loadRequests (Dashboard)
    console.log('\n📊 DASHBOARD - loadRequests:');
    const dashboardResult = await loadRequests(user.id);
    
    if (dashboardResult.success) {
      const dashboardData = dashboardResult.data;
      console.log('📄 Total de requests carregados:', dashboardData.length);
      
      // Mostrar cada request com detalhes
      dashboardData.forEach((req, index) => {
        console.log(`📋 Request ${index + 1}:`, {
          id: req.id,
          type: req.type,
          status: req.status,
          date: req.date,
          endDate: req.endDate,
          reason: req.reason,
          userName: req.userName
        });
      });
      
      // Contar por tipo e status
      const dashboardStats = {
        total: dashboardData.length,
        approved: dashboardData.filter(req => req.status === 'approved').length,
        pending: dashboardData.filter(req => req.status === 'pending').length,
        byType: {
          'time-off': dashboardData.filter(req => req.type === 'time-off').length,
          'early-departure': dashboardData.filter(req => req.type === 'early-departure').length,
          'lateness': dashboardData.filter(req => req.type === 'lateness').length,
          'absence': dashboardData.filter(req => req.type === 'absence').length
        }
      };
      
      console.log('📊 Estatísticas Dashboard:', dashboardStats);
    }
    
    // 2. Debug fetchUserData (My Data)
    console.log('\n📊 MY DATA - fetchUserData:');
    const myDataResult = await fetchUserData(user.id);
    
    console.log('📄 Total de requests carregados My Data:', myDataResult.length);
    
    // Mostrar cada request com detalhes
    myDataResult.forEach((req, index) => {
      console.log(`📋 Request ${index + 1}:`, {
        id: req.id,
        type: req.type,
        status: req.status,
        date: req.date,
        endDate: req.endDate,
        reason: req.reason,
        userName: req.userName
      });
    });
    
    // Contar por tipo e status
    const myDataStats = {
      total: myDataResult.length,
      approved: myDataResult.filter(req => req.status === 'approved').length,
      pending: myDataResult.filter(req => req.status === 'pending').length,
      byType: {
        'time-off': myDataResult.filter(req => req.type === 'time-off').length,
        'early-departure': myDataResult.filter(req => req.type === 'early-departure').length,
        'lateness': myDataResult.filter(req => req.type === 'lateness').length,
        'absence': myDataResult.filter(req => req.type === 'absence').length
      }
    };
    
    console.log('📊 Estatísticas My Data:', myDataStats);
    
    // 3. Comparar IDs dos requests
    console.log('\n🔍 COMPARAÇÃO DE IDs:');
    if (dashboardResult.success) {
      const dashboardIds = dashboardResult.data.map(req => req.id).sort();
      const myDataIds = myDataResult.map(req => req.id).sort();
      
      console.log('📋 IDs Dashboard:', dashboardIds);
      console.log('📋 IDs My Data:', myDataIds);
      
      const missingInMyData = dashboardIds.filter(id => !myDataIds.includes(id));
      const missingInDashboard = myDataIds.filter(id => !dashboardIds.includes(id));
      
      if (missingInMyData.length > 0) {
        console.log('❌ IDs presentes na Dashboard mas ausentes na My Data:', missingInMyData);
      }
      if (missingInDashboard.length > 0) {
        console.log('❌ IDs presentes na My Data mas ausentes na Dashboard:', missingInDashboard);
      }
      
      if (missingInMyData.length === 0 && missingInDashboard.length === 0) {
        console.log('✅ Todos os IDs são consistentes entre as páginas');
      }
    }
    
    // 4. Testar generateChartDataByType
    console.log('\n📊 TESTANDO generateChartDataByType:');
    if (myDataResult.length > 0) {
      const chartData = generateChartDataByType(myDataResult);
      console.log('📊 Dados do gráfico My Data:', chartData);
      
      // Mostrar contagem manual
      const manualCount = {
        'time-off': myDataResult.filter(req => req.type === 'time-off').length,
        'early-departure': myDataResult.filter(req => req.type === 'early-departure').length,
        'lateness': myDataResult.filter(req => req.type === 'lateness').length,
        'absence': myDataResult.filter(req => req.type === 'absence').length
      };
      console.log('📊 Contagem manual:', manualCount);
    }
    
    // 5. Verificar se há requests duplicados
    console.log('\n🔍 VERIFICANDO DUPLICATAS:');
    if (myDataResult.length > 0) {
      const ids = myDataResult.map(req => req.id);
      const uniqueIds = [...new Set(ids)];
      
      if (ids.length !== uniqueIds.length) {
        console.log('❌ Requests duplicados encontrados!');
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.log('📋 IDs duplicados:', [...new Set(duplicates)]);
      } else {
        console.log('✅ Nenhuma duplicata encontrada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar debug
debugDetailedComparison();
