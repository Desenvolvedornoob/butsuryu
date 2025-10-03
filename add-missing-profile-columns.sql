-- Adicionar colunas que podem estar faltando na tabela profiles
DO $$ 
BEGIN
    -- Adicionar coluna group_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'group_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN group_name TEXT;
        COMMENT ON COLUMN profiles.group_name IS 'Nome do grupo do funcionário';
    END IF;

    -- Adicionar coluna factory_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'factory_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN factory_id UUID REFERENCES factories(id);
        COMMENT ON COLUMN profiles.factory_id IS 'ID da fábrica do funcionário';
    END IF;
END $$;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('group_name', 'factory_id')
ORDER BY column_name;
