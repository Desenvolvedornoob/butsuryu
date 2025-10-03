# 🔧 Correção do Erro "Failed to create user: Database error creating new user"

## 📋 **Problema Identificado**

O erro **"Failed to create user: Database error creating new user"** está ocorrendo devido a um conflito entre as políticas RLS (Row Level Security) e o sistema de criação automática de usuários no Supabase.

### **Causa Raiz:**
1. **Conflito de RLS**: A tabela `profiles` tem políticas RLS que impedem a inserção de novos usuários
2. **Trigger falhando**: O trigger `on_auth_user_created` não consegue inserir o perfil devido às políticas RLS restritivas
3. **Política de INSERT problemática**: A política `profiles_insert_policy` só permite inserção se o usuário já existir na tabela `profiles` ou for admin

## 🚀 **Solução Implementada**

### **Arquivo de Correção:**
- **`fix-user-creation-rls.sql`** - Script principal para corrigir o problema
- **`test-simple-user-creation.sql`** - Script de teste simplificado

### **O que o Script Faz:**

1. **Desabilita RLS temporariamente** para permitir correções
2. **Remove políticas problemáticas** que estão causando o conflito
3. **Cria função segura** `handle_new_user()` que contorna RLS para criação de perfis
4. **Configura trigger automático** que cria perfis quando usuários são criados
5. **Reaplica políticas RLS corretas** que permitem criação via trigger
6. **Habilita RLS novamente** com as novas configurações

### **⚠️ Importante:**
O script foi ajustado para usar apenas as colunas que realmente existem na tabela `profiles`:
- ✅ `id`, `phone`, `first_name`, `role`, `status`
- ✅ `department`, `responsible`, `factory_id`
- ✅ `created_at`, `updated_at`
- ❌ `_loading_state` (não existe na tabela)

## 📝 **Como Aplicar a Correção**

### **Passo 1: Executar o Script de Correção**
1. Acesse o **SQL Editor** do Supabase
2. Cole e execute o conteúdo do arquivo `fix-user-creation-rls.sql`
3. Aguarde a execução completa

### **Passo 2: Verificar a Correção**
1. Execute o arquivo `test-simple-user-creation.sql` para verificar se tudo está funcionando
2. Verifique se as políticas foram criadas corretamente
3. Confirme se o trigger está ativo

### **Passo 3: Testar a Criação de Usuários**
1. Vá para a página de registro/cadastro da aplicação
2. Tente criar um novo usuário
3. Verifique se não aparece mais o erro "Failed to create user"
4. Confirme se o perfil foi criado automaticamente na tabela `profiles`

## 🔍 **Verificações Importantes**

### **Status do RLS:**
```sql
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles';
```

### **Políticas Criadas:**
```sql
SELECT 
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;
```

### **Trigger Status:**
```sql
SELECT 
  tgname as nome_trigger,
  tgrelid::regclass as tabela
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### **Função Status:**
```sql
SELECT 
  proname as nome_funcao
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

## ⚠️ **Pontos de Atenção**

1. **Backup**: Sempre faça backup antes de executar scripts de correção
2. **Ambiente**: Execute primeiro em ambiente de desenvolvimento/teste
3. **Permissões**: Certifique-se de ter permissões de administrador no Supabase
4. **Testes**: Teste a criação de usuários após aplicar a correção
5. **Colunas**: O script usa apenas colunas existentes na tabela `profiles`

## 🧪 **Teste de Funcionamento**

### **Teste Simples:**
1. Crie um usuário via aplicação
2. Verifique se o perfil foi criado na tabela `profiles`
3. Confirme se o usuário pode fazer login

### **Teste de Integridade:**
```sql
-- Verificar se todos os usuários auth têm perfis
SELECT COUNT(*) as usuarios_sem_perfil
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### **Verificar Novo Perfil Criado:**
```sql
-- Após criar usuário, verificar se o perfil foi criado
SELECT 
  id,
  first_name,
  phone,
  role,
  status,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 1;
```

## 🔧 **Solução Alternativa (Se Necessário)**

Se a correção principal não funcionar, você pode temporariamente desabilitar RLS:

```sql
-- DESABILITAR RLS TEMPORARIAMENTE (APENAS EM CASO DE EMERGÊNCIA)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Reabilitar RLS após resolver o problema
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

## 📞 **Suporte**

Se o problema persistir após aplicar a correção:

1. Verifique os logs do Supabase para erros específicos
2. Execute o script de diagnóstico `test-simple-user-creation.sql`
3. Verifique se todas as políticas foram criadas corretamente
4. Confirme se o trigger está funcionando
5. Verifique se a função `handle_new_user` foi criada

## ✅ **Resultado Esperado**

Após aplicar a correção:
- ✅ Usuários podem ser criados sem erro
- ✅ Perfis são criados automaticamente via trigger
- ✅ RLS continua funcionando para segurança
- ✅ Políticas permitem operações necessárias
- ✅ Sistema mantém integridade dos dados
- ✅ Script usa apenas colunas existentes na tabela

## 🔄 **Arquivos Atualizados**

- **`fix-user-creation-rls.sql`** - Script principal corrigido
- **`test-simple-user-creation.sql`** - Script de teste simplificado
- **`README-fix-user-creation.md`** - Documentação atualizada
