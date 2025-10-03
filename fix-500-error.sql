-- Script para corrigir erro 500 ao buscar perfis
-- Passo 1: Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Passo 2: Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Passo 3: Criar políticas simples e funcionais
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Passo 4: Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Passo 5: Verificar se a função create_profiles_table existe e está correta
CREATE OR REPLACE FUNCTION public.create_profiles_table()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, first_name, last_name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'funcionario'),
    'active',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se houver erro, criar perfil básico
    INSERT INTO public.profiles (id, phone, role, status, created_at, updated_at)
    VALUES (NEW.id, NEW.phone, 'funcionario', 'active', NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Passo 6: Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profiles_table();

-- Verificar se tudo está funcionando
SELECT 'RLS Status:' as info, rowsecurity as status FROM pg_tables WHERE tablename = 'profiles';
SELECT 'Policies:' as info, policyname FROM pg_policies WHERE tablename = 'profiles'; 