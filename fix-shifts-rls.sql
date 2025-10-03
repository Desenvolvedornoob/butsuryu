-- Corrigir políticas RLS para tabela shifts
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_policy" ON public.shifts;

-- Criar política para SELECT (todos usuários autenticados podem ver turnos)
CREATE POLICY "shifts_select_policy" 
ON public.shifts 
FOR SELECT 
TO authenticated 
USING (true);

-- Criar política para INSERT (apenas admins podem adicionar turnos)
CREATE POLICY "shifts_insert_policy" 
ON public.shifts 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE (apenas admins podem atualizar turnos)
CREATE POLICY "shifts_update_policy" 
ON public.shifts 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para DELETE (apenas admins podem deletar turnos)
CREATE POLICY "shifts_delete_policy" 
ON public.shifts 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Garantir que RLS está habilitada
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY; 