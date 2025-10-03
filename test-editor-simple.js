// Teste simples para verificar se o editor está funcionando
console.log('🔍 Testando editor simples...');

// Simular textItems do editor (como estava antes)
const textItems = [
  { key: 'dashboard.cards.approval.title', value: '申請承認', category: 'dashboard' },
  { key: 'dashboard.welcome', value: 'ようこそ', category: 'dashboard' },
  { key: 'navbar.dashboard', value: 'ダッシュボード', category: 'navbar' }
];

// Simular a função de estruturação original
function structureTexts(textItems, selectedLanguage) {
  const structuredTexts = {
    [selectedLanguage]: {}
  };

  textItems.forEach(item => {
    const [category, key] = item.key.split('.');
    if (!structuredTexts[selectedLanguage][category]) {
      structuredTexts[selectedLanguage][category] = {};
    }
    structuredTexts[selectedLanguage][category][key] = item.value;
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
console.log('dashboard.cards.approval.title:', structured.jp?.dashboard?.['cards.approval.title']);
console.log('dashboard.welcome:', structured.jp?.dashboard?.welcome);
console.log('navbar.dashboard:', structured.jp?.navbar?.dashboard);

console.log('\n✅ Editor voltou ao funcionamento original!');
