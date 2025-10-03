-- ===============================================
-- TESTE DA FUNCIONALIDADE DE REGISTRO DE REVISOR (VERSÃO CORRIGIDA)
-- ===============================================

-- 1. Verificar se os campos foram adicionados corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('requests', 'time_off', 'early_departures', 'lateness')
AND column_name IN ('approved_by', 'rejected_by', 'reviewed_at')
ORDER BY table_name, column_name;

-- 2. Criar uma solicitação de teste (SEM o SELECT problemático)
DO $$
DECLARE
    test_user_id UUID;
    admin_user_id UUID;
    test_request_id UUID;
BEGIN
    -- Buscar um usuário funcionário para criar a solicitação
    SELECT id INTO test_user_id 
    FROM public.profiles 
    WHERE role = 'funcionario' 
    LIMIT 1;
    
    -- Buscar um usuário admin para aprovar
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL AND admin_user_id IS NOT NULL THEN
        -- Criar uma solicitação de teste
        INSERT INTO public.time_off (id, user_id, start_date, end_date, reason, status, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), test_user_id, CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 'Teste de funcionalidade de revisor', 'pending', NOW(), NOW())
        RETURNING id INTO test_request_id;
        
        -- Simular aprovação pelo admin
        UPDATE public.time_off 
        SET 
            status = 'approved',
            approved_by = admin_user_id,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = test_request_id;
        
        RAISE NOTICE 'Solicitação de teste criada e aprovada. ID: %', test_request_id;
        
    ELSE
        RAISE NOTICE 'Não foi possível encontrar usuários para teste (funcionário e admin necessários)';
    END IF;
END $$;

-- 3. Verificar solicitações com informações de revisor (FORA do bloco PL/pgSQL)
SELECT 
    t.id,
    user_profile.first_name || ' ' || user_profile.last_name as solicitante,
    t.reason,
    t.status,
    CASE 
        WHEN t.approved_by IS NOT NULL THEN approver.first_name || ' ' || approver.last_name
        WHEN t.rejected_by IS NOT NULL THEN rejecter.first_name || ' ' || rejecter.last_name
        ELSE NULL
    END as revisor,
    t.reviewed_at,
    t.created_at
FROM public.time_off t
JOIN public.profiles user_profile ON t.user_id = user_profile.id
LEFT JOIN public.profiles approver ON t.approved_by = approver.id
LEFT JOIN public.profiles rejecter ON t.rejected_by = rejecter.id
WHERE t.status IN ('approved', 'rejected')
ORDER BY t.created_at DESC
LIMIT 10; 