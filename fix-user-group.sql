-- Corrigir grupo do usuário que está com group_name null
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar o perfil atual do usuário
SELECT id, first_name, group_name, factory_id, role 
FROM profiles 
WHERE id = 'b3dcef59-d44e-455d-a9ae-865d4fb4a1c5';

-- 2. Atualizar o grupo do usuário (assumindo que é da fábrica Nishiazai)
UPDATE profiles 
SET group_name = 'Grupo 4'
WHERE id = 'b3dcef59-d44e-455d-a9ae-865d4fb4a1c5';

-- 3. Verificar se foi atualizado
SELECT id, first_name, group_name, factory_id, role 
FROM profiles 
WHERE id = 'b3dcef59-d44e-455d-a9ae-865d4fb4a1c5';
