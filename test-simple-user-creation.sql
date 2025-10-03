-- TESTE SIMPLES DE CRIAÇÃO DE USUÁRIOS
-- Execute este script após aplicar a correção para verificar se está funcionando

-- ===============================================
-- 1. VERIFICAR STATUS BÁSICO
-- ===============================================

-- Verificar se RLS está habilitada
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

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
-- 2. VERIFICAR POLÍTICAS RLS
-- ===============================================

-- Verificar políticas existentes
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

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
LIMIT 3;

-- ===============================================
-- 4. VERIFICAR INTEGRIDADE
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

-- ===============================================
-- 5. INSTRUÇÕES PARA TESTE MANUAL
-- ===============================================

-- Para testar a criação de usuários:
-- 1. Vá para a página de registro/cadastro da aplicação
-- 2. Tente criar um novo usuário
-- 3. Verifique se não aparece o erro "Failed to create user"
-- 4. Execute novamente este script para ver se o perfil foi criado

-- ===============================================
-- 6. VERIFICAÇÃO APÓS CRIAÇÃO DE USUÁRIO
-- ===============================================

-- Após criar um usuário via aplicação, execute esta consulta para verificar:
-- SELECT 
--   'NOVO_PERFIL_CRIADO' as verificacao,
--   id,
--   first_name,
--   phone,
--   role,
--   status,
--   created_at
-- FROM public.profiles 
-- ORDER BY created_at DESC 
-- LIMIT 1;
