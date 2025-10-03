import { deleteAllUsers } from '../integrations/supabase/client';

const main = async () => {
  console.log('Iniciando processo de deleção de usuários...');
  const result = await deleteAllUsers();
  
  if (result.success) {
    console.log('✅ ' + result.message);
  } else {
    console.error('❌ Erro ao deletar usuários:', result.error);
  }
};

main(); 