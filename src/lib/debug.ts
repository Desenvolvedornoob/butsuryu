// Configuração para controlar logs de debug
export const DEBUG_CONFIG = {
  // Desabilitar logs que estão deixando o sistema lento
  calendar: false,
  auth: false,
  dashboard: false,
  requests: false,
  
  // Manter apenas logs de erro
  errors: true
};

// Função helper para logs condicionais
export const debugLog = (category: keyof typeof DEBUG_CONFIG, message: string, ...args: any[]) => {
  if (DEBUG_CONFIG[category]) {
    console.log(message, ...args);
  }
};

// Função para logs de erro (sempre habilitados)
export const errorLog = (message: string, ...args: any[]) => {
  console.error(message, ...args);
}; 