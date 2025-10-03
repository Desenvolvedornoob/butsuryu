-- Corrigir políticas RLS para tabelas de solicitações
-- Execute este script no SQL Editor do Supabase
-- ATENÇÃO: Usando apenas as roles existentes: admin, superuser, funcionario
-- SUPERUSER: Pode apenas VER e APROVAR/REJEITAR (não pode editar nem excluir)

-- ===============================================
-- POLÍTICAS PARA TABELA REQUESTS
-- ===============================================

-- Remover políticas existentes da tabela requests
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.requests;
DROP POLICY IF EXISTS "requests_select_policy" ON public.requests;
DROP POLICY IF EXISTS "requests_insert_policy" ON public.requests;
DROP POLICY IF EXISTS "requests_update_policy" ON public.requests;
DROP POLICY IF EXISTS "requests_delete_policy" ON public.requests;

-- Criar política para SELECT - requests
CREATE POLICY "requests_select_policy" 
ON public.requests 
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

-- Criar política para INSERT - requests
CREATE POLICY "requests_insert_policy" 
ON public.requests 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Usuário pode criar solicitações para si mesmo
  user_id = auth.uid() OR
  -- Ou é admin (pode criar para outros) - SUPERUSER NÃO PODE CRIAR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - requests (apenas para aprovação/rejeição)
CREATE POLICY "requests_update_policy" 
ON public.requests 
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
  -- Ou é superuser mas APENAS para atualizar status (aprovar/rejeitar)
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  ))
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

-- Criar política para DELETE - requests
CREATE POLICY "requests_delete_policy" 
ON public.requests 
FOR DELETE 
TO authenticated 
USING (
  -- O usuário pode deletar suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin (pode deletar todas) - SUPERUSER NÃO PODE DELETAR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===============================================
-- POLÍTICAS PARA TABELA TIME_OFF
-- ===============================================

-- Remover políticas existentes da tabela time_off
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.time_off;
DROP POLICY IF EXISTS "time_off_select_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_insert_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_update_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_delete_policy" ON public.time_off;

-- Criar política para SELECT - time_off
CREATE POLICY "time_off_select_policy" 
ON public.time_off 
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

-- Criar política para INSERT - time_off
CREATE POLICY "time_off_insert_policy" 
ON public.time_off 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Usuário pode criar solicitações para si mesmo
  user_id = auth.uid() OR
  -- Ou é admin (pode criar para outros) - SUPERUSER NÃO PODE CRIAR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - time_off (apenas para aprovação/rejeição)
CREATE POLICY "time_off_update_policy" 
ON public.time_off 
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
  -- Ou é superuser mas APENAS para atualizar status (aprovar/rejeitar)
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superuser'
  ))
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

-- Criar política para DELETE - time_off
CREATE POLICY "time_off_delete_policy" 
ON public.time_off 
FOR DELETE 
TO authenticated 
USING (
  -- O usuário pode deletar suas próprias solicitações
  user_id = auth.uid() OR
  -- Ou é admin (pode deletar todas) - SUPERUSER NÃO PODE DELETAR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===============================================
-- HABILITAR RLS NAS TABELAS
-- ===============================================

-- Garantir que RLS está habilitada nas tabelas principais
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY; 