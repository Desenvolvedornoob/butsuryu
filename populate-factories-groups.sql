-- Popular grupos nas fábricas existentes
UPDATE factories 
SET groups = ARRAY['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H']
WHERE groups IS NULL OR array_length(groups, 1) IS NULL;

-- Verificar o resultado
SELECT id, name, groups 
FROM factories 
ORDER BY name;
