-- Script simples para corrigir políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- REMOVER POLÍTICAS EXISTENTES
-- ===============================================

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- ===============================================
-- CRIAR POLÍTICAS BÁSICAS
-- ===============================================

-- Política para SELECT - permitir que usuários vejam seu próprio perfil
CREATE POLICY "profiles_select_policy" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Política para INSERT - permitir que usuários criem seu próprio perfil
CREATE POLICY "profiles_insert_policy" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Política para UPDATE - permitir que usuários atualizem seu próprio perfil
CREATE POLICY "profiles_update_policy" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Política para DELETE - permitir que usuários deletem seu próprio perfil
CREATE POLICY "profiles_delete_policy" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (id = auth.uid());

-- ===============================================
-- HABILITAR RLS
-- ===============================================

-- Garantir que RLS está habilitada
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- VERIFICAÇÃO
-- ===============================================

-- Verificar se as políticas foram criadas
SELECT 
  'POLITICAS_CRIADAS' as verificacao,
  policyname,
  cmd as operacao
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