-- Script para corrigir o enum user_status
-- Este script verifica e adiciona o valor 'desligamento' ao enum user_status

-- 1. Verificar se o enum user_status existe
SELECT 
    'Verificando enum user_status:' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_status'
ORDER BY e.enumsortorder;

-- 2. Se o enum não existir, criar um novo
DO $$
BEGIN
    -- Verificar se o enum user_status existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        -- Criar o enum user_status
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'desligamento');
        RAISE NOTICE 'Enum user_status criado com valores: active, inactive, desligamento';
    ELSE
        RAISE NOTICE 'Enum user_status já existe';
        
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
    END IF;
END $$;

-- 3. Verificar se a coluna status da tabela profiles usa o enum
SELECT 
    'Verificando tipo da coluna status:' as info,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name = 'status';

-- 4. Se a coluna não usar o enum, alterar para usar o enum
DO $$
BEGIN
    -- Verificar se a coluna status usa o enum user_status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND table_schema = 'public'
          AND column_name = 'status'
          AND udt_name != 'user_status'
    ) THEN
        -- Alterar a coluna para usar o enum
        ALTER TABLE public.profiles 
        ALTER COLUMN status TYPE user_status 
        USING status::user_status;
        RAISE NOTICE 'Coluna status alterada para usar o enum user_status';
    ELSE
        RAISE NOTICE 'Coluna status já usa o enum user_status';
    END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
    'Resultado final - enum user_status:' as info,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_status'
ORDER BY e.enumsortorder;

-- 6. Verificar tipo da coluna status
SELECT 
    'Resultado final - coluna status:' as info,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name = 'status'; 