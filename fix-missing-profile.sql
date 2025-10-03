-- CORREÇÃO DE USUÁRIO SEM PERFIL + APLICAÇÃO DA SOLUÇÃO COMPLETA
-- Execute este script para corrigir o usuário existente e aplicar a solução

-- ===============================================
-- 1. VERIFICAR USUÁRIO SEM PERFIL
-- ===============================================

-- Identificar o usuário sem perfil
SELECT 
  'USUARIO_SEM_PERFIL' as verificacao,
  au.id,
  au.phone,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 2. CRIAR PERFIL MANUALMENTE PARA USUÁRIO EXISTENTE
-- ===============================================

-- Desabilitar RLS temporariamente para permitir inserção
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Inserir perfil para o usuário sem perfil
INSERT INTO public.profiles (
  id,
  phone,
  first_name,
  role,
  status,
  department,
  responsible,
  factory_id,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Usuário'),
  COALESCE(au.raw_user_meta_data->>'role', 'funcionario')::user_role,
  'active',
  COALESCE(au.raw_user_meta_data->>'department', 'N/A'),
  COALESCE(au.raw_user_meta_data->>'responsible', 'N/A'),
  COALESCE(au.raw_user_meta_data->>'factory_id', '1')::uuid,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 3. VERIFICAR SE O PERFIL FOI CRIADO
-- ===============================================

-- Verificar se o problema foi resolvido
SELECT 
  'VERIFICACAO_PERFIL_CRIADO' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Todos os usuários têm perfis'
    ELSE 'PROBLEMA - Ainda existem usuários sem perfis: ' || COUNT(*)
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ===============================================
-- 4. APLICAR A CORREÇÃO COMPLETA
-- ===============================================

-- Remover políticas existentes da tabela profiles (se houver)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;

-- ===============================================
-- 5. CRIAR FUNÇÃO SEGURA PARA CRIAR PERFIL
-- ===============================================

-- Criar função que contorna RLS para criação de perfis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil automaticamente quando um usuário é criado
  INSERT INTO public.profiles (
    id,
    phone,
    first_name,
    role,
    status,
    department,
    responsible,
    factory_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'funcionario')::user_role,
    'active',
    COALESCE(NEW.raw_user_meta_data->>'department', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'responsible', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'factory_id', '1')::uuid,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 6. CRIAR TRIGGER AUTOMÁTICO
-- ===============================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- 7. CRIAR POLÍTICAS RLS CORRETAS
-- =======================================

-- Política para SELECT - usuários podem ver seu próprio perfil + admins veem todos
CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Usuário pode ver seu próprio perfil
  id = auth.uid() 
  OR 
  -- Admin pode ver todos os perfis
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para INSERT - permitir inserção via trigger e admin
CREATE POLICY "profiles_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Permitir inserção via trigger (usuário criando seu próprio perfil)
  id = auth.uid()
  OR
  -- Admin pode criar perfis para outros
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para UPDATE - usuários podem atualizar seu próprio perfil + admins
CREATE POLICY "profiles_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  -- Usuário pode atualizar seu próprio perfil
  id = auth.uid()
  OR
  -- Admin pode atualizar qualquer perfil
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Usuário pode atualizar seu próprio perfil
  id = auth.uid()
  OR
  -- Admin pode atualizar qualquer perfil
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para DELETE - apenas admin pode deletar
CREATE POLICY "profiles_delete_policy" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  -- Apenas admin pode deletar perfis
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ===============================================
-- 8. HABILITAR RLS NOVAMENTE
-- ===============================================

-- Habilitar RLS com as novas políticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 9. VERIFICAÇÃO FINAL
-- ===============================================

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

-- Verificar políticas criadas
SELECT 
  'POLITICAS_CRIADAS' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Verificar se a função foi criada
SELECT 
  'FUNCAO_CRIADA' as verificacao,
  proname as nome_funcao
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verificar se o trigger foi criado
SELECT 
  'TRIGGER_CRIADO' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Verificar integridade final
SELECT 
  'INTEGRIDADE_FINAL' as verificacao,
  CASE 
    WHEN COUNT(*) = 0 THEN 'OK - Todos os usuários têm perfis'
    ELSE 'PROBLEMA - Ainda existem usuários sem perfis: ' || COUNT(*)
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
