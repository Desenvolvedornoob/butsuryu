-- Adicionar campo city à tabela profiles
-- Este script adiciona o campo para armazenar a cidade onde o funcionário mora

-- 1. Adicionar campo city (cidade onde mora)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Verificar se o campo foi adicionado
SELECT 
    'Campo city adicionado:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name = 'city';

-- 3. Verificar estrutura atual da tabela
SELECT 
    'Estrutura completa da tabela profiles:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se há registros com cidade preenchida
SELECT 
    'Registros com cidade preenchida:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE city IS NOT NULL AND city != '';

-- 5. Verificar alguns exemplos de cidades (se houver)
SELECT 
    'Exemplos de cidades:' as info,
    city,
    COUNT(*) as quantidade_funcionarios
FROM public.profiles 
WHERE city IS NOT NULL AND city != ''
GROUP BY city
ORDER BY quantidade_funcionarios DESC
LIMIT 10; 