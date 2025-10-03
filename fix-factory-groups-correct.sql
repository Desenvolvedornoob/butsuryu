-- Corrigir configurações de turnos por fábrica
-- Nishiazai: Grupos 4 e 5
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 4', 'Grupo 5']
WHERE factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33' AND turno = 1;

UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 4', 'Grupo 5']
WHERE factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33' AND turno = 2;

-- Eguti/Heisaka: Grupos 1, 2 e 3
-- Primeiro, vamos ver quais fábricas existem
SELECT id, name FROM factories WHERE name ILIKE '%eguti%' OR name ILIKE '%heisaka%';

-- Atualizar configurações para Eguti/Heisaka (substitua o ID correto)
-- UPDATE factory_shift_config 
-- SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
-- WHERE factory_id = 'ID_DA_FABRICA_EGUTI_HEISAKA' AND turno = 1;

-- UPDATE factory_shift_config 
-- SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
-- WHERE factory_id = 'ID_DA_FABRICA_EGUTI_HEISAKA' AND turno = 2;

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
