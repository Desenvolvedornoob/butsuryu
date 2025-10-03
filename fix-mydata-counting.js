// Script para corrigir a contagem na página My Data
// Execute este script no console do navegador na página My Data

console.log('🔧 CORRIGINDO CONTAGEM NA PÁGINA MY DATA...');

// Função para contar requests em vez de dias
function countRequestsByType(data) {
  const typeCount = {
    'time-off': 0,
    'early-departure': 0,
    'lateness': 0,
    'absence': 0
  };

  data.forEach(item => {
    typeCount[item.type] += 1; // Contar requests, não dias
  });

  return typeCount;
}

// Função para gerar dados dos gráficos por tipo (versão corrigida)
function generateChartDataByTypeFixed(data) {
  const typeCount = countRequestsByType(data);

  const result = [
    { name: 'Folgas', value: typeCount['time-off'], fill: '#3B82F6' },
    { name: 'Saídas Antecipadas', value: typeCount['early-departure'], fill: '#8B5CF6' },
    { name: 'Atrasos', value: typeCount['lateness'], fill: '#EAB308' },
    { name: 'Faltas', value: typeCount['absence'], fill: '#EF4444' }
  ];

  // Se não há dados, retornar array vazio para evitar gráfico com valores zero
  const hasData = result.some(item => item.value > 0);
  return hasData ? result : [];
}

// Função para gerar dados mensais (versão corrigida)
function generateMonthlyDataFixed(data, selectedYear, selectedMonth) {
  const monthlyData = {};

  // Se um mês específico foi selecionado, garantir que ele seja incluído mesmo sem dados
  if (selectedYear && selectedMonth) {
    const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', { month: 'short' });
    
    monthlyData[monthKey] = {
      month: monthName,
      timeOff: 0,
      earlyDeparture: 0,
      lateness: 0,
      absence: 0
    };
  } else if (selectedYear) {
    // Se apenas o ano foi selecionado, incluir todos os meses do ano
    for (let month = 1; month <= 12; month++) {
      const monthKey = `${selectedYear}-${String(month).padStart(2, '0')}`;
      const monthName = new Date(selectedYear, month - 1).toLocaleDateString('pt-BR', { month: 'short' });
      
      monthlyData[monthKey] = {
        month: monthName,
        timeOff: 0,
        earlyDeparture: 0,
        lateness: 0,
        absence: 0
      };
    }
  }

  // Processar dados existentes
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        timeOff: 0,
        earlyDeparture: 0,
        lateness: 0,
        absence: 0
      };
    }

    // Contar requests, não dias
    switch (item.type) {
      case 'time-off':
        monthlyData[monthKey].timeOff += 1;
        break;
      case 'early-departure':
        monthlyData[monthKey].earlyDeparture += 1;
        break;
      case 'lateness':
        monthlyData[monthKey].lateness += 1;
        break;
      case 'absence':
        monthlyData[monthKey].absence += 1;
        break;
    }
  });

  // Ordenar por chave do mês (YYYY-MM) para garantir ordem cronológica
  const result = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  
  // Se não há dados e nenhum filtro específico foi aplicado, retornar array vazio
  if (data.length === 0 && !selectedYear && !selectedMonth) {
    return [];
  }
  
  return result;
}

console.log('✅ Funções corrigidas criadas!');
console.log('📝 Para aplicar a correção, substitua as funções no arquivo data-service.ts:');
console.log('1. generateChartDataByType -> generateChartDataByTypeFixed');
console.log('2. generateMonthlyData -> generateMonthlyDataFixed');
