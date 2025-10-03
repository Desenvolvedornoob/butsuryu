-- Verificar estrutura da tabela requests
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'requests'
ORDER BY ordinal_position;

-- Verificar se existe factory_id
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'requests' 
            AND column_name = 'factory_id'
        ) THEN 'factory_id existe'
        ELSE 'factory_id NÃO existe'
    END as status_factory_id;

-- Verificar estrutura da tabela profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
