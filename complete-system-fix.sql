-- ===============================================
-- SCRIPT COMPLETO DE CORREÇÃO DO SISTEMA
-- Execute este script no SQL Editor do Supabase
-- ===============================================

-- 1. VERIFICAR ROLES EXISTENTES (admin, funcionario, superuser)
DO $$
BEGIN
    -- Verificar se existem as roles principais
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        RAISE NOTICE 'Role admin não encontrada - será necessário criar usuários admin';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'superuser') THEN
        RAISE NOTICE 'Role superuser não encontrada - será necessário criar usuários superuser';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'funcionario') THEN
        RAISE NOTICE 'Role funcionario não encontrada - será necessário criar usuários funcionario';
    END IF;
END $$;

-- 2. CORRIGIR POLÍTICAS RLS PARA HOLIDAYS
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

-- 3. CORRIGIR POLÍTICAS RLS PARA SHIFTS
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

-- 4. CORRIGIR POLÍTICAS RLS PARA TIME_OFF (incluir admin e superuser)
-- Remover políticas existentes
DROP POLICY IF EXISTS "time_off_select_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_insert_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_update_policy" ON public.time_off;
DROP POLICY IF EXISTS "time_off_delete_policy" ON public.time_off;

-- SELECT: Usuários podem ver suas próprias solicitações + aprovadores podem ver todas
CREATE POLICY "time_off_select_policy" 
ON public.time_off 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- INSERT: Todos usuários autenticados podem criar solicitações para si mesmos
CREATE POLICY "time_off_insert_policy" 
ON public.time_off 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- UPDATE: Usuários podem editar próprias solicitações pendentes + aprovadores podem alterar status
CREATE POLICY "time_off_update_policy" 
ON public.time_off 
FOR UPDATE 
TO authenticated 
USING (
  (user_id = auth.uid() AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- DELETE: Apenas usuários podem deletar suas próprias solicitações pendentes
CREATE POLICY "time_off_delete_policy" 
ON public.time_off 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid() AND status = 'pending');

-- 5. CORRIGIR POLÍTICAS RLS PARA REQUESTS (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "requests_select_policy" ON public.requests;
        DROP POLICY IF EXISTS "requests_insert_policy" ON public.requests;
        DROP POLICY IF EXISTS "requests_update_policy" ON public.requests;
        DROP POLICY IF EXISTS "requests_delete_policy" ON public.requests;

        -- SELECT: Usuários podem ver suas próprias solicitações + aprovadores podem ver todas
        CREATE POLICY "requests_select_policy" 
        ON public.requests 
        FOR SELECT 
        TO authenticated 
        USING (
          user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
          )
        );

        -- INSERT: Todos usuários autenticados podem criar solicitações para si mesmos
        CREATE POLICY "requests_insert_policy" 
        ON public.requests 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (user_id = auth.uid());

        -- UPDATE: Usuários podem editar próprias solicitações pendentes + aprovadores podem alterar status
        CREATE POLICY "requests_update_policy" 
        ON public.requests 
        FOR UPDATE 
        TO authenticated 
        USING (
          (user_id = auth.uid() AND status = 'pending') OR
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
          )
        );

        -- DELETE: Apenas usuários podem deletar suas próprias solicitações pendentes
        CREATE POLICY "requests_delete_policy" 
        ON public.requests 
        FOR DELETE 
        TO authenticated 
        USING (user_id = auth.uid() AND status = 'pending');
        
        RAISE NOTICE 'Políticas RLS para tabela requests atualizadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela requests não encontrada - pulando configuração de políticas';
    END IF;
END $$;

-- 6. HABILITAR RLS NAS TABELAS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela requests se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
        ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado na tabela requests';
    END IF;
END $$;

-- 7. VERIFICAR SE EXISTEM CAMPOS APPROVED_BY E REJECTED_BY
DO $$
BEGIN
    -- Verificar time_off
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_off' AND column_name = 'approved_by') THEN
        ALTER TABLE public.time_off ADD COLUMN approved_by UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Campo approved_by adicionado à tabela time_off';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_off' AND column_name = 'rejected_by') THEN
        ALTER TABLE public.time_off ADD COLUMN rejected_by UUID REFERENCES public.profiles(id);
        RAISE NOTICE 'Campo rejected_by adicionado à tabela time_off';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_off' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.time_off ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Campo reviewed_at adicionado à tabela time_off';
    END IF;
    
    -- Verificar requests se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'approved_by') THEN
            ALTER TABLE public.requests ADD COLUMN approved_by UUID REFERENCES public.profiles(id);
            RAISE NOTICE 'Campo approved_by adicionado à tabela requests';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'rejected_by') THEN
            ALTER TABLE public.requests ADD COLUMN rejected_by UUID REFERENCES public.profiles(id);
            RAISE NOTICE 'Campo rejected_by adicionado à tabela requests';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requests' AND column_name = 'reviewed_at') THEN
            ALTER TABLE public.requests ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Campo reviewed_at adicionado à tabela requests';
        END IF;
    END IF;
END $$;

-- 8. RELATÓRIO FINAL
SELECT 
  'CONFIGURACAO_COMPLETA' as status,
  'Sistema configurado com sucesso!' as mensagem,
  NOW() as timestamp;

-- Verificar políticas criadas
SELECT 
  'POLITICAS_CRIADAS' as info,
  tablename,
  COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename IN ('holidays', 'shifts', 'time_off', 'requests')
GROUP BY tablename
ORDER BY tablename;

-- Verificar RLS habilitado
SELECT 
  'RLS_STATUS' as info,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as status_rls
FROM pg_tables 
WHERE tablename IN ('holidays', 'shifts', 'time_off', 'requests')
AND schemaname = 'public'
ORDER BY tablename; 