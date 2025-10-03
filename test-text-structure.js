// Teste para verificar a estrutura dos textos
console.log('🔍 Testando estrutura dos textos...');

// Simular a estrutura que deveria ser enviada para o banco
const structuredTexts = {
  'jp': {
    'dashboard': {
      'cards': {
        'approval': {
          'title': '申請承認',
          'description': '休暇申請の承認・却下を行います',
          'button': '承認管理'
        }
      }
    }
  }
};

console.log('📋 Estrutura dos textos:');
console.log(JSON.stringify(structuredTexts, null, 2));

// Simular como o serviço processa os textos
const textsToUpdate = [];

Object.entries(structuredTexts).forEach(([language, categories]) => {
  Object.entries(categories).forEach(([category, keys]) => {
    Object.entries(keys).forEach(([key, value]) => {
      textsToUpdate.push({
        language,
        category,
        text_key: key,
        text_value: value
      });
    });
  });
});

console.log('\n🔄 Textos processados para o banco:');
textsToUpdate.forEach(item => {
  console.log(`- ${item.language}.${item.category}.${item.text_key}: "${item.text_value}"`);
});

console.log(`\n📊 Total de itens: ${textsToUpdate.length}`);

// Verificar se os cards estão sendo processados corretamente
const cardItems = textsToUpdate.filter(item => item.text_key.includes('cards.'));
console.log(`\n🎴 Itens dos cards: ${cardItems.length}`);
cardItems.forEach(item => {
  console.log(`  - ${item.text_key}: "${item.text_value}"`);
});
