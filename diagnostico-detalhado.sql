-- DIAGNÓSTICO DETALHADO - IDENTIFICA CADA PROBLEMA ESPECÍFICO
-- Execute este script para ver exatamente o que está causando os problemas

-- ===============================================
-- 1. DIAGNÓSTICO DE POLÍTICAS RLS
-- ===============================================

-- Verificar TODAS as políticas existentes
SELECT 
  'DIAGNOSTICO_POLITICAS' as verificacao,
  policyname,
  cmd as operacao,
  permissive,
  roles,
  'POLÍTICA ENCONTRADA' as status
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
-- 2. DIAGNÓSTICO DE RLS
-- ===============================================

-- Verificar status detalhado do RLS
SELECT 
  'DIAGNOSTICO_RLS' as verificacao,
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '❌ RLS HABILITADO - PROBLEMA!'
    ELSE '✅ RLS DESABILITADO - OK!'
  END as status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- ===============================================
-- 3. DIAGNÓSTICO DE FUNÇÃO
-- ===============================================

-- Verificar se a função existe
SELECT 
  'DIAGNOSTICO_FUNCAO' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ FUNÇÃO EXISTE'
    ELSE '❌ FUNÇÃO NÃO EXISTE'
  END as status;

-- Se a função existir, mostrar detalhes
SELECT 
  'DETALHES_FUNCAO' as verificacao,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ===============================================
-- 4. DIAGNÓSTICO DE TRIGGER
-- ===============================================

-- Verificar se o trigger existe
SELECT 
  'DIAGNOSTICO_TRIGGER' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ TRIGGER EXISTE'
    ELSE '❌ TRIGGER NÃO EXISTE'
  END as status;

-- Se o trigger existir, mostrar detalhes
SELECT 
  'DETALHES_TRIGGER' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ===============================================
-- 5. DIAGNÓSTICO DE INTEGRIDADE
-- ===============================================

-- Verificar usuários sem perfis
SELECT 
  'DIAGNOSTICO_USUARIOS_SEM_PERFIL' as verificacao,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS OS USUÁRIOS TÊM PERFIS'
    ELSE '❌ EXISTEM ' || COUNT(*) || ' USUÁRIOS SEM PERFIL'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Se houver usuários sem perfil, mostrar detalhes
SELECT 
  'DETALHES_USUARIOS_SEM_PERFIL' as verificacao,
  au.id,
  au.phone,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 6. DIAGNÓSTICO DE TABELA PROFILES
-- ===============================================

-- Verificar estrutura da tabela profiles
SELECT 
  'ESTRUTURA_TABELA_PROFILES' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros na tabela profiles
SELECT 
  'TOTAL_REGISTROS_PROFILES' as verificacao,
  COUNT(*) as quantidade
FROM public.profiles;

-- ===============================================
-- 7. RESUMO DO DIAGNÓSTICO
-- ===============================================

-- Resumo final com todos os problemas identificados
SELECT 
  'RESUMO_DIAGNOSTICO' as verificacao,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
         AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity)
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
         AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
         AND NOT EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL)
    THEN '✅ SISTEMA PERFEITO - TODOS OS PROBLEMAS RESOLVIDOS!'
    ELSE '⚠️ PROBLEMAS IDENTIFICADOS - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;

-- ===============================================
-- 8. INSTRUÇÕES PARA CORREÇÃO
-- ===============================================

-- Instruções baseadas nos problemas encontrados
SELECT 
  'INSTRUCOES_CORRECAO' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
    THEN '❌ REMOVER POLÍTICAS: Execute cleanup-all-policies.sql'
    ELSE '✅ POLÍTICAS: OK'
  END as acao_politicas,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity)
    THEN '❌ DESABILITAR RLS: Execute ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    ELSE '✅ RLS: OK'
  END as acao_rls,
  
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '❌ CRIAR FUNÇÃO: Execute fix-user-creation-rls.sql'
    ELSE '✅ FUNÇÃO: OK'
  END as acao_funcao,
  
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '❌ CRIAR TRIGGER: Execute fix-user-creation-rls.sql'
    ELSE '✅ TRIGGER: OK'
  END as acao_trigger,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL)
    THEN '❌ CRIAR PERFIS: Execute fix-missing-profile.sql'
    ELSE '✅ PERFIS: OK'
  END as acao_perfis;
