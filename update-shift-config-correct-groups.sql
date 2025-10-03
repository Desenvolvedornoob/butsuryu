-- Atualizar configurações de turnos com os grupos corretos
-- Turno 1 (semana ímpar) - grupos que trabalham de manhã nas semanas ímpares
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
WHERE turno = 1;

-- Turno 2 (semana par) - grupos que trabalham de manhã nas semanas pares
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo 4', 'Grupo 5']
WHERE turno = 2;

-- Verificar o resultado
SELECT 
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.turno;
