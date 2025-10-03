-- Script para verificar e corrigir permissões de exclusão na tabela profiles

-- 1. Verificar políticas RLS existentes
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

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Criar política de exclusão para administradores (se não existir)
-- Esta política permite que usuários com role 'admin' excluam qualquer perfil
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

-- 4. Verificar se a política foi criada
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

-- 5. Testar se um admin pode excluir um perfil
-- (Execute isso como admin para testar)
-- DELETE FROM profiles WHERE id = 'test-id' RETURNING *; 