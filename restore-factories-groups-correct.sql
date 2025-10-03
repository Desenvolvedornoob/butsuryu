-- Restaurar coluna groups na tabela factories com os grupos corretos
DO $$ 
BEGIN
    -- Adicionar coluna groups se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'factories' 
        AND column_name = 'groups'
    ) THEN
        ALTER TABLE factories ADD COLUMN groups TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN factories.groups IS 'Array com nomes dos grupos da fábrica';
    END IF;
END $$;

-- Popular grupos corretos nas fábricas existentes
UPDATE factories 
SET groups = ARRAY['Grupo 1', 'Grupo 2', 'Grupo 3', 'Grupo 4', 'Grupo 5']
WHERE groups IS NULL OR array_length(groups, 1) IS NULL;

-- Verificar o resultado
SELECT id, name, groups 
FROM factories 
ORDER BY name;
