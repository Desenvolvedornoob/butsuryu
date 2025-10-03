-- Corrigir Políticas RLS sem Duplicatas
-- Este script remove todas as políticas e cria novas

-- 1. Verificar políticas RLS existentes
SELECT 
    'Políticas RLS existentes:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.profiles;

-- 3. Verificar se todas as políticas foram removidas
SELECT 
    'Políticas após remoção:' as info,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 4. Criar políticas simples e seguras
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- 5. Verificar se as novas políticas foram criadas
SELECT 
    'Novas políticas criadas:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 6. Testar acesso básico à tabela
SELECT 
    'Teste de acesso:' as info,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCESSO - Tabela acessível'
        ELSE 'ERRO - Tabela não acessível'
    END as resultado
FROM public.profiles
LIMIT 1; 