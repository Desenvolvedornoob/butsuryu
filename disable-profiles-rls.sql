-- Script para desabilitar temporariamente RLS na tabela profiles
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- DESABILITAR RLS TEMPORARIAMENTE
-- ===============================================

-- Desabilitar RLS na tabela profiles para permitir inserções
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- VERIFICAÇÃO
-- ===============================================

-- Verificar se RLS foi desabilitada
SELECT 
  'RLS_DESABILITADA' as verificacao,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Verificar políticas existentes (deve estar vazio)
SELECT 
  'POLITICAS_EXISTENTES' as verificacao,
  policyname,
  cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'; 