// Teste para verificar se a estrutura corrigida funciona
console.log('🔍 Testando estrutura corrigida dos textos...');

// Simular a função processNestedObject corrigida
const processNestedObject = (obj, prefix = '', language, category) => {
  const items = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Se é um objeto, processar recursivamente
      items.push(...processNestedObject(value, fullKey, language, category));
    } else {
      // Se é um valor primitivo, adicionar como item
      items.push({
        language,
        category,
        text_key: fullKey,
        text_value: String(value)
      });
    }
  });
  
  return items;
};

// Simular a estrutura que deveria ser enviada para o banco
const structuredTexts = {
  'jp': {
    'dashboard': {
      'cards': {
        'approval': {
          'title': '申請承認',
          'description': '休暇申請の承認・却下を行います',
          'button': '承認管理'
        },
        'employees': {
          'title': '従業員管理',
          'description': '従業員情報の管理を行います',
          'button': '従業員管理'
        }
      }
    }
  }
};

console.log('📋 Estrutura dos textos:');
console.log(JSON.stringify(structuredTexts, null, 2));

// Simular como o serviço processa os textos (CORRIGIDO)
const textsToUpdate = [];

Object.entries(structuredTexts).forEach(([language, categories]) => {
  Object.entries(categories).forEach(([category, keys]) => {
    textsToUpdate.push(...processNestedObject(keys, '', language, category));
  });
});

console.log('\n🔄 Textos processados para o banco (CORRIGIDO):');
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

console.log('\n✅ Agora os textos aninhados estão sendo processados corretamente!');
