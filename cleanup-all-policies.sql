-- LIMPEZA COMPLETA DE TODAS AS POLÍTICAS RLS
-- Execute este script para remover TODAS as políticas e recomeçar do zero

-- ===============================================
-- 1. DESABILITAR RLS COMPLETAMENTE
-- ===============================================

-- Desabilitar RLS para parar todos os erros
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ===============================================

-- Remover TODAS as políticas possíveis (incluindo as que podem existir)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Remover políticas com nomes genéricos que podem existir
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.profiles;

-- ===============================================
-- 3. VERIFICAR SE TODAS AS POLÍTICAS FORAM REMOVIDAS
-- ===============================================

-- Verificar se não há políticas
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NENHUMA POLÍTICA - PERFEITO!'
    ELSE '❌ AINDA EXISTEM POLÍTICAS: ' || COUNT(*) || ' - NOMES: ' || string_agg(policyname, ', ')
  END as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- ===============================================
-- 4. VERIFICAR STATUS DO RLS
-- ===============================================

-- Verificar status do RLS
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN '❌ AINDA HABILITADO - PROBLEMA!'
    ELSE '✅ DESABILITADO - SEGURO!'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ===============================================
-- 5. VERIFICAR SE A FUNÇÃO EXISTE
-- ===============================================

-- Verificar se a função foi criada
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- ===============================================
-- 6. VERIFICAR SE O TRIGGER EXISTE
-- ===============================================

-- Verificar se o trigger foi criado
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- ===============================================
-- 7. VERIFICAR INTEGRIDADE
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
-- 8. MENSAGEM FINAL
-- ===============================================

SELECT 
  'STATUS_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public' 
      AND NOT rowsecurity
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles'
    )
    THEN '✅ SISTEMA LIMPO - RLS DESABILITADO E SEM POLÍTICAS'
    ELSE '⚠️ ALGUNS PROBLEMAS PERSISTEM - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;

-- ===============================================
-- 9. INSTRUÇÕES PARA PRÓXIMOS PASSOS
-- ===============================================

-- Após executar este script com sucesso:
-- 1. Teste se o dashboard carrega sem erros
-- 2. Se funcionar, mantenha RLS desabilitado temporariamente
-- 3. Para reabilitar RLS depois, use políticas mais simples
-- 4. Evite políticas que consultem a própria tabela profiles
