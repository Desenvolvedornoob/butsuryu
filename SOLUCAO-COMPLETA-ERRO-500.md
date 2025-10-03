# Solução Completa para o Erro 500

## Problema Identificado
O erro 500 está ocorrendo na função `fetchProfile` do `AuthContext.tsx` quando tenta buscar perfis de usuários. Isso indica um problema de acesso à tabela `profiles` no Supabase.

## Causas Possíveis
1. **RLS (Row Level Security)** bloqueando acesso
2. **Políticas de acesso** conflitantes
3. **Função de trigger** mal configurada
4. **Sessão de autenticação** inválida

## Solução Passo a Passo

### 1. Diagnóstico (Execute primeiro)
Execute no **SQL Editor** do Supabase:
```sql
-- Arquivo: test-profiles-access.sql
-- Este script vai verificar o status atual da tabela profiles
```

### 2. Solução Rápida (Teste primeiro)
Execute no **SQL Editor**:
```sql
-- Arquivo: test-no-rls.sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

### 3. Solução Completa (Se o passo 2 funcionou)
Execute no **SQL Editor**:
```sql
-- Arquivo: fix-500-error.sql
-- Este script corrige as políticas RLS e reabilita com configuração correta
```

### 4. Verificação Final
Execute no **SQL Editor**:
```sql
-- Arquivo: check-rls-status.sql
-- Este script verifica se tudo está funcionando corretamente
```

## Arquivos Modificados no Código

### 1. `src/contexts/AuthContext.tsx`
- Adicionados logs de debug na função `fetchProfile`
- Melhor tratamento de erros
- Verificação de sessão ativa

### 2. `src/integrations/supabase/client.ts`
- Função `createEmployeeWithoutAuth` atualizada
- Uso de `supabase.auth.admin.createUser()`
- Restauração de sessão do admin

## Como Testar

### Teste 1: Login
1. Faça login como admin
2. Verifique se não há erro 500 no console
3. Verifique se o perfil é carregado corretamente

### Teste 2: Criação de Funcionário
1. Vá para a página de funcionários
2. Crie um novo funcionário
3. Verifique se:
   - Admin não é deslogado
   - Todos os dados são salvos
   - Não há erro 500

### Teste 3: Login do Novo Funcionário
1. Faça logout do admin
2. Faça login com o novo funcionário
3. Verifique se funciona sem erro 500

## Logs para Monitorar

No console do navegador, procure por:
- `[AuthContext] Iniciando busca de perfil para ID:`
- `[AuthContext] Sessão ativa:`
- `[AuthContext] Erro ao buscar perfil:`
- `[Supabase Client] Evento de autenticação:`

## Se o Problema Persistir

### Verificar Dados
```sql
SELECT COUNT(*) FROM public.profiles;
SELECT * FROM public.profiles LIMIT 5;
```

### Verificar Autenticação
```sql
SELECT * FROM auth.users LIMIT 5;
```

### Verificar Triggers
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

## Ordem de Execução Recomendada

1. **Execute** `test-profiles-access.sql` (diagnóstico)
2. **Execute** `test-no-rls.sql` (teste rápido)
3. **Teste** o login e criação de funcionários
4. **Se funcionar**, execute `fix-500-error.sql` (solução completa)
5. **Execute** `check-rls-status.sql` (verificação)
6. **Teste** novamente tudo

## Contato
Se ainda houver problemas após seguir todos os passos, forneça:
- Logs do console do navegador
- Resultado dos scripts SQL
- Descrição detalhada do erro 