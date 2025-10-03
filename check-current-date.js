// Script para verificar a data atual do sistema
// Execute este script no console do navegador

console.log('📅 VERIFICANDO DATA ATUAL DO SISTEMA...');

// Verificar data atual
const now = new Date();
console.log('📅 Data atual completa:', now);
console.log('📅 Ano atual:', now.getFullYear());
console.log('📅 Mês atual (0-11):', now.getMonth());
console.log('📅 Mês atual (1-12):', now.getMonth() + 1);
console.log('📅 Dia atual:', now.getDate());
console.log('📅 Data formatada (pt-BR):', now.toLocaleDateString('pt-BR'));
console.log('📅 Data formatada (ISO):', now.toISOString());
console.log('📅 Data formatada (yyyy-MM):', now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));

// Verificar timezone
console.log('🌍 Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('🌍 Offset UTC:', now.getTimezoneOffset());

// Verificar se estamos em 2024 ou 2025
if (now.getFullYear() === 2024) {
  console.log('✅ Confirmado: Estamos em 2024');
} else if (now.getFullYear() === 2025) {
  console.log('⚠️ Confirmado: Estamos em 2025');
} else {
  console.log('❓ Ano inesperado:', now.getFullYear());
}

// Testar formatação com date-fns (se disponível)
if (typeof format !== 'undefined') {
  try {
    console.log('📅 Format com date-fns (yyyy-MM):', format(now, 'yyyy-MM'));
    console.log('📅 Format com date-fns (yyyy):', format(now, 'yyyy'));
  } catch (error) {
    console.log('❌ date-fns não disponível:', error);
  }
}
