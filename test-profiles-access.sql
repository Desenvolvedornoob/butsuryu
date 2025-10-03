-- Script para testar acesso aos perfis e verificar políticas RLS
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todas as políticas RLS na tabela profiles
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
WHERE tablename = 'profiles';

-- 2. Verificar quantos perfis existem no total
SELECT COUNT(*) as total_profiles FROM profiles;

-- 3. Verificar perfis por status
SELECT status, COUNT(*) as count 
FROM profiles 
GROUP BY status;

-- 4. Verificar perfis por role
SELECT role, COUNT(*) as count 
FROM profiles 
GROUP BY role;

-- 5. Verificar perfis ativos com role admin ou superuser
SELECT id, first_name, role, status 
FROM profiles 
WHERE status = 'active' 
AND (role = 'admin' OR role = 'superuser')
ORDER BY first_name;

-- 6. Verificar todos os grupos
SELECT id, name, primary_leader, secondary_leader, status 
FROM groups 
ORDER BY name;

-- 7. Verificar perfis que são líderes de grupos (CORRIGIDO - convertendo para uuid)
SELECT DISTINCT p.id, p.first_name, p.role, p.status
FROM profiles p
INNER JOIN groups g ON (p.id = g.primary_leader::uuid OR p.id = g.secondary_leader::uuid)
WHERE p.status = 'active'
ORDER BY p.first_name;

-- 8. Testar query similar à usada no código
SELECT id, first_name, role
FROM profiles
WHERE status = 'active'
AND (role = 'admin' OR role = 'superuser')
ORDER BY first_name;

-- 9. Verificar se há perfis com status diferente de 'active'
SELECT id, first_name, role, status 
FROM profiles 
WHERE status != 'active'
ORDER BY status, first_name;

-- 10. Verificar estrutura das tabelas para entender os tipos
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'groups')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 11. Verificar se há grupos com primary_leader ou secondary_leader NULL
SELECT 
    name,
    primary_leader,
    secondary_leader,
    CASE 
        WHEN primary_leader IS NULL THEN 'Sem líder primário'
        ELSE 'Com líder primário'
    END as primary_status,
    CASE 
        WHEN secondary_leader IS NULL THEN 'Sem líder secundário'
        ELSE 'Com líder secundário'
    END as secondary_status
FROM groups
ORDER BY name;

-- 12. Verificar perfis que poderiam ser líderes mas não estão atribuídos
SELECT p.id, p.first_name, p.role, p.status
FROM profiles p
WHERE p.status = 'active'
AND (p.role = 'admin' OR p.role = 'superuser')
AND p.id NOT IN (
    SELECT DISTINCT COALESCE(g.primary_leader::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    FROM groups g
    WHERE g.primary_leader IS NOT NULL
    UNION
    SELECT DISTINCT COALESCE(g.secondary_leader::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
    FROM groups g
    WHERE g.secondary_leader IS NOT NULL
)
ORDER BY p.first_name; 