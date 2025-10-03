// Colar este código no console do navegador quando estiver na página dashboard

// Criar um usuário admin com todas as permissões
const adminUser = {
  id: 'd6ad28f0-efe0-4ca8-a769-664d2e48692e',
  phone: '+8109065854757',
  role: 'admin',
  first_name: 'Administrador',
  last_name: 'Sistema',
  department: 'Administração',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  factory_id: '1',
  responsible: 'Sistema',
  status: 'active'
};

// Criar dados de exemplo para o dashboard
const dummyRequests = [
  {
    id: 'req-' + Math.random().toString(36).substring(2, 9),
    type: 'time-off',
    status: 'approved',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Férias programadas'
  },
  {
    id: 'req-' + Math.random().toString(36).substring(2, 9),
    type: 'early-departure',
    status: 'pending',
    date: new Date().toISOString(),
    time: '16:30',
    reason: 'Consulta médica'
  },
  {
    id: 'req-' + Math.random().toString(36).substring(2, 9),
    type: 'lateness',
    status: 'approved',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    arrivalTime: '09:30',
    reason: 'Problema com transporte'
  }
];

// Salvar no localStorage
localStorage.setItem('requests', JSON.stringify(dummyRequests));
sessionStorage.setItem('adminUser', JSON.stringify(adminUser));

// Forçar atualização da página para carregar os dados
console.log('Dados configurados. Recarregando a página...');
setTimeout(() => window.location.reload(), 500); 