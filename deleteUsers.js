import { deleteAllUsers } from './src/integrations/supabase/client.ts';

deleteAllUsers().then(result => {
  if (result.success) console.log('Usuários deletados com sucesso');
  else console.error('Erro ao deletar usuários:', result.error);
}); 