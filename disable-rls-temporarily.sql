-- Script para desabilitar temporariamente o RLS na tabela profiles
-- ATENÇÃO: Use apenas para testes, não em produção!

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Desabilitar RLS temporariamente (apenas para teste)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 4. Testar uma exclusão (substitua 'ID_DO_FUNCIONARIO' pelo ID real)
-- DELETE FROM profiles WHERE id = 'ID_DO_FUNCIONARIO' RETURNING *;

-- 5. Reabilitar RLS após o teste
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 