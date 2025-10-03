-- Criar configurações de turnos para a fábrica do usuário
-- Primeiro, vamos pegar o factory_id do usuário
WITH user_factory AS (
    SELECT factory_id 
    FROM profiles 
    WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112'
)
-- Inserir configurações de turnos se não existirem
INSERT INTO factory_shift_config (factory_id, turno, groups)
SELECT 
    uf.factory_id,
    1,
    ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3']
FROM user_factory uf
WHERE NOT EXISTS (
    SELECT 1 FROM factory_shift_config fsc 
    WHERE fsc.factory_id = uf.factory_id AND fsc.turno = 1
);

-- Inserir configuração do turno 2
WITH user_factory AS (
    SELECT factory_id 
    FROM profiles 
    WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112'
)
INSERT INTO factory_shift_config (factory_id, turno, groups)
SELECT 
    uf.factory_id,
    2,
    ARRAY['Grupo 4', 'Grupo 5']
FROM user_factory uf
WHERE NOT EXISTS (
    SELECT 1 FROM factory_shift_config fsc 
    WHERE fsc.factory_id = uf.factory_id AND fsc.turno = 2
);

-- Verificar o resultado
SELECT 
    fsc.id,
    fsc.factory_id,
    fsc.turno,
    fsc.groups,
    f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.turno;
