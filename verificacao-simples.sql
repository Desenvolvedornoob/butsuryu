-- VERIFICAÇÃO SIMPLES - IDENTIFICA PROBLEMAS BÁSICOS
-- Execute este script para ver o que está causando os problemas

-- ===============================================
-- 1. VERIFICAÇÃO DE POLÍTICAS RLS
-- ===============================================

-- Verificar TODAS as políticas existentes
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Contar total de políticas
SELECT 
  'TOTAL_POLITICAS' as verificacao,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NENHUMA POLÍTICA'
    ELSE '❌ EXISTEM ' || COUNT(*) || ' POLÍTICAS'
  END as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- ===============================================
-- 2. VERIFICAÇÃO DE RLS
-- ===============================================

-- Verificar status do RLS
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN '❌ RLS HABILITADO'
    ELSE '✅ RLS DESABILITADO'
  END as status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ===============================================
-- 3. VERIFICAÇÃO DE FUNÇÃO
-- ===============================================

-- Verificar se a função existe
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- ===============================================
-- 4. VERIFICAÇÃO DE TRIGGER
-- ===============================================

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- ===============================================
-- 5. VERIFICAÇÃO DE INTEGRIDADE
-- ===============================================

-- Verificar usuários sem perfis
SELECT 
  'USUARIOS_SEM_PERFIL' as verificacao,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS OS USUÁRIOS TÊM PERFIS'
    ELSE '❌ EXISTEM ' || COUNT(*) || ' USUÁRIOS SEM PERFIL'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 6. RESUMO FINAL
-- ===============================================

-- Resumo final
SELECT 
  'RESUMO_FINAL' as verificacao,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
         AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity)
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
         AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
         AND NOT EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL)
    THEN '✅ SISTEMA PERFEITO - TODOS OS PROBLEMAS RESOLVIDOS!'
    ELSE '⚠️ PROBLEMAS IDENTIFICADOS - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;
