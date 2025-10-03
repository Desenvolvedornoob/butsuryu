-- Criar configurações de turnos para Heisaka\Eguti
-- Heisaka\Eguti: Grupos 1, 2 e 3
INSERT INTO factory_shift_config (factory_id, turno, groups)
VALUES 
    ('4d2276d1-9e76-4724-b9f6-47f2984e8bf2', 1, ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']),
    ('4d2276d1-9e76-4724-b9f6-47f2984e8bf2', 2, ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3'])
ON CONFLICT (factory_id, turno) DO UPDATE SET
    groups = EXCLUDED.groups,
    updated_at = NOW();

-- Verificar o resultado
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
