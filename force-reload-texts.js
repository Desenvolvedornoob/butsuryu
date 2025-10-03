// Script para forçar recarregamento dos textos
console.log('🔄 Forçando recarregamento dos textos...');

// Simular limpeza do cache
localStorage.removeItem('siteTexts');

console.log('✅ Cache limpo!');
console.log('🔄 Agora recarregue a página para carregar os textos atualizados do banco.');

console.log('\n📋 Passos para testar:');
console.log('1. Execute o SQL no Supabase (se ainda não executou)');
console.log('2. Recarregue a página do dashboard');
console.log('3. Os cards devem aparecer em japonês');
console.log('4. Edite um texto no editor e salve');
console.log('5. O texto deve aparecer atualizado no dashboard');
