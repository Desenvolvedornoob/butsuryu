// Script de debug específico para a dashboard
// Execute este script no console do navegador na página da dashboard

console.log('🔍 DEBUG DASHBOARD - Investigando problema de dados...');

// Função para verificar o estado dos dados na dashboard
function debugDashboardState() {
  console.log('📊 Estado atual da dashboard:');
  
  // Verificar se o React está renderizando os componentes
  const statsCards = document.querySelectorAll('[class*="glass-panel"]');
  console.log('📈 Cards de estatísticas encontrados:', statsCards.length);
  
  const distributionCards = document.querySelectorAll('[class*="bg-green-50"], [class*="bg-amber-50"], [class*="bg-purple-50"], [class*="bg-red-50"]');
  console.log('📊 Cards de distribuição encontrados:', distributionCards.length);
  
  const recentRequests = document.querySelectorAll('[class*="space-y-4"] > div');
  console.log('📋 Cards de pedidos recentes encontrados:', recentRequests.length);
  
  // Verificar se há dados nos elementos
  statsCards.forEach((card, index) => {
    const value = card.querySelector('h3');
    const label = card.querySelector('p');
    console.log(`📈 Card ${index + 1}:`, {
      label: label?.textContent,
      value: value?.textContent
    });
  });
  
  distributionCards.forEach((card, index) => {
    const value = card.querySelector('span[class*="text-3xl"]');
    const label = card.querySelector('span[class*="text-sm"]');
    console.log(`📊 Distribuição ${index + 1}:`, {
      label: label?.textContent,
      value: value?.textContent
    });
  });
}

// Função para verificar dados do React
function debugReactState() {
  console.log('⚛️ Verificando estado do React...');
  
  // Tentar acessar o estado do React (se possível)
  const reactRoot = document.querySelector('#root');
  if (reactRoot && reactRoot._reactInternalFiber) {
    console.log('⚛️ React root encontrado');
  } else {
    console.log('⚛️ React root não encontrado ou não acessível');
  }
}

// Função para verificar se há erros no console
function checkConsoleErrors() {
  console.log('❌ Verificando erros no console...');
  
  // Interceptar erros
  const originalError = console.error;
  console.error = function(...args) {
    console.log('🚨 ERRO INTERCEPTADO:', ...args);
    originalError.apply(console, args);
  };
}

// Função para testar as funções de carregamento
async function testLoadingFunctions() {
  console.log('🔄 Testando funções de carregamento...');
  
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 Usuário:', user);
    
    // Testar loadRequests
    console.log('📋 Testando loadRequests...');
    const requestsResult = await loadRequests(user.id);
    console.log('📊 Resultado loadRequests:', requestsResult);
    
    if (requestsResult.success) {
      console.log('✅ loadRequests OK - Total:', requestsResult.data.length);
      
      // Analisar os dados
      const data = requestsResult.data;
      console.log('📄 Dados carregados:', data);
      
      // Verificar tipos
      const types = data.map(req => req.type);
      console.log('🏷️ Tipos encontrados:', [...new Set(types)]);
      
      // Verificar status
      const statuses = data.map(req => req.status);
      console.log('📊 Status encontrados:', [...new Set(statuses)]);
      
      // Verificar datas
      const dates = data.map(req => req.date);
      console.log('📅 Datas encontradas:', dates);
      
      // Verificar se há dados aprovados
      const approved = data.filter(req => req.status === 'approved');
      console.log('✅ Solicitações aprovadas:', approved.length);
      
      // Verificar filtros por tipo
      const timeOff = data.filter(req => req.type === 'time-off');
      const earlyDeparture = data.filter(req => req.type === 'early-departure');
      const lateness = data.filter(req => req.type === 'lateness');
      const absence = data.filter(req => req.type === 'absence');
      
      console.log('📊 Estatísticas por tipo:');
      console.log('  - Time-off:', timeOff.length);
      console.log('  - Early-departure:', earlyDeparture.length);
      console.log('  - Lateness:', lateness.length);
      console.log('  - Absence:', absence.length);
      
      // Verificar filtros por data (mês atual)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonth = data.filter(req => {
        const reqDate = new Date(req.date);
        return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear;
      });
      
      console.log('📅 Solicitações deste mês:', thisMonth.length);
      
      // Verificar se há dados aprovados deste mês
      const approvedThisMonth = thisMonth.filter(req => req.status === 'approved');
      console.log('✅ Aprovadas deste mês:', approvedThisMonth.length);
      
    } else {
      console.error('❌ Erro em loadRequests:', requestsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar funções:', error);
  }
}

// Função para verificar se o problema está na renderização
function checkRendering() {
  console.log('🎨 Verificando renderização...');
  
  // Verificar se os elementos estão sendo renderizados
  const elements = {
    stats: document.querySelectorAll('[class*="glass-panel"]'),
    distribution: document.querySelectorAll('[class*="bg-green-50"], [class*="bg-amber-50"], [class*="bg-purple-50"], [class*="bg-red-50"]'),
    recentRequests: document.querySelectorAll('[class*="space-y-4"] > div'),
    loading: document.querySelectorAll('[class*="text-muted-foreground"]')
  };
  
  console.log('🎨 Elementos encontrados:', elements);
  
  // Verificar se há mensagens de carregamento
  const loadingMessages = document.querySelectorAll('p[class*="text-muted-foreground"]');
  loadingMessages.forEach((msg, index) => {
    console.log(`⏳ Mensagem de carregamento ${index + 1}:`, msg.textContent);
  });
  
  // Verificar se há mensagens de "nenhum dado"
  const noDataMessages = document.querySelectorAll('p[class*="text-muted-foreground"]');
  noDataMessages.forEach((msg, index) => {
    if (msg.textContent.includes('Nenhuma') || msg.textContent.includes('nenhuma')) {
      console.log(`📭 Mensagem de "nenhum dado" ${index + 1}:`, msg.textContent);
    }
  });
}

// Função principal de debug
async function runDashboardDebug() {
  console.log('🚀 Iniciando debug da dashboard...');
  
  debugDashboardState();
  debugReactState();
  checkConsoleErrors();
  await testLoadingFunctions();
  checkRendering();
  
  console.log('✅ Debug concluído!');
}

// Executar debug
runDashboardDebug();
