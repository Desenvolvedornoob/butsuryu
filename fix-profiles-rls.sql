-- Corrigir políticas RLS para tabela profiles
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- POLÍTICAS PARA TABELA PROFILES
-- ===============================================

-- Remover políticas existentes da tabela profiles (se houver)
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Criar política para SELECT - profiles
CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- O usuário pode ver seu próprio perfil
  id = auth.uid() OR
  -- Ou é admin/superuser (podem ver todos os perfis)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Criar política para INSERT - profiles
CREATE POLICY "profiles_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- O usuário pode criar seu próprio perfil (para o trigger)
  id = auth.uid() OR
  -- Ou é admin (pode criar perfis para outros)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - profiles
CREATE POLICY "profiles_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  -- O usuário pode atualizar seu próprio perfil
  id = auth.uid() OR
  -- Ou é admin (pode atualizar qualquer perfil)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  -- O usuário pode atualizar seu próprio perfil
  id = auth.uid() OR
  -- Ou é admin (pode atualizar qualquer perfil)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para DELETE - profiles
CREATE POLICY "profiles_delete_policy" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  -- O usuário pode deletar seu próprio perfil
  id = auth.uid() OR
  -- Ou é admin (pode deletar qualquer perfil)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===============================================
-- HABILITAR RLS NA TABELA PROFILES
-- ===============================================

-- Garantir que RLS está habilitada
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- VERIFICAR ESTRUTURA DA TABELA AUTH.USERS
-- ===============================================

-- Verificar o tipo da coluna raw_user_meta_data
SELECT 
  'COLUNA_RAW_USER_META_DATA' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name = 'raw_user_meta_data';

-- ===============================================
-- CRIAR FUNÇÃO SEGURA PARA CRIAR PERFIL
-- ===============================================

-- Criar função para criar perfil automaticamente (versão segura)
CREATE OR REPLACE FUNCTION public.create_profiles_table()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val text;
  last_name_val text;
  role_val text;
  status_val text;
  department_val text;
  responsible_val text;
  factory_id_val text;
BEGIN
  -- Extrair dados de forma segura, verificando se é JSON
  BEGIN
    -- Tentar extrair como JSON se a coluna for do tipo correto
    IF NEW.raw_user_meta_data IS NOT NULL THEN
      first_name_val := NEW.raw_user_meta_data->>'first_name';
      last_name_val := NEW.raw_user_meta_data->>'last_name';
      role_val := NEW.raw_user_meta_data->>'role';
      status_val := NEW.raw_user_meta_data->>'status';
      department_val := NEW.raw_user_meta_data->>'department';
      responsible_val := NEW.raw_user_meta_data->>'responsible';
      factory_id_val := NEW.raw_user_meta_data->>'factory_id';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se falhar, usar valores padrão
      first_name_val := NULL;
      last_name_val := NULL;
      role_val := 'funcionario';
      status_val := 'active';
      department_val := NULL;
      responsible_val := NULL;
      factory_id_val := NULL;
  END;

  -- Inserir perfil com valores seguros
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    phone, 
    role, 
    status, 
    department, 
    responsible, 
    factory_id
  )
  VALUES (
    NEW.id,
    first_name_val,
    last_name_val,
    NEW.phone,
    COALESCE(role_val, 'funcionario')::user_role,
    COALESCE(status_val, 'active'),
    department_val,
    responsible_val,
    factory_id_val
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função RPC para criar perfil de funcionário (contorna RLS)
CREATE OR REPLACE FUNCTION public.create_employee_profile(
  user_id uuid,
  user_phone text,
  user_first_name text,
  user_last_name text,
  user_department text,
  user_role user_role,
  user_responsible text,
  user_factory_id text
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    phone, 
    first_name, 
    last_name, 
    department, 
    role, 
    responsible, 
    status, 
    factory_id
  )
  VALUES (
    user_id,
    user_phone,
    user_first_name,
    user_last_name,
    user_department,
    user_role,
    user_responsible,
    'active',
    user_factory_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profiles_table();

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar políticas criadas
SELECT 
  'POLITICAS_CRIADAS' as verificacao,
  policyname,
  cmd as operacao,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Verificar se RLS está habilitada
SELECT 
  'RLS_STATUS' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Verificar se a função foi criada corretamente
SELECT 
  'FUNCAO_CRIADA' as verificacao,
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc 
WHERE proname = 'create_profiles_table';

-- Verificar se o trigger foi criado
SELECT 
  'TRIGGER_CRIADO' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'; 