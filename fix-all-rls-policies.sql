-- Corrigir todas as políticas RLS para fábricas
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- POLÍTICAS PARA TABELA HOLIDAYS
-- ===============================================

-- Remover políticas existentes da tabela holidays
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.holidays;
DROP POLICY IF EXISTS "holidays_select_policy" ON public.holidays;
DROP POLICY IF EXISTS "holidays_insert_policy" ON public.holidays;
DROP POLICY IF EXISTS "holidays_update_policy" ON public.holidays;
DROP POLICY IF EXISTS "holidays_delete_policy" ON public.holidays;

-- Criar política para SELECT - holidays (todos usuários autenticados podem ver feriados)
CREATE POLICY "holidays_select_policy" 
ON public.holidays 
FOR SELECT 
TO authenticated 
USING (true);

-- Criar política para INSERT - holidays (apenas admins podem adicionar feriados)
CREATE POLICY "holidays_insert_policy" 
ON public.holidays 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para UPDATE - holidays (apenas admins podem atualizar feriados)
CREATE POLICY "holidays_update_policy" 
ON public.holidays 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Criar política para DELETE - holidays (apenas admins podem deletar feriados)
CREATE POLICY "holidays_delete_policy" 
ON public.holidays 
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
-- POLÍTICAS PARA TABELA SHIFTS
-- ===============================================

-- Remover políticas existentes da tabela shifts
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_policy" ON public.shifts;

-- Criar política para SELECT - shifts (todos usuários autenticados podem ver turnos)
CREATE POLICY "shifts_select_policy" 
ON public.shifts 
FOR SELECT 
TO authenticated 
USING (true);

-- Criar política para INSERT - shifts (apenas admins podem adicionar turnos)
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

-- Criar política para UPDATE - shifts (apenas admins podem atualizar turnos)
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

-- Criar política para DELETE - shifts (apenas admins podem deletar turnos)
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

-- ===============================================
-- HABILITAR RLS NAS TABELAS
-- ===============================================

-- Garantir que RLS está habilitada
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY; 