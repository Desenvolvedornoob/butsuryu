# Como Resolver o Erro 500 ao Buscar Perfis

## Problema
O erro 500 está ocorrendo quando o sistema tenta buscar perfis de usuários. Isso geralmente acontece devido a problemas com RLS (Row Level Security) ou políticas de acesso à tabela `profiles`.

## Solução Passo a Passo

### Passo 1: Testar sem RLS (Mais Simples)
1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Execute o script `test-no-rls.sql`:
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```
4. Teste o login e criação de funcionários
5. Se funcionar, o problema era o RLS

### Passo 2: Se o Passo 1 funcionou, reabilitar RLS corretamente
Execute o script `fix-500-error.sql` que:
- Remove políticas conflitantes
- Cria políticas simples e funcionais
- Reabilita o RLS com configuração correta

### Passo 3: Verificar se tudo está funcionando
Execute o script `check-rls-status.sql` para verificar:
- Status do RLS
- Políticas existentes
- Função de criação de perfis
- Trigger de autenticação

## Arquivos Modificados
- `src/integrations/supabase/client.ts` - Função `createEmployeeWithoutAuth` atualizada
- `src/contexts/AuthContext.tsx` - Função `fetchProfile` que está gerando o erro 500

## Teste Após Aplicar as Correções
1. Faça login como admin
2. Tente criar um novo funcionário
3. Verifique se não há logout automático
4. Verifique se todos os dados são salvos
5. Teste o login do novo funcionário

## Se o Problema Persistir
Execute este comando no SQL Editor para verificar se há dados na tabela:
```sql
SELECT COUNT(*) FROM public.profiles;
SELECT * FROM public.profiles LIMIT 5;
```

## Logs para Debug
Se ainda houver problemas, verifique os logs no console do navegador para:
- Erros de autenticação
- Erros de RLS
- Erros de permissão 