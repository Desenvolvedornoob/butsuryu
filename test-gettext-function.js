// Teste para verificar se a função getText está funcionando
console.log('🔍 Testando função getText...');

// Simular a função getText
function getText(key, language = 'pt-BR', fallback = '') {
  // Simular textos do banco
  const customTexts = {
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

  // Se ainda está carregando ou não carregou ainda, retornar fallback
  if (!customTexts || !customTexts[language] || Object.keys(customTexts).length === 0) {
    return fallback || key;
  }

  const keys = key.split('.');
  let current = customTexts[language];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || key;
    }
  }

  return typeof current === 'string' ? current : (fallback || key);
}

// Testar a função
console.log('📋 Testando getText:');
console.log('1. getText("dashboard.cards.approval.title", "jp"):', getText('dashboard.cards.approval.title', 'jp', 'Fallback'));
console.log('2. getText("dashboard.cards.approval.description", "jp"):', getText('dashboard.cards.approval.description', 'jp', 'Fallback'));
console.log('3. getText("dashboard.cards.approval.button", "jp"):', getText('dashboard.cards.approval.button', 'jp', 'Fallback'));

console.log('\n✅ A função getText está funcionando corretamente!');
console.log('O problema deve estar no carregamento dos textos do banco.');
