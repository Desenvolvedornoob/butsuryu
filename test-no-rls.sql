-- Script simples para testar sem RLS
-- Desabilitar RLS na tabela profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public'; 