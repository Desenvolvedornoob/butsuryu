-- Adicionar coluna groups na tabela factory_shift_config
DO $$ 
BEGIN
    -- Adicionar coluna groups se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'factory_shift_config' 
        AND column_name = 'groups'
    ) THEN
        ALTER TABLE factory_shift_config ADD COLUMN groups TEXT[] NOT NULL DEFAULT '{}';
        COMMENT ON COLUMN factory_shift_config.groups IS 'Array com nomes dos grupos que trabalham neste turno';
    END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'factory_shift_config' 
ORDER BY ordinal_position;
