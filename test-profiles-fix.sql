-- Script de teste para corrigir problemas com profiles
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- VERIFICAR ESTRUTURA ATUAL
-- ===============================================

-- Verificar se a tabela profiles existe
SELECT 
  'TABELA_PROFILES' as verificacao,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Verificar colunas da tabela profiles
SELECT 
  'COLUNAS_PROFILES' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar se a tabela auth.users existe e suas colunas
SELECT 
  'COLUNAS_AUTH_USERS' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name IN ('id', 'phone', 'raw_user_meta_data')
ORDER BY column_name;

-- ===============================================
-- CRIAR FUNÇÃO SIMPLES DE TESTE
-- ===============================================

-- Remover função existente se houver
DROP FUNCTION IF EXISTS public.create_profiles_table();

-- Criar função simples para teste
CREATE OR REPLACE FUNCTION public.create_profiles_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil básico sem usar raw_user_meta_data
  INSERT INTO public.profiles (
    id, 
    phone, 
    first_name, 
    last_name, 
    role, 
    status
  )
  VALUES (
    NEW.id,
    NEW.phone,
    NULL, -- first_name será NULL por enquanto
    NULL, -- last_name será NULL por enquanto
    'funcionario'::user_role,
    'active'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se houver erro, apenas retornar NEW sem fazer nada
    RAISE NOTICE 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- CRIAR TRIGGER
-- ===============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profiles_table();

-- ===============================================
-- VERIFICAÇÃO
-- ===============================================

-- Verificar se a função foi criada
SELECT 
  'FUNCAO_TESTE' as verificacao,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'create_profiles_table';

-- Verificar se o trigger foi criado
SELECT 
  'TRIGGER_TESTE' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar políticas RLS na tabela profiles
SELECT 
  'RLS_PROFILES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'; 