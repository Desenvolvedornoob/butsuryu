// Função radicalmente simplificada para forçar redirecionamento
export const forceDashboardRedirect = () => {
  console.log("[Supabase] Redirecionando para o dashboard...");
  window.location.href = '/dashboard';
};

// Verificar sessão ao carregar o cliente
setTimeout(() => {
  checkSessionAndRedirect();
}, 1000); 