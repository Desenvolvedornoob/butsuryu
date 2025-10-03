-- Script para corrigir problemas de edição de funcionários
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- 1. VERIFICAR POLÍTICAS RLS ATUAIS
-- ===============================================

SELECT 
    'Políticas RLS atuais da tabela profiles:' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- ===============================================
-- 2. REMOVER POLÍTICAS PROBLEMÁTICAS
-- ===============================================

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "superuser_update_profiles" ON public.profiles;

-- ===============================================
-- 3. CRIAR POLÍTICAS PERMISSIVAS PARA ADMINS
-- ===============================================

-- Política para SELECT - admins e superusers podem ver todos, usuários veem apenas o próprio
CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Política para INSERT - admins podem criar qualquer perfil
CREATE POLICY "profiles_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Política para UPDATE - admins podem atualizar qualquer perfil, usuários o próprio
CREATE POLICY "profiles_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
)
WITH CHECK (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Política para DELETE - apenas admins podem deletar qualquer perfil
CREATE POLICY "profiles_delete_policy" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===============================================
-- 4. GARANTIR QUE RLS ESTÁ HABILITADO
-- ===============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- 5. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ===============================================

SELECT 
    'Novas políticas criadas:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- ===============================================
-- 6. TESTAR UPDATE SIMPLES
-- ===============================================

-- Este comando só funcionará se você for admin
-- UPDATE public.profiles SET phone = phone WHERE id = auth.uid();

SELECT 'Script executado com sucesso!' as resultado;