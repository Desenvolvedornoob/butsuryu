-- Verificar estrutura atual da tabela factory_shift_config
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'factory_shift_config' 
ORDER BY ordinal_position;
