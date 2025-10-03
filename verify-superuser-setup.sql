-- Script para verificar configuração do superuser
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existe superuser
SELECT 
  id,
  first_name,
  last_name,
  role,
  status,
  department,
  factory_id,
  created_at
FROM public.profiles 
WHERE role = 'superuser'
ORDER BY created_at DESC;

-- 2. Verificar todas as roles disponíveis (deve mostrar apenas admin, funcionario, superuser)
SELECT 
  role,
  COUNT(*) as quantidade,
  STRING_AGG(first_name || ' ' || last_name, ', ') as usuarios
FROM public.profiles 
GROUP BY role
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1
    WHEN 'superuser' THEN 2 
    WHEN 'funcionario' THEN 3
    ELSE 4
  END;

-- 3. Verificar usuários que podem aprovar solicitações (admin e superuser)
SELECT 
  id,
  first_name || ' ' || last_name as nome_completo,
  role,
  status,
  'PODE APROVAR SOLICITAÇÕES' as permissao
FROM public.profiles 
WHERE role IN ('admin', 'superuser')
ORDER BY role, first_name;

-- 4. Verificar políticas RLS existentes para tabelas de solicitações
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('time_off', 'requests', 'profiles')
ORDER BY tablename, policyname;

-- 5. Verificar se RLS está habilitado nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('time_off', 'requests', 'profiles')
AND schemaname = 'public';

-- 6. Teste de permissões (execute este comando logado como superuser)
-- Esta query deve retornar todas as solicitações se o superuser tiver permissões corretas
/*
SELECT 
  'time_off' as tabela,
  COUNT(*) as total_registros
FROM public.time_off
UNION ALL
SELECT 
  'requests' as tabela,
  COUNT(*) as total_registros
FROM public.requests
UNION ALL
SELECT 
  'profiles' as tabela,
  COUNT(*) as total_registros
FROM public.profiles;
*/ 