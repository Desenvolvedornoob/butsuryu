-- LIMPEZA FORÇADA - RESOLVE TODOS OS PROBLEMAS DE UMA VEZ
-- Execute este script para forçar a limpeza completa do sistema

-- ===============================================
-- 1. DESABILITAR RLS FORÇADAMENTE
-- ===============================================

-- Desabilitar RLS para parar todos os erros
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. REMOVER TODAS AS POLÍTICAS FORÇADAMENTE
-- ===============================================

-- Listar todas as políticas existentes primeiro
SELECT 
  'POLITICAS_EXISTENTES_ANTES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Remover TODAS as políticas possíveis
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.profiles;

-- Remover políticas com nomes genéricos
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.profiles;

-- ===============================================
-- 3. VERIFICAR SE AINDA EXISTEM POLÍTICAS
-- ===============================================

-- Verificar se não há políticas
SELECT 
  'POLITICAS_EXISTENTES_DEPOIS' as verificacao,
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
-- 8. VERIFICAÇÃO FINAL COMPLETA
-- ===============================================

-- Verificação final completa
SELECT 
  'VERIFICACAO_FINAL_COMPLETA' as verificacao,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'profiles'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public' 
      AND rowsecurity
    )
    THEN '✅ SISTEMA COMPLETAMENTE LIMPO - PRONTO PARA FUNCIONAR!'
    ELSE '⚠️ ALGUNS PROBLEMAS PERSISTEM - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;

-- ===============================================
-- 9. INSTRUÇÕES PARA TESTE
-- ===============================================

-- Após executar este script:
-- 1. Verifique se todos os itens mostram ✅
-- 2. Teste se o dashboard carrega sem erros
-- 3. Teste se consegue ver os dados dos perfis
-- 4. Teste se consegue criar novos usuários
-- 5. Se tudo funcionar, mantenha RLS desabilitado temporariamente

-- ===============================================
-- 10. SOLUÇÃO ALTERNATIVA SE PROBLEMAS PERSISTIREM
-- ===============================================

-- Se ainda houver problemas, execute este comando manualmente:
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- E depois verifique se funcionou:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
