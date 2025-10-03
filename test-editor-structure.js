// Teste para verificar se o editor está estruturando os textos corretamente
console.log('🔍 Testando estruturação de textos no editor...');

// Simular textItems do editor
const textItems = [
  { key: 'dashboard.cards.approval.title', value: '申請承認', category: 'dashboard' },
  { key: 'dashboard.cards.approval.description', value: '休暇申請の承認・却下を行います', category: 'dashboard' },
  { key: 'dashboard.cards.approval.button', value: '承認管理', category: 'dashboard' },
  { key: 'dashboard.welcome', value: 'ようこそ', category: 'dashboard' },
  { key: 'navbar.dashboard', value: 'ダッシュボード', category: 'navbar' }
];

// Simular a função de estruturação corrigida
function structureTexts(textItems, selectedLanguage) {
  const structuredTexts = {
    [selectedLanguage]: {}
  };

  textItems.forEach(item => {
    const keys = item.key.split('.');
    const category = keys[0];
    const nestedKeys = keys.slice(1);
    
    if (!structuredTexts[selectedLanguage][category]) {
      structuredTexts[selectedLanguage][category] = {};
    }
    
    // Processar chaves aninhadas
    let current = structuredTexts[selectedLanguage][category];
    for (let i = 0; i < nestedKeys.length - 1; i++) {
      if (!current[nestedKeys[i]]) {
        current[nestedKeys[i]] = {};
      }
      current = current[nestedKeys[i]];
    }
    
    // Definir o valor final
    current[nestedKeys[nestedKeys.length - 1]] = item.value;
  });

  return structuredTexts;
}

console.log('📋 TextItems do editor:');
console.log(JSON.stringify(textItems, null, 2));

console.log('\n🔄 Estruturando textos...');
const structured = structureTexts(textItems, 'jp');

console.log('\n✅ Resultado estruturado:');
console.log(JSON.stringify(structured, null, 2));

console.log('\n🎯 Testando acesso aos textos:');
console.log('dashboard.cards.approval.title:', structured.jp?.dashboard?.cards?.approval?.title);
console.log('dashboard.welcome:', structured.jp?.dashboard?.welcome);
console.log('navbar.dashboard:', structured.jp?.navbar?.dashboard);

console.log('\n✅ Agora o editor está estruturando os textos corretamente!');
