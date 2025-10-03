-- Restaurar coluna groups na tabela factories
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

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'factories' 
AND column_name = 'groups';
