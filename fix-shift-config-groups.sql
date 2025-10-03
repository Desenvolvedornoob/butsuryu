-- Corrigir configuração dos grupos para turnos diferentes
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 4']
WHERE factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33' 
  AND turno = 1;

UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 5']
WHERE factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33' 
  AND turno = 2;

-- Verificar o resultado
SELECT 
    fsc.id,
    f.name as factory_name,
    fsc.turno,
    fsc.groups
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
WHERE fsc.factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33'
ORDER BY fsc.turno;
