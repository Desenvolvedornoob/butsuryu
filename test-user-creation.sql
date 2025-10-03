-- TESTE DE CRIAÇÃO DE USUÁRIOS
-- Execute este script após aplicar a correção para verificar se está funcionando

-- ===============================================
-- 1. VERIFICAR STATUS ATUAL
-- ===============================================

-- Verificar se RLS está habilitada
SELECT 
  'STATUS_RLS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Verificar políticas existentes
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Verificar se a função existe
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as status;

-- ===============================================
-- 2. VERIFICAR ESTRUTURA DA TABELA
-- ===============================================

-- Verificar colunas da tabela profiles
SELECT 
  'ESTRUTURA_PROFILES' as verificacao,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints da tabela
SELECT 
  'CONSTRAINTS_PROFILES' as verificacao,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- ===============================================
-- 3. VERIFICAR DADOS EXISTENTES
-- ===============================================

-- Contar total de perfis
SELECT 
  'TOTAL_PERFIS' as verificacao,
  COUNT(*) as quantidade
FROM public.profiles;

-- Verificar alguns perfis existentes
SELECT 
  'AMOSTRA_PERFIS' as verificacao,
  id,
  first_name,
  phone,
  role,
  status,
  created_at
FROM public.profiles 
LIMIT 5;

-- ===============================================
-- 4. VERIFICAR USUÁRIOS AUTH
-- ===============================================

-- Contar usuários na tabela auth.users
SELECT 
  'TOTAL_USUARIOS_AUTH' as verificacao,
  COUNT(*) as quantidade
FROM auth.users;

-- Verificar usuários sem perfil correspondente
SELECT 
  'USUARIOS_SEM_PERFIL' as verificacao,
  COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 5. TESTE DE PERMISSÕES
-- ===============================================

-- Verificar se um usuário autenticado pode ver perfis
-- (Execute este teste quando estiver logado como usuário comum)
SELECT 
  'TESTE_PERMISSAO_SELECT' as verificacao,
  'Execute este teste quando logado como usuário comum' as instrucao;

-- Verificar se admin pode ver todos os perfis
-- (Execute este teste quando estiver logado como admin)
SELECT 
  'TESTE_PERMISSAO_ADMIN' as verificacao,
  'Execute este teste quando logado como admin' as instrucao;

-- ===============================================
-- 6. INSTRUÇÕES PARA TESTE MANUAL
-- ===============================================

-- Para testar a criação de usuários:
-- 1. Vá para a página de registro/cadastro da aplicação
-- 2. Tente criar um novo usuário
-- 3. Verifique se não aparece o erro "Failed to create user"
-- 4. Verifique se o perfil foi criado automaticamente na tabela profiles

-- Para verificar se o trigger está funcionando:
-- 1. Crie um usuário via aplicação
-- 2. Execute a consulta abaixo para ver se o perfil foi criado
SELECT 
  'VERIFICACAO_TRIGGER' as verificacao,
  'Após criar usuário, verifique se este perfil existe:' as instrucao;

-- ===============================================
-- 7. VERIFICAÇÃO DE INTEGRIDADE
-- ===============================================

-- Verificar se todos os usuários auth têm perfis correspondentes
SELECT 
  'INTEGRIDADE_AUTH_PROFILES' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Todos os usuários têm perfis'
    ELSE 'PROBLEMA - Existem usuários sem perfis: ' || COUNT(*)
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verificar se todos os perfis têm usuários auth correspondentes
SELECT 
  'INTEGRIDADE_PROFILES_AUTH' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Todos os perfis têm usuários auth'
    ELSE 'PROBLEMA - Existem perfis sem usuários auth: ' || COUNT(*)
  END as status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;
