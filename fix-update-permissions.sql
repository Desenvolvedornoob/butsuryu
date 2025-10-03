-- Script para corrigir permissões de atualização na tabela profiles

-- 1. Verificar políticas RLS existentes para UPDATE
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE';

-- 2. Criar política de atualização para administradores (se não existir)
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'admin_update_profiles'
    ) THEN
        -- Criar política de atualização para admins
        EXECUTE 'CREATE POLICY admin_update_profiles ON profiles
                FOR UPDATE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM profiles p 
                        WHERE p.id = auth.uid() 
                        AND p.role = ''admin''
                    )
                )
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM profiles p 
                        WHERE p.id = auth.uid() 
                        AND p.role = ''admin''
                    )
                )';
        
        RAISE NOTICE 'Política admin_update_profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Política admin_update_profiles já existe';
    END IF;
END $$;

-- 3. Criar política de atualização para superusers (se não existir)
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'superuser_update_profiles'
    ) THEN
        -- Criar política de atualização para superusers
        EXECUTE 'CREATE POLICY superuser_update_profiles ON profiles
                FOR UPDATE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM profiles p 
                        WHERE p.id = auth.uid() 
                        AND p.role = ''superuser''
                    )
                )
                WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM profiles p 
                        WHERE p.id = auth.uid() 
                        AND p.role = ''superuser''
                    )
                )';
        
        RAISE NOTICE 'Política superuser_update_profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Política superuser_update_profiles já existe';
    END IF;
END $$;

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 5. Verificar políticas após a criação
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE'
ORDER BY policyname; 