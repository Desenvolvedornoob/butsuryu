-- Script para corrigir foreign keys entre tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a foreign key existe entre time_off e profiles
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema='public'
AND tc.table_name = 'time_off'
AND kcu.column_name = 'user_id';

-- 2. Adicionar foreign key entre time_off.user_id e profiles.id se não existir
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_off_user_id_fkey' 
        AND table_name = 'time_off'
    ) THEN
        -- Adicionar a foreign key
        ALTER TABLE public.time_off 
        ADD CONSTRAINT time_off_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key time_off_user_id_fkey adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key time_off_user_id_fkey já existe';
    END IF;
END $$;

-- 3. Adicionar foreign key entre requests.user_id e profiles.id se não existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'requests_user_id_fkey' 
            AND table_name = 'requests'
        ) THEN
            ALTER TABLE public.requests 
            ADD CONSTRAINT requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key requests_user_id_fkey adicionada com sucesso';
        ELSE
            RAISE NOTICE 'Foreign key requests_user_id_fkey já existe';
        END IF;
    END IF;
END $$;

-- 4. Adicionar foreign keys para approved_by e rejected_by se não existirem
DO $$
BEGIN
    -- time_off.approved_by -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_off_approved_by_fkey' 
        AND table_name = 'time_off'
    ) THEN
        ALTER TABLE public.time_off 
        ADD CONSTRAINT time_off_approved_by_fkey 
        FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key time_off_approved_by_fkey adicionada com sucesso';
    END IF;
    
    -- time_off.rejected_by -> profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_off_rejected_by_fkey' 
        AND table_name = 'time_off'
    ) THEN
        ALTER TABLE public.time_off 
        ADD CONSTRAINT time_off_rejected_by_fkey 
        FOREIGN KEY (rejected_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key time_off_rejected_by_fkey adicionada com sucesso';
    END IF;
END $$;

-- 5. Verificar todas as foreign keys criadas
SELECT 
    'FOREIGN_KEYS_CRIADAS' as info,
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema='public'
AND tc.table_name IN ('time_off', 'requests')
ORDER BY tc.table_name, kcu.column_name; 