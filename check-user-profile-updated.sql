-- Verificar se o perfil do usuário foi atualizado
SELECT 
    p.id,
    p.first_name,
    p.group_name,
    p.factory_id,
    f.name as factory_name
FROM profiles p
LEFT JOIN factories f ON p.factory_id = f.id
WHERE p.id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
