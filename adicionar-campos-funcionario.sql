-- Adicionar novos campos à tabela profiles
-- Este script adiciona os campos: name_japanese, birth_date, hire_date

-- 1. Adicionar campo name_japanese (nome em japonês)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name_japanese TEXT;

-- 2. Adicionar campo birth_date (data de nascimento)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 3. Adicionar campo hire_date (data de início na empresa)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- 4. Verificar se os campos foram adicionados
SELECT 
    'Campos adicionados:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('name_japanese', 'birth_date', 'hire_date')
ORDER BY column_name;

-- 5. Verificar estrutura atual da tabela
SELECT 
    'Estrutura completa da tabela profiles:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 