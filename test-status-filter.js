// Script para testar o filtro de status
// Execute este script no console do navegador na página da dashboard

console.log('🔍 TESTE FILTRO DE STATUS - Verificando se o filtro está funcionando...');

// Função para simular mudança de filtro
function testStatusFilter() {
  console.log('🔄 Testando mudança de filtro de status...');
  
  // Verificar se os elementos do filtro existem
  const statusSelect = document.querySelector('select[value="approved"], [role="combobox"]');
  console.log('📋 Elemento de seleção de status encontrado:', statusSelect);
  
  // Verificar se há opções disponíveis
  const options = document.querySelectorAll('[role="option"]');
  console.log('📋 Opções encontradas:', options.length);
  options.forEach((option, index) => {
    console.log(`  ${index + 1}. ${option.textContent}`);
  });
  
  // Verificar se há logs de recarregamento
  console.log('📊 Verificando se há logs de recarregamento no console...');
  
  // Verificar se as estatísticas estão sendo atualizadas
  const statsCards = document.querySelectorAll('[class*="glass-panel"] h3');
  console.log('📈 Cards de estatísticas encontrados:', statsCards.length);
  statsCards.forEach((card, index) => {
    console.log(`📊 Card ${index + 1}: ${card.textContent}`);
  });
}

// Função para verificar dados atuais
async function checkCurrentData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user);
    
    const requestsResult = await loadRequests(user.id);
    
    if (requestsResult.success) {
      const data = requestsResult.data;
      console.log('📄 Dados carregados:', data.length);
      
      // Mostrar todos os status
      const statuses = [...new Set(data.map(req => req.status))];
      console.log('📊 Status disponíveis:', statuses);
      
      // Mostrar contagem por status
      const statusCount = {};
      data.forEach(req => {
        statusCount[req.status] = (statusCount[req.status] || 0) + 1;
      });
      console.log('📊 Contagem por status:', statusCount);
      
      // Mostrar dados de setembro de 2025
      const september2025 = data.filter(req => {
        const reqDate = new Date(req.date);
        return reqDate.getFullYear() === 2025 && reqDate.getMonth() === 8; // Setembro = 8 (0-indexed)
      });
      
      console.log('📅 Requests de setembro de 2025:', september2025.length);
      september2025.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.type} - ${req.status} - ${req.date}`);
      });
      
    } else {
      console.error('❌ Erro ao carregar dados:', requestsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

// Executar testes
testStatusFilter();
checkCurrentData();
