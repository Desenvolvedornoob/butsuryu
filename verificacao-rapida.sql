-- VERIFICAÇÃO RÁPIDA APÓS APLICAÇÃO DA CORREÇÃO
-- Execute este script para confirmar que tudo está funcionando

-- ===============================================
-- 1. VERIFICAÇÃO DE INTEGRIDADE
-- ===============================================

-- Verificar se todos os usuários auth têm perfis correspondentes
SELECT 
  'INTEGRIDADE_AUTH_PROFILES' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK - Todos os usuários têm perfis'
    ELSE '❌ PROBLEMA - Existem usuários sem perfis: ' || COUNT(*)
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 2. VERIFICAÇÃO DE RLS
-- ===============================================

-- Verificar se RLS está habilitada
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ HABILITADO'
    ELSE '❌ DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ===============================================
-- 3. VERIFICAÇÃO DE POLÍTICAS
-- ===============================================

-- Verificar políticas criadas
SELECT 
  'POLITICAS_CRIADAS' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- ===============================================
-- 4. VERIFICAÇÃO DE FUNÇÃO E TRIGGER
-- ===============================================

-- Verificar se a função foi criada
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- Verificar se o trigger foi criado
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- ===============================================
-- 5. VERIFICAÇÃO DE DADOS
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
ORDER BY created_at DESC
LIMIT 3;

-- ===============================================
-- 6. RESUMO FINAL
-- ===============================================

-- Resumo do status
SELECT 
  'RESUMO_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
    ) AND EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) AND EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'profiles'
    ) AND NOT EXISTS (
      SELECT 1 FROM auth.users au
      LEFT JOIN public.profiles p ON au.id = p.id
      WHERE p.id IS NULL
    )
    THEN '✅ SISTEMA FUNCIONANDO PERFEITAMENTE!'
    ELSE '⚠️ ALGUNS PROBLEMAS PERSISTEM - Verifique os resultados acima'
  END as status;
