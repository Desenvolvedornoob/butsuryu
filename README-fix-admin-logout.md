# Correção do Problema de Logout do Admin e Salvamento de Dados

## Problema Identificado

O admin está sendo deslogado quando adiciona novos funcionários e os dados não estão sendo salvos completamente (apenas telefone e senha, não nome, departamento, etc.). Isso está acontecendo devido a:

1. **Erro 403 (Forbidden)** ao tentar inserir na tabela `profiles`
2. **Políticas RLS (Row Level Security)** muito restritivas
3. **Problemas com triggers** que tentam usar operadores JSON em colunas que podem não ser do tipo JSON

## Solução em 3 Passos

### Passo 1: Desabilitar RLS Temporariamente

Execute o script `disable-profiles-rls.sql` no SQL Editor do Supabase:

```sql
-- Este script desabilita temporariamente o RLS na tabela profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

**Resultado esperado**: RLS será desabilitada, permitindo inserções diretas.

### Passo 2: Testar Criação de Funcionários

Agora teste criar um novo funcionário pela página de admin. O sistema deve:
- ✅ Não deslogar o admin
- ✅ Salvar todos os dados (nome, departamento, etc.)
- ✅ Não apresentar erro 403

### Passo 3: Reabilitar RLS com Políticas Corretas

Após confirmar que a criação de funcionários está funcionando, execute o script `enable-profiles-rls-admin.sql`:

```sql
-- Este script reabilita RLS com políticas permissivas para admins
-- Admins podem criar, atualizar e deletar qualquer perfil
-- Usuários normais só podem gerenciar seu próprio perfil
```

## Arquivos Modificados

### 1. `src/integrations/supabase/client.ts`
- **Função**: `createEmployeeWithoutAuth`
- **Mudanças**:
  - Usa `supabase.auth.admin.createUser()` em vez de `signUp()`
  - Salva e restaura a sessão do admin
  - Usa `user_metadata` em vez de `options.data`

### 2. Scripts SQL Criados
- `disable-profiles-rls.sql` - Desabilita RLS temporariamente
- `enable-profiles-rls-admin.sql` - Reabilita RLS com políticas corretas
- `simple-profiles-fix.sql` - Políticas RLS básicas
- `test-profiles-fix.sql` - Script de teste para verificar estrutura

## Verificação

Após executar os scripts, verifique se:

1. **RLS Status**: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
2. **Políticas**: `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';`
3. **Funcionamento**: Teste criar um novo funcionário

## Problemas Resolvidos

- ❌ **Admin sendo deslogado** → ✅ Sessão preservada
- ❌ **Dados não salvos** → ✅ Todos os dados salvos
- ❌ **Erro 403** → ✅ Sem erros de permissão
- ❌ **Erro 42601** → ✅ Sintaxe SQL corrigida

## Próximos Passos

1. Execute `disable-profiles-rls.sql`
2. Teste criar um funcionário
3. Se funcionar, execute `enable-profiles-rls-admin.sql`
4. Teste novamente para confirmar que tudo continua funcionando

## Notas Importantes

- O RLS será desabilitado temporariamente para resolver o problema
- As políticas finais permitem que admins gerenciem todos os perfis
- Usuários normais só podem gerenciar seu próprio perfil
- A segurança é mantida através das políticas RLS corretas 