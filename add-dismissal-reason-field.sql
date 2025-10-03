-- Adicionar campo dismissal_reason à tabela profiles
-- Este script adiciona o campo para armazenar o motivo do desligamento

-- 1. Verificar se existe um enum user_status
SELECT 
    'Verificando enum user_status:' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_status'
ORDER BY e.enumsortorder;

-- 2. Adicionar valor 'desligamento' ao enum user_status se ele existir
DO $$
BEGIN
    -- Verificar se o enum user_status existe
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        -- Verificar se o valor 'desligamento' já existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e 
            JOIN pg_type t ON e.enumtypid = t.oid 
            WHERE t.typname = 'user_status' AND e.enumlabel = 'desligamento'
        ) THEN
            -- Adicionar o valor 'desligamento' ao enum
            ALTER TYPE user_status ADD VALUE 'desligamento';
            RAISE NOTICE 'Valor "desligamento" adicionado ao enum user_status';
        ELSE
            RAISE NOTICE 'Valor "desligamento" já existe no enum user_status';
        END IF;
    ELSE
        RAISE NOTICE 'Enum user_status não encontrado - a coluna status provavelmente é TEXT';
    END IF;
END $$;

-- 3. Adicionar campo dismissal_reason (motivo do desligamento)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dismissal_reason TEXT;

-- 4. Verificar se o campo foi adicionado
SELECT 
    'Campo dismissal_reason adicionado:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name = 'dismissal_reason';

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

-- 6. Verificar se há registros com status 'desligamento'
SELECT 
    'Registros com status desligamento:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status = 'desligamento';

-- 7. Verificar registros com dismissal_reason preenchido
SELECT 
    'Registros com motivo de desligamento:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE dismissal_reason IS NOT NULL AND dismissal_reason != ''; 