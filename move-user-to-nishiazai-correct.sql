-- Mover usuário para Nishiazai (onde o Grupo 4 existe)
UPDATE profiles 
SET 
  factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33'  -- Nishiazai
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Verificar o resultado
SELECT 
    p.id,
    p.first_name,
    p.group_name,
    p.factory_id,
    f.name as factory_name
FROM profiles p
LEFT JOIN factories f ON p.factory_id = f.id
WHERE p.id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
