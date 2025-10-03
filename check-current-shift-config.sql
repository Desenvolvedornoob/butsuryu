-- Verificar configuração atual dos turnos
SELECT 
    fsc.id,
    f.name as factory_name,
    fsc.turno,
    fsc.groups
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
WHERE fsc.factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33'  -- Nishiazai
ORDER BY fsc.turno;
