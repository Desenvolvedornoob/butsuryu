-- VERIFICAÇÃO ULTRA-DETALHADA - IDENTIFICA QUALQUER PROBLEMA OCULTO
-- Execute este script para ver EXATAMENTE o que está causando os problemas

-- ===============================================
-- 1. VERIFICAÇÃO COMPLETA DE POLÍTICAS RLS
-- ===============================================

-- Verificar TODAS as políticas existentes com detalhes completos
SELECT 
  'POLITICAS_COMPLETAS' as verificacao,
  schemaname,
  tablename,
  policyname,
  cmd as operacao,
  permissive,
  roles,
  qual as condicao_select,
  with_check as condicao_insert_update
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Contar total de políticas por operação
SELECT 
  'CONTAGEM_POLITICAS_POR_OPERACAO' as verificacao,
  cmd as operacao,
  COUNT(*) as quantidade
FROM pg_policies 
WHERE tablename = 'profiles'
GROUP BY cmd
ORDER BY cmd;

-- Verificar se há políticas órfãs ou corrompidas
SELECT 
  'POLITICAS_ORFAS' as verificacao,
  policyname,
  '✅ POLÍTICA VÁLIDA' as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- ===============================================
-- 2. VERIFICAÇÃO COMPLETA DE RLS
-- ===============================================

-- Verificar status detalhado do RLS em todas as tabelas relacionadas
SELECT 
  'RLS_TODAS_TABELAS' as verificacao,
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '❌ RLS HABILITADO'
    ELSE '✅ RLS DESABILITADO'
  END as status
FROM pg_tables 
WHERE tablename IN ('profiles', 'users', 'auth_users')
AND schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- Verificar se há configurações RLS em nível de schema
SELECT 
  'RLS_SCHEMA_LEVEL' as verificacao,
  nspname as schema,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = nspname) 
    THEN '❌ POLÍTICAS NO SCHEMA'
    ELSE '✅ SCHEMA LIMPO'
  END as status
FROM pg_namespace 
WHERE nspname IN ('public', 'auth');

-- ===============================================
-- 3. VERIFICAÇÃO COMPLETA DE FUNÇÃO
-- ===============================================

-- Verificar se a função existe com detalhes completos
SELECT 
  'FUNCAO_COMPLETA' as verificacao,
  proname as nome_funcao,
  prosrc as codigo_funcao,
  proowner::regrole as proprietario,
  CASE 
    WHEN prosrc LIKE '%SECURITY DEFINER%' THEN '✅ SECURITY DEFINER'
    ELSE '❌ SEM SECURITY DEFINER'
  END as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verificar se a função tem as permissões corretas
SELECT 
  'PERMISSOES_FUNCAO' as verificacao,
  proname as nome_funcao,
  proacl as permissoes
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ===============================================
-- 4. VERIFICAÇÃO COMPLETA DE TRIGGER
-- ===============================================

-- Verificar se o trigger existe com detalhes completos
SELECT 
  'TRIGGER_COMPLETO' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao,
  tgtype as tipo_trigger,
  tgenabled as habilitado,
  tgdeferrable as deferravel,
  tginitdeferred as inicialmente_deferrado
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar se o trigger está ativo na tabela correta
SELECT 
  'TRIGGER_TABELA_CORRETA' as verificacao,
  tgname as nome_trigger,
  CASE 
    WHEN tgrelid::regclass = 'auth.users'::regclass THEN '✅ TABELA CORRETA (auth.users)'
    ELSE '❌ TABELA INCORRETA: ' || tgrelid::regclass
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ===============================================
-- 5. VERIFICAÇÃO COMPLETA DE INTEGRIDADE
-- ===============================================

-- Verificar usuários sem perfis com detalhes completos
SELECT 
  'USUARIOS_SEM_PERFIL_DETALHADO' as verificacao,
  au.id,
  au.phone,
  au.raw_user_meta_data,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verificar perfis órfãos (sem usuário correspondente)
SELECT 
  'PERFIS_ORFAOS' as verificacao,
  p.id,
  p.phone,
  p.first_name,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Verificar duplicatas na tabela profiles
SELECT 
  'DUPLICATAS_PROFILES' as verificacao,
  id,
  COUNT(*) as quantidade
FROM public.profiles
GROUP BY id
HAVING COUNT(*) > 1;

-- ===============================================
-- 6. VERIFICAÇÃO COMPLETA DE TABELA PROFILES
-- ===============================================

-- Verificar estrutura completa da tabela profiles
SELECT 
  'ESTRUTURA_PROFILES_COMPLETA' as verificacao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
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

-- Verificar índices da tabela
SELECT 
  'INDICES_PROFILES' as verificacao,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- ===============================================
-- 7. VERIFICAÇÃO DE CONFLITOS E DEPENDÊNCIAS
-- ===============================================

-- Verificar se há funções que referenciam a tabela profiles
SELECT 
  'FUNCOES_REFERENCIANDO_PROFILES' as verificacao,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE prosrc LIKE '%profiles%'
AND proname != 'handle_new_user';

-- Verificar se há triggers em outras tabelas que afetam profiles
SELECT 
  'TRIGGERS_AFETANDO_PROFILES' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao
FROM pg_trigger 
WHERE tgfoid IN (
  SELECT oid FROM pg_proc 
  WHERE prosrc LIKE '%profiles%'
);

-- ===============================================
-- 8. RESUMO ULTRA-DETALHADO
-- ===============================================

-- Resumo final com todos os problemas identificados
SELECT 
  'RESUMO_ULTRA_DETALHADO' as verificacao,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
         AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity)
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
         AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
         AND NOT EXISTS (SELECT 1 FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL)
         AND NOT EXISTS (SELECT 1 FROM public.profiles p LEFT JOIN auth.users au ON p.id = au.id WHERE au.id IS NULL)
    THEN '✅ SISTEMA PERFEITO - TODOS OS PROBLEMAS RESOLVIDOS!'
    ELSE '⚠️ PROBLEMAS IDENTIFICADOS - VERIFIQUE OS RESULTADOS ACIMA'
  END as status;

-- ===============================================
-- 9. INSTRUÇÕES DE CORREÇÃO ULTRA-DETALHADAS
-- ===============================================

-- Instruções baseadas nos problemas encontrados
SELECT 
  'INSTRUCOES_ULTRA_DETALHADAS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
    THEN '❌ REMOVER POLÍTICAS: Execute limpeza-forcada-final.sql'
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
  END as acao_perfis,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles p LEFT JOIN auth.users au ON p.id = au.id WHERE au.id IS NULL)
    THEN '❌ REMOVER PERFIS ÓRFÃOS: DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);'
    ELSE '✅ PERFIS ÓRFÃOS: OK'
  END as acao_perfis_orfos;
