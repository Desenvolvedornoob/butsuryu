-- DIAGNÓSTICO COMPLETO - TRIGGER NÃO ESTÁ FUNCIONANDO
-- Execute este script para descobrir por que o trigger não está criando perfis

-- ===============================================
-- 1. VERIFICAR STATUS DO TRIGGER
-- ===============================================

-- Verificar se trigger existe
SELECT 
  'TRIGGER_EXISTE' as verificacao,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SIM - TRIGGER EXISTE'
    ELSE 'NAO - TRIGGER NAO EXISTE'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar detalhes do trigger
SELECT 
  'DETALHES_TRIGGER' as verificacao,
  t.tgname as nome_trigger,
  t.tgenabled as habilitado,
  CASE t.tgenabled
    WHEN 'O' THEN 'ATIVO'
    WHEN 'D' THEN 'DESABILITADO'
    ELSE 'ESTADO_DESCONHECIDO'
  END as status_trigger,
  c.relname as tabela_alvo
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE t.tgname = 'on_auth_user_created';

-- ===============================================
-- 2. VERIFICAR FUNÇÃO DO TRIGGER
-- ===============================================

-- Verificar se função existe
SELECT 
  'FUNCAO_EXISTE' as verificacao,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SIM - FUNCAO EXISTE'
    ELSE 'NAO - FUNCAO NAO EXISTE'
  END as status
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verificar código da função
SELECT 
  'CODIGO_FUNCAO' as verificacao,
  p.proname as nome_funcao,
  pg_get_functiondef(p.oid) as codigo_completo
FROM pg_proc p 
WHERE p.proname = 'handle_new_user'
LIMIT 1;

-- ===============================================
-- 3. VERIFICAR USUÁRIOS RECENTES SEM PERFIL
-- ===============================================

-- Buscar usuários recentes que NÃO têm perfil
SELECT 
  'USUARIOS_SEM_PERFIL' as verificacao,
  u.id,
  u.phone,
  u.raw_user_meta_data->>'first_name' as nome,
  u.raw_user_meta_data->>'name_japanese' as nome_japones,
  u.created_at,
  'SEM_PERFIL' as problema
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC;

-- ===============================================
-- 4. VERIFICAR PERMISSÕES E SEGURANÇA
-- ===============================================

-- Verificar se a função tem SECURITY DEFINER
SELECT 
  'SEGURANCA_FUNCAO' as verificacao,
  p.proname as nome_funcao,
  p.prosecdef as security_definer,
  CASE p.prosecdef
    WHEN true THEN 'SIM - TEM SECURITY DEFINER'
    WHEN false THEN 'NAO - SEM SECURITY DEFINER'
  END as status_seguranca
FROM pg_proc p 
WHERE p.proname = 'handle_new_user';

-- ===============================================
-- 5. VERIFICAR LOGS DE ERRO (se disponível)
-- ===============================================

-- Tentar verificar se há erros de constraint
SELECT 
  'VERIFICACAO_CONSTRAINTS' as verificacao,
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  'PODE_ESTAR_BLOQUEANDO_INSERCAO' as observacao
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'profiles'
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK');

-- ===============================================
-- 6. TESTE MANUAL DO TRIGGER (SIMULAÇÃO)
-- ===============================================

-- Simular inserção para ver se function é chamada
-- ATENÇÃO: Esta consulta é apenas para mostrar como seria chamada
SELECT 
  'SIMULACAO_TRIGGER' as verificacao,
  'handle_new_user()' as funcao_que_seria_chamada,
  'AFTER INSERT ON auth.users' as evento_trigger,
  'Esta consulta é apenas informativa' as nota;

-- ===============================================
-- 7. VERIFICAR ESTRUTURA DA TABELA PROFILES
-- ===============================================

-- Verificar se tabela profiles tem todos os campos necessários
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

-- ===============================================
-- 8. RESULTADO DO DIAGNÓSTICO
-- ===============================================

SELECT 
  'DIAGNOSTICO_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
         AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN 'TRIGGER_E_FUNCAO_EXISTEM_MAS_NAO_FUNCIONAM'
    WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN 'TRIGGER_NAO_EXISTE'
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN 'FUNCAO_NAO_EXISTE'
    ELSE 'PROBLEMA_DESCONHECIDO'
  END as problema_identificado,
  'Execute fix-name-japanese-trigger.sql para corrigir' as solucao;
