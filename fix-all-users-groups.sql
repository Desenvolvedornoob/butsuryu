-- Corrigir TODOS os usuários que estão com group_name null
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar quantos usuários estão com group_name null
SELECT COUNT(*) as usuarios_sem_grupo
FROM profiles 
WHERE group_name IS NULL;

-- 2. Ver quais usuários estão sem grupo
SELECT id, first_name, group_name, factory_id, role 
FROM profiles 
WHERE group_name IS NULL;

-- 3. Atualizar TODOS os usuários sem grupo
-- Assumindo que todos são da fábrica Nishiazai (factory_id: 5ac85ce0-6594-4ffc-ad9f-64e78e1aba33)
UPDATE profiles 
SET group_name = 'Grupo 4'
WHERE group_name IS NULL 
AND factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33';

-- 4. Para usuários de outras fábricas, definir grupo padrão
UPDATE profiles 
SET group_name = 'Grupo 1'
WHERE group_name IS NULL 
AND factory_id != '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33';

-- 5. Verificar se todos foram atualizados
SELECT id, first_name, group_name, factory_id, role 
FROM profiles 
WHERE group_name IS NULL;
