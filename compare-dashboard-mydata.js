// Script para comparar dados entre Dashboard e My Data
// Execute este script no console do navegador

console.log('🔍 COMPARANDO DASHBOARD vs MY DATA...');

async function compareData() {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user);
    
    // 1. Testar loadRequests (usado na Dashboard)
    console.log('\n📊 DASHBOARD - loadRequests:');
    const dashboardResult = await loadRequests(user.id);
    
    if (dashboardResult.success) {
      const dashboardData = dashboardResult.data;
      console.log('📄 Total de requests:', dashboardData.length);
      
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
      
      // Mostrar detalhes dos requests
      dashboardData.forEach((req, index) => {
        console.log(`📋 Request ${index + 1}:`, {
          id: req.id,
          type: req.type,
          status: req.status,
          date: req.date,
          endDate: req.endDate
        });
      });
    }
    
    // 2. Testar fetchUserData (usado na My Data)
    console.log('\n📊 MY DATA - fetchUserData:');
    const myDataResult = await fetchUserData(user.id);
    
    console.log('📄 Total de requests My Data:', myDataResult.length);
    
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
    
    // Mostrar detalhes dos requests
    myDataResult.forEach((req, index) => {
      console.log(`📋 Request ${index + 1}:`, {
        id: req.id,
        type: req.type,
        status: req.status,
        date: req.date,
        endDate: req.endDate
      });
    });
    
    // 3. Comparar os resultados
    console.log('\n🔍 COMPARAÇÃO:');
    console.log('📊 Total requests - Dashboard:', dashboardResult.success ? dashboardResult.data.length : 0);
    console.log('📊 Total requests - My Data:', myDataResult.length);
    
    if (dashboardResult.success) {
      const dashboardApproved = dashboardResult.data.filter(req => req.status === 'approved');
      const myDataApproved = myDataResult.filter(req => req.status === 'approved');
      
      console.log('✅ Requests aprovados - Dashboard:', dashboardApproved.length);
      console.log('✅ Requests aprovados - My Data:', myDataApproved.length);
      
      // Comparar por tipo
      ['time-off', 'early-departure', 'lateness', 'absence'].forEach(type => {
        const dashboardCount = dashboardApproved.filter(req => req.type === type).length;
        const myDataCount = myDataApproved.filter(req => req.type === type).length;
        console.log(`📊 ${type} - Dashboard: ${dashboardCount}, My Data: ${myDataCount}`);
      });
    }
    
    // 4. Testar calculateDurationInDays
    console.log('\n📅 TESTANDO calculateDurationInDays:');
    if (myDataResult.length > 0) {
      myDataResult.forEach((req, index) => {
        const days = calculateDurationInDays(req);
        console.log(`📅 Request ${index + 1} (${req.type}): ${days} dias`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao comparar dados:', error);
  }
}

// Executar comparação
compareData();
