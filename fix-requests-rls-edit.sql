-- Script para corrigir políticas RLS da tabela requests para permitir edição por admins
-- Este script deve ser executado no console SQL do Supabase

-- 1. Primeiro, verificar se existe a política de UPDATE para admins
DROP POLICY IF EXISTS "Admins can update all requests" ON public.requests;

-- 2. Criar política para permitir que admins atualizem qualquer solicitação
CREATE POLICY "Admins can update all requests" 
ON public.requests 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 3. Verificar se existe a política de INSERT para admins
DROP POLICY IF EXISTS "Admins can insert all requests" ON public.requests;

-- 4. Criar política para permitir que admins insiram qualquer solicitação
CREATE POLICY "Admins can insert all requests" 
ON public.requests 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 5. Também corrigir a política de UPDATE para a tabela time_off
DROP POLICY IF EXISTS "Admins can update all time_off" ON public.time_off;

CREATE POLICY "Admins can update all time_off" 
ON public.time_off 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 6. Política de INSERT para time_off
DROP POLICY IF EXISTS "Admins can insert all time_off" ON public.time_off;

CREATE POLICY "Admins can insert all time_off" 
ON public.time_off 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- 7. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('requests', 'time_off') 
  AND schemaname = 'public'
ORDER BY tablename, policyname;

NOTIFY pgrst, 'reload schema'; 