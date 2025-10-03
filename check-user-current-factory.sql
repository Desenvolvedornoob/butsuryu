-- Verificar fábrica atual do usuário
SELECT 
    p.id,
    p.first_name,
    p.group_name,
    p.factory_id,
    f.name as factory_name
FROM profiles p
LEFT JOIN factories f ON p.factory_id = f.id
WHERE p.id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Verificar todas as fábricas e seus grupos
SELECT 
    f.id,
    f.name,
    f.groups
FROM factories f
ORDER BY f.name;
