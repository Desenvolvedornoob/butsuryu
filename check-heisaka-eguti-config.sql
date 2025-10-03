-- Verificar configurações de turnos para Heisaka\Eguti
SELECT 
    fsc.id,
    fsc.factory_id,
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
WHERE fsc.factory_id = '4d2276d1-9e76-4724-b9f6-47f2984e8bf2'
ORDER BY fsc.turno;

-- Verificar se existem configurações para essa fábrica
SELECT COUNT(*) as total_configs
FROM factory_shift_config 
WHERE factory_id = '4d2276d1-9e76-4724-b9f6-47f2984e8bf2';
