-- Verificar dados das configurações de turnos
SELECT 
    fsc.id,
    fsc.factory_id,
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.turno;

-- Verificar se existem configurações para a fábrica do usuário
SELECT 
    p.group_name,
    p.factory_id,
    f.name as factory_name,
    fsc.turno,
    fsc.groups
FROM profiles p
LEFT JOIN factories f ON p.factory_id = f.id
LEFT JOIN factory_shift_config fsc ON fsc.factory_id = p.factory_id
WHERE p.id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
