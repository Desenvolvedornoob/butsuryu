/**
 * Função utilitária para formatar números de telefone japoneses
 * Garante que sempre tenha o formato +819012345678
 * 
 * Exemplos:
 * "90-1234-5678" → "+819012345678"
 * "09012345678" → "+819012345678"
 * "+81 90-1234-5678" → "+819012345678"
 */
export const formatJapanesePhone = (phone: string): string => {
  // Remove todos os caracteres exceto números e +
  let formatted = phone.replace(/[^\d+]/g, '');
  
  // Se não tem +, adicionar +81 no início
  if (!formatted.startsWith('+')) {
    // Se começa com 81, adicionar +
    if (formatted.startsWith('81')) {
      formatted = '+' + formatted;
    } else {
      // Se começa com 0, remover o 0 e adicionar +81
      if (formatted.startsWith('0')) {
        formatted = '+81' + formatted.substring(1);
      } else {
        // Se não tem 81 nem 0, adicionar +81
        formatted = '+81' + formatted;
      }
    }
  }
  
  return formatted;
};

/**
 * Função para tentar diferentes formatos de telefone para login
 * Gera variações locais E internacionais para máxima compatibilidade
 * 
 * Exemplos de entrada e formatos gerados:
 * "090-6585-4757" → ["09065854757", "9065854757", "+819065854757", "819065854757"]
 * "90-6585-4757" → ["9065854757", "09065854757", "+819065854757", "819065854757"]
 * "+819065854757" → ["+819065854757", "9065854757", "09065854757", "819065854757"]
 * 
 * Formatos suportados:
 * - 090-6585-4757 (formato local completo)
 * - 90-6585-4757 (formato local sem 0)
 * - +819065854757 (formato internacional com +)
 * - 819065854757 (formato internacional sem + - usado pelo auth.users)
 * 
 * Nota: Inclui TODOS os formatos para compatibilidade com auth.users e profiles
 */
export const getPhoneFormatsForLogin = (phone: string): string[] => {
  // Limpar o telefone
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const formats: string[] = [];
  
  // 1. Formato original limpo
  formats.push(cleanPhone);
  
  // 2. Extrair o número base (sem códigos internacionais)
  let baseNumber = cleanPhone;
  if (cleanPhone.startsWith('+81')) {
    baseNumber = cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('81') && cleanPhone.length > 10) {
    baseNumber = cleanPhone.substring(2);
  }
  
  // 3. Se o número base começa com 0, temos um número local completo
  if (baseNumber.startsWith('0')) {
    const numberWithout0 = baseNumber.substring(1);
    
    // Adicionar variações locais
    formats.push(baseNumber);        // 09065854757
    formats.push(numberWithout0);    // 9065854757
    
    // Adicionar formatos internacionais (com e sem +)
    formats.push('+81' + numberWithout0);  // +819065854757
    formats.push('81' + numberWithout0);   // 819065854757
    
    // FORMATO ESPECÍFICO: 81 + número completo com 0 (como está no auth.users)
    formats.push('81' + baseNumber);       // 8109065854757
    
  } 
  // 4. Se o número base começa com 9 (sem 0), é um número sem 0 inicial
  else if (baseNumber.startsWith('9')) {
    const numberWith0 = '0' + baseNumber;
    
    // Adicionar variações locais
    formats.push(baseNumber);        // 9065854757
    formats.push(numberWith0);       // 09065854757
    
    // Adicionar formatos internacionais (com e sem +)
    formats.push('+81' + baseNumber);      // +819065854757
    formats.push('81' + baseNumber);       // 819065854757
    
    // FORMATO ESPECÍFICO: 81 + número com 0 (como pode estar no auth.users)
    formats.push('81' + numberWith0);      // 8109065854757
  }
  // 5. Para outros casos, tentar formato internacional também
  else {
    // SEMPRE tentar formato internacional caso o banco tenha +81 ou 81
    if (!cleanPhone.startsWith('+81') && !cleanPhone.startsWith('81')) {
      formats.push('+81' + cleanPhone);
      formats.push('81' + cleanPhone);
    }
  }
  
  // Remover duplicatas mantendo a ordem
  return [...new Set(formats)];
};

/**
 * Função para validar se o telefone está no formato correto
 */
export const isValidJapanesePhone = (phone: string): boolean => {
  const formatted = formatJapanesePhone(phone);
  // Deve ter +81 seguido de 9-10 dígitos
  return /^\+81\d{9,10}$/.test(formatted);
};

/**
 * Função para exibir o telefone em formato legível
 */
export const displayPhone = (phone: string): string => {
  const formatted = formatJapanesePhone(phone);
  
  // Formato: +81 90-1234-5678
  if (formatted.startsWith('+81')) {
    const number = formatted.substring(3); // Remove +81
    if (number.length === 10) {
      return `+81 ${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6)}`;
    } else if (number.length === 11) {
      return `+81 ${number.substring(0, 3)}-${number.substring(3, 7)}-${number.substring(7)}`;
    }
  }
  
  return formatted;
}; 