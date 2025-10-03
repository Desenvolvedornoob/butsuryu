-- Script para corrigir as políticas RLS de DELETE
-- Este script deve ser executado no console SQL do Supabase

-- ===============================================
-- CORRIGIR POLÍTICA DELETE PARA TIME_OFF
-- ===============================================

-- Remover a política restrictiva atual
DROP POLICY IF EXISTS "time_off_delete_policy" ON public.time_off;

-- Criar nova política que permite:
-- 1. Usuários deletarem suas próprias solicitações (qualquer status)
-- 2. Admins deletarem qualquer solicitação
-- 3. Superusers deletarem qualquer solicitação (para gerenciamento)
CREATE POLICY "time_off_delete_policy" 
ON public.time_off 
FOR DELETE 
TO authenticated 
USING (
  -- O usuário pode deletar suas próprias solicitações (qualquer status)
  user_id = auth.uid() OR
  -- Ou é admin (pode deletar todas)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  -- Ou é superuser (pode deletar todas para gerenciamento)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  )
);

-- ===============================================
-- CORRIGIR POLÍTICA DELETE PARA REQUESTS
-- ===============================================

-- Remover a política atual se existir
DROP POLICY IF EXISTS "requests_delete_policy" ON public.requests;

-- Criar nova política mais permissiva
CREATE POLICY "requests_delete_policy" 
ON public.requests 
FOR DELETE 
TO authenticated 
USING (
  -- O usuário pode deletar suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin (pode deletar todas)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  -- Ou é superuser (pode deletar todas para gerenciamento)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  )
);

-- ===============================================
-- CORRIGIR POLÍTICAS PARA OUTRAS TABELAS
-- ===============================================

-- Política DELETE para early_departures
DROP POLICY IF EXISTS "early_departures_delete_policy" ON public.early_departures;

CREATE POLICY "early_departures_delete_policy" 
ON public.early_departures 
FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Política DELETE para lateness
DROP POLICY IF EXISTS "lateness_delete_policy" ON public.lateness;

CREATE POLICY "lateness_delete_policy" 
ON public.lateness 
FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Listar todas as políticas de DELETE criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE cmd = 'DELETE' 
  AND tablename IN ('time_off', 'requests', 'early_departures', 'lateness')
ORDER BY tablename, policyname;
