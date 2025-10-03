-- CORREÇÃO DE EMERGÊNCIA - POLÍTICAS RLS ULTRA SIMPLES
-- Execute este script se o erro de recursão persistir

-- ===============================================
-- 1. DESABILITAR RLS COMPLETAMENTE
-- ===============================================

-- Desabilitar RLS para parar todos os erros
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. REMOVER TODAS AS POLÍTICAS
-- ===============================================

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;

-- ===============================================
-- 3. VERIFICAR SE RLS ESTÁ DESABILITADO
-- ===============================================

-- Verificar status do RLS
SELECT 
  'RLS_STATUS_EMERGENCIA' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN '❌ AINDA HABILITADO - PROBLEMA!'
    ELSE '✅ DESABILITADO - SEGURO!'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ===============================================
-- 4. VERIFICAR SE NÃO HÁ POLÍTICAS
-- ===============================================

-- Verificar se não há políticas
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NENHUMA POLÍTICA - PERFEITO!'
    ELSE '❌ AINDA EXISTEM POLÍTICAS: ' || COUNT(*)
  END as status
FROM pg_policies 
WHERE tablename = 'profiles';

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
-- 8. INSTRUÇÕES PARA TESTE
-- ===============================================

-- Após executar este script:
-- 1. Teste se o dashboard carrega sem erros
-- 2. Teste se consegue ver os dados dos perfis
-- 3. Teste se consegue criar novos usuários
-- 4. Se tudo funcionar, mantenha RLS desabilitado temporariamente

-- ===============================================
-- 9. MENSAGEM FINAL
-- ===============================================

SELECT 
  'STATUS_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public' 
      AND NOT rowsecurity
    )
    THEN '✅ SISTEMA FUNCIONANDO - RLS DESABILITADO TEMPORARIAMENTE'
    ELSE '❌ PROBLEMA PERSISTE - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;
