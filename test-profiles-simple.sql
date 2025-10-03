-- Script simples para testar acesso aos perfis
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantos perfis existem no total
SELECT COUNT(*) as total_profiles FROM profiles;

-- 2. Verificar perfis por status
SELECT status, COUNT(*) as count 
FROM profiles 
GROUP BY status;

-- 3. Verificar perfis por role
SELECT role, COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- 4. Verificar perfis ativos com role admin ou superuser
SELECT id, first_name, role, status 
FROM profiles 
WHERE status = 'active' 
AND (role = 'admin' OR role = 'superuser')
ORDER BY first_name;

-- 5. Verificar todos os grupos
SELECT id, name, primary_leader, secondary_leader, status 
FROM groups 
ORDER BY name;

-- 6. Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'groups')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 7. Verificar políticas RLS na tabela profiles
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. Testar query exata usada no código
SELECT id, first_name, role
FROM profiles
WHERE status = 'active'
AND (role = 'admin' OR role = 'superuser')
ORDER BY first_name; 