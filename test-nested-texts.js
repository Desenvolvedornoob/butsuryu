// Teste para verificar se os textos aninhados estão sendo processados corretamente
console.log('🔍 Testando processamento de textos aninhados...');

// Simular a função processNestedObject
const processNestedObject = (obj, prefix = '', category = '') => {
  const items = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Se é um objeto, processar recursivamente
      items.push(...processNestedObject(value, fullKey, category));
    } else {
      // Se é um valor primitivo, adicionar como item
      items.push({
        key: fullKey,
        value: String(value),
        category: category || prefix.split('.')[0] || 'unknown'
      });
    }
  });
  
  return items;
};

// Simular os textos do dashboard
const dashboardTexts = {
  title: "Dashboard",
  welcome: "Bem-vindo",
  subtitle: "Acompanhe suas folgas, saídas antecipadas, atrasos e faltas",
  cards: {
    approval: {
      title: "Aprovação de Solicitações",
      description: "Aprove ou rejeite solicitações de folga",
      button: "Gerenciar Aprovações"
    },
    employees: {
      title: "Gestão de Funcionários",
      description: "Gerencie funcionários e suas informações",
      button: "Gerenciar Funcionários"
    },
    factories: {
      title: "Fábricas",
      description: "Gerencie as fábricas e suas configurações",
      button: "Gerenciar Fábricas"
    }
  }
};

console.log('📋 Textos originais:');
console.log(JSON.stringify(dashboardTexts, null, 2));

console.log('\n🔄 Processando textos aninhados...');
const processedItems = processNestedObject(dashboardTexts, '', 'dashboard');

console.log('\n✅ Textos processados:');
processedItems.forEach(item => {
  console.log(`- ${item.key}: "${item.value}" (categoria: ${item.category})`);
});

console.log(`\n📊 Total de itens processados: ${processedItems.length}`);

// Verificar se os cards estão sendo processados
const cardItems = processedItems.filter(item => item.key.includes('cards.'));
console.log(`\n🎴 Itens dos cards: ${cardItems.length}`);
cardItems.forEach(item => {
  console.log(`  - ${item.key}: "${item.value}"`);
});
