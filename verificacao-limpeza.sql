-- VERIFICAÇÃO RÁPIDA APÓS LIMPEZA
-- Execute este script para confirmar que a limpeza funcionou

-- ===============================================
-- 1. VERIFICAÇÃO DE POLÍTICAS
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
-- 2. VERIFICAÇÃO DE RLS
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
-- 3. VERIFICAÇÃO DE FUNÇÃO E TRIGGER
-- ===============================================

-- Verificar se a função existe
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
    END as status;

-- ===============================================
-- 4. VERIFICAÇÃO DE INTEGRIDADE
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
-- 5. RESUMO FINAL
-- ===============================================

-- Resumo do status
SELECT 
  'RESUMO_FINAL' as verificacao,
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
-- 6. INSTRUÇÕES PARA TESTE
-- ===============================================

-- Após confirmar que tudo está limpo:
-- 1. Teste se o dashboard carrega sem erros
-- 2. Teste se consegue ver os dados dos perfis
-- 3. Teste se consegue criar novos usuários
-- 4. Se tudo funcionar, mantenha RLS desabilitado temporariamente
