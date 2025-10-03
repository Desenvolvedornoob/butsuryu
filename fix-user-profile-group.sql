-- Atualizar perfil do usuário com o grupo correto
UPDATE profiles 
SET 
  group_name = 'Grupo 4',  -- Grupo 4 está no turno 2 (semana par)
  factory_id = (SELECT id FROM factories LIMIT 1)
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
