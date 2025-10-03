-- Corrigir políticas RLS para tabelas early_departures e lateness
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- POLÍTICAS PARA TABELA EARLY_DEPARTURES
-- ===============================================

-- Remover políticas existentes da tabela early_departures
DROP POLICY IF EXISTS "early_departures_select_policy" ON public.early_departures;
DROP POLICY IF EXISTS "early_departures_insert_policy" ON public.early_departures;
DROP POLICY IF EXISTS "early_departures_update_policy" ON public.early_departures;
DROP POLICY IF EXISTS "early_departures_delete_policy" ON public.early_departures;

-- Criar política para SELECT - early_departures
CREATE POLICY "early_departures_select_policy" 
ON public.early_departures 
FOR SELECT 
TO authenticated 
USING (
  -- O usuário pode ver suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin/superuser (podem ver todas)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Criar política para INSERT - early_departures
CREATE POLICY "early_departures_insert_policy" 
ON public.early_departures 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Usuário pode criar solicitações para si mesmo
  user_id = auth.uid() OR
  -- Ou é admin (pode criar para outros)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - early_departures
CREATE POLICY "early_departures_update_policy" 
ON public.early_departures 
FOR UPDATE 
TO authenticated 
USING (
  -- O usuário pode editar suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin (pode editar tudo)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  -- Ou é superuser (pode aprovar/rejeitar)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  )
)
WITH CHECK (
  -- Para superuser: só pode alterar status e reject_reason
  (user_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )) OR
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  ))
);

-- Criar política para DELETE - early_departures
CREATE POLICY "early_departures_delete_policy" 
ON public.early_departures 
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
  )
);

-- ===============================================
-- POLÍTICAS PARA TABELA LATENESS
-- ===============================================

-- Remover políticas existentes da tabela lateness
DROP POLICY IF EXISTS "lateness_select_policy" ON public.lateness;
DROP POLICY IF EXISTS "lateness_insert_policy" ON public.lateness;
DROP POLICY IF EXISTS "lateness_update_policy" ON public.lateness;
DROP POLICY IF EXISTS "lateness_delete_policy" ON public.lateness;

-- Criar política para SELECT - lateness
CREATE POLICY "lateness_select_policy" 
ON public.lateness 
FOR SELECT 
TO authenticated 
USING (
  -- O usuário pode ver suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin/superuser (podem ver todas)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Criar política para INSERT - lateness
CREATE POLICY "lateness_insert_policy" 
ON public.lateness 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Usuário pode criar solicitações para si mesmo
  user_id = auth.uid() OR
  -- Ou é admin (pode criar para outros)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - lateness
CREATE POLICY "lateness_update_policy" 
ON public.lateness 
FOR UPDATE 
TO authenticated 
USING (
  -- O usuário pode editar suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin (pode editar tudo)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ) OR
  -- Ou é superuser (pode aprovar/rejeitar)
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  )
)
WITH CHECK (
  -- Para superuser: só pode alterar status e reject_reason
  (user_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )) OR
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  ))
);

-- Criar política para DELETE - lateness
CREATE POLICY "lateness_delete_policy" 
ON public.lateness 
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
  )
);

-- ===============================================
-- HABILITAR RLS NAS TABELAS
-- ===============================================

-- Garantir que RLS está habilitada nas tabelas
ALTER TABLE public.early_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lateness ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('early_departures', 'lateness')
ORDER BY tablename, policyname;
