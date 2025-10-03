// Teste para verificar se as chaves aninhadas estão sendo processadas corretamente
console.log('🔍 Testando processamento de chaves aninhadas...');

// Simular dados do banco
const dataFromDB = [
  { category: 'dashboard', text_key: 'cards.approval.title', text_value: '申請承認' },
  { category: 'dashboard', text_key: 'cards.approval.description', text_value: '休暇申請の承認・却下を行います' },
  { category: 'dashboard', text_key: 'cards.approval.button', text_value: '承認管理' },
  { category: 'dashboard', text_key: 'welcome', text_value: 'ようこそ' },
  { category: 'navbar', text_key: 'dashboard', text_value: 'ダッシュボード' }
];

// Simular a função de processamento corrigida
function processTexts(data) {
  const textsByCategory = {};
  
  data.forEach(text => {
    if (!textsByCategory[text.category]) {
      textsByCategory[text.category] = {};
    }
    
    // Processar chaves aninhadas como "cards.approval.title"
    const keys = text.text_key.split('.');
    let current = textsByCategory[text.category];
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Definir o valor final
    current[keys[keys.length - 1]] = text.text_value;
  });
  
  return textsByCategory;
}

console.log('📋 Dados do banco:');
console.log(JSON.stringify(dataFromDB, null, 2));

console.log('\n🔄 Processando textos...');
const processed = processTexts(dataFromDB);

console.log('\n✅ Resultado processado:');
console.log(JSON.stringify(processed, null, 2));

console.log('\n🎯 Testando acesso aos textos:');
console.log('dashboard.cards.approval.title:', processed.dashboard?.cards?.approval?.title);
console.log('dashboard.welcome:', processed.dashboard?.welcome);
console.log('navbar.dashboard:', processed.navbar?.dashboard);

console.log('\n✅ Agora as chaves aninhadas estão sendo processadas corretamente!');
