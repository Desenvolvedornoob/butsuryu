-- Verificar se a tabela site_texts foi criada
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'site_texts';

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'site_texts'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'site_texts';

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_texts FROM site_texts;

-- Verificar dados existentes (primeiros 5)
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
LIMIT 5;
