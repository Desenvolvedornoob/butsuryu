-- Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Criar política de exclusão para administradores
DO $$
BEGIN
    -- Verificar se a política já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'admin_delete_profiles'
    ) THEN
        -- Criar política de exclusão para admins
        EXECUTE 'CREATE POLICY admin_delete_profiles ON profiles
                FOR DELETE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM profiles 
                        WHERE id = auth.uid() 
                        AND role = ''admin''
                    )
                )';
        
        RAISE NOTICE 'Política admin_delete_profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Política admin_delete_profiles já existe';
    END IF;
END $$;

-- Verificar se a política foi criada
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'admin_delete_profiles';

-- Listar todas as políticas de DELETE na tabela profiles
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'DELETE'; 