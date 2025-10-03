// Script para debugar problemas de datas na dashboard
// Execute este script no console do navegador na página da dashboard

console.log('📅 DEBUG DATAS - Investigando problema de filtros de data...');

// Função para testar as datas dos dados
async function testDates() {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user);
    
    // Testar loadRequests
    const requestsResult = await loadRequests(user.id);
    
    if (requestsResult.success) {
      const data = requestsResult.data;
      console.log('📄 Dados carregados:', data.length);
      
      // Analisar as datas
      console.log('📅 Análise de datas:');
      data.forEach((req, index) => {
        const reqDate = new Date(req.date);
        console.log(`📅 Request ${index + 1}:`, {
          id: req.id,
          type: req.type,
          status: req.status,
          date: req.date,
          year: reqDate.getFullYear(),
          month: reqDate.getMonth() + 1,
          day: reqDate.getDate(),
          formatted: reqDate.toLocaleDateString('pt-BR')
        });
      });
      
      // Verificar ano atual
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      console.log('📅 Data atual:', {
        year: currentYear,
        month: currentMonth,
        date: new Date().toLocaleDateString('pt-BR')
      });
      
      // Verificar quantos requests são do ano atual
      const currentYearRequests = data.filter(req => {
        const reqDate = new Date(req.date);
        return reqDate.getFullYear() === currentYear;
      });
      
      console.log('📊 Requests do ano atual:', currentYearRequests.length);
      
      // Verificar quantos requests são do mês atual
      const currentMonthRequests = data.filter(req => {
        const reqDate = new Date(req.date);
        return reqDate.getFullYear() === currentYear && reqDate.getMonth() === currentMonth - 1;
      });
      
      console.log('📊 Requests do mês atual:', currentMonthRequests.length);
      
      // Verificar requests aprovados do mês atual
      const approvedCurrentMonth = currentMonthRequests.filter(req => req.status === 'approved');
      console.log('✅ Requests aprovados do mês atual:', approvedCurrentMonth.length);
      
      // Mostrar estatísticas por tipo do mês atual
      const stats = {
        folgas_utilizadas: approvedCurrentMonth.filter(req => req.type === 'time-off').length,
        saidas_antecipadas: approvedCurrentMonth.filter(req => req.type === 'early-departure').length,
        atrasos: approvedCurrentMonth.filter(req => req.type === 'lateness').length,
        faltas: approvedCurrentMonth.filter(req => req.type === 'absence').length
      };
      
      console.log('📊 Estatísticas do mês atual:', stats);
      
    } else {
      console.error('❌ Erro ao carregar dados:', requestsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar datas:', error);
  }
}

// Executar teste
testDates();
