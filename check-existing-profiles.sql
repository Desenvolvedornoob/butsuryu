-- Script para verificar profiles existentes
-- Execute este script no SQL Editor do Supabase para ver os usuários existentes

-- Ver todos os profiles existentes
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
ORDER BY created_at DESC;

-- Ver quantos usuários de cada role existem
SELECT 
  role,
  COUNT(*) as quantidade
FROM public.profiles 
GROUP BY role
ORDER BY quantidade DESC;

-- Ver especificamente usuários que podem aprovar solicitações
SELECT 
  id,
  first_name || ' ' || last_name as nome_completo,
  role,
  status
FROM public.profiles 
WHERE role IN ('admin', 'superuser')
ORDER BY role, first_name; 