-- Verificar configurações de turnos atuais
SELECT 
    fsc.id,
    fsc.factory_id,
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY f.name, fsc.turno;
