-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se as colunas group_name e factory_id existem
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'group_name'
  ) THEN 'group_name existe' ELSE 'group_name NÃO existe' END as group_name_status,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'factory_id'
  ) THEN 'factory_id existe' ELSE 'factory_id NÃO existe' END as factory_id_status;

-- Verificar dados de exemplo na tabela profiles
SELECT id, first_name, group_name, factory_id, role, status
FROM profiles 
LIMIT 5;
