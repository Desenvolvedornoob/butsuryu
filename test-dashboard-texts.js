// Script para testar se os textos do dashboard estão sendo carregados
console.log('🔍 Testando carregamento dos textos do dashboard...');

// Simular o hook useCustomTexts
const testTexts = {
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
        },
        'factories': {
          'title': '工場管理',
          'description': '工場とその設定を管理します',
          'button': '工場管理'
        },
        'groups': {
          'title': 'グループ管理',
          'description': '作業グループとシフトを管理します',
          'button': 'グループ管理'
        },
        'absence': {
          'title': '欠勤登録',
          'description': '従業員の欠勤を登録します',
          'button': '欠勤登録'
        },
        'data': {
          'title': 'データ・レポート',
          'description': 'グラフとレポートを表示します',
          'button': 'データ表示'
        },
        'monitoring': {
          'title': 'モニタリング',
          'description': '今日と今後のイベントを確認します',
          'button': 'モニタリング'
        },
        'dismissals': {
          'title': '退職管理',
          'description': '従業員の退職を分析します',
          'button': '退職管理'
        },
        'myData': {
          'title': 'マイデータ',
          'description': '個人の統計データを表示します',
          'button': 'マイデータ'
        }
      }
    }
  }
};

// Função getText simulada
function getText(key, language = 'jp', fallback = '') {
  const keys = key.split('.');
  let current = testTexts[language];
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback || key;
    }
  }
  
  return typeof current === 'string' ? current : (fallback || key);
}

// Testar todos os textos
const cards = [
  'approval', 'employees', 'factories', 'groups', 
  'absence', 'data', 'monitoring', 'dismissals', 'myData'
];

console.log('📋 Testando textos em japonês:');
cards.forEach(card => {
  const title = getText(`dashboard.cards.${card}.title`, 'jp', `Fallback ${card}`);
  const description = getText(`dashboard.cards.${card}.description`, 'jp', `Fallback description ${card}`);
  const button = getText(`dashboard.cards.${card}.button`, 'jp', `Fallback button ${card}`);
  
  console.log(`\n🎴 ${card.toUpperCase()}:`);
  console.log(`  Título: ${title}`);
  console.log(`  Descrição: ${description}`);
  console.log(`  Botão: ${button}`);
});

console.log('\n✅ Teste concluído!');
