-- Script final de verificação do sistema
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar roles existentes (deve mostrar apenas admin, funcionario, superuser)
SELECT 
  'ROLES_EXISTENTES' as verificacao,
  role,
  COUNT(*) as quantidade
FROM public.profiles 
GROUP BY role
ORDER BY role;

-- 2. Verificar se existe superuser ativo
SELECT 
  'SUPERUSER_ATIVO' as verificacao,
  id,
  first_name || ' ' || last_name as nome,
  role,
  status
FROM public.profiles 
WHERE role = 'superuser' AND status = 'active';

-- 3. Verificar políticas RLS para time_off
SELECT 
  'POLITICAS_TIME_OFF' as verificacao,
  policyname,
  cmd as operacao,
  CASE 
    WHEN qual LIKE '%superuser%' THEN 'SUPERUSER_INCLUIDO'
    ELSE 'SUPERUSER_NAO_INCLUIDO'
  END as status_superuser
FROM pg_policies 
WHERE tablename = 'time_off'
ORDER BY cmd;

-- 4. Verificar políticas RLS para requests
SELECT 
  'POLITICAS_REQUESTS' as verificacao,
  policyname,
  cmd as operacao,
  CASE 
    WHEN qual LIKE '%superuser%' THEN 'SUPERUSER_INCLUIDO'
    ELSE 'SUPERUSER_NAO_INCLUIDO'
  END as status_superuser
FROM pg_policies 
WHERE tablename = 'requests'
ORDER BY cmd;

-- 5. Teste de acesso (execute logado como superuser)
/*
SELECT 
  'TESTE_ACESSO' as verificacao,
  'time_off' as tabela,
  COUNT(*) as registros_visiveis
FROM public.time_off
UNION ALL
SELECT 
  'TESTE_ACESSO' as verificacao,
  'requests' as tabela,
  COUNT(*) as registros_visiveis
FROM public.requests;
*/

-- 6. Verificar se RLS está habilitado
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('time_off', 'requests', 'profiles')
AND schemaname = 'public'
ORDER BY tablename; 