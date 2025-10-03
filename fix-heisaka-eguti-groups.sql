-- Corrigir configurações de turnos para Heisaka\Eguti
-- Heisaka\Eguti: Grupos 1, 2 e 3
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
WHERE factory_id = '4d2276d1-9e76-4724-b9f6-47f2984e8bf2' AND turno = 1;

UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
WHERE factory_id = '4d2276d1-9e76-4724-b9f6-47f2984e8bf2' AND turno = 2;

-- Verificar o resultado
SELECT 
    fsc.id,
    fsc.factory_id,
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY f.name, fsc.turno;
