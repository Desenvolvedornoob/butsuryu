-- Script para testar dados do calendário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuários existentes
SELECT 
    'USUARIOS_EXISTENTES' as info,
    id,
    first_name,
    last_name,
    role,
    factory_id
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar solicitações aprovadas existentes
SELECT 
    'SOLICITACOES_APROVADAS' as info,
    COUNT(*) as total_requests,
    (SELECT COUNT(*) FROM public.time_off WHERE status = 'approved') as total_time_off
FROM public.requests 
WHERE status = 'approved';

-- 3. Se não houver solicitações aprovadas, criar algumas para teste
-- IMPORTANTE: Execute apenas se não houver solicitações aprovadas

-- Primeiro, vamos pegar um usuário existente para usar nos testes
DO $$ 
DECLARE 
    test_user_id UUID;
    test_factory_id VARCHAR;
BEGIN
    -- Pegar o primeiro usuário disponível
    SELECT id, factory_id INTO test_user_id, test_factory_id 
    FROM public.profiles 
    WHERE role IN ('funcionario', 'admin', 'superuser') 
    LIMIT 1;
    
    -- Se encontrou um usuário, criar solicitações de teste
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Criando solicitações de teste para usuário: %', test_user_id;
        
        -- Criar uma solicitação de folga aprovada (próxima semana)
        INSERT INTO public.time_off (
            id, 
            user_id, 
            start_date, 
            end_date, 
            reason, 
            status, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            CURRENT_DATE + INTERVAL '7 days',
            CURRENT_DATE + INTERVAL '8 days',
            'Folga de teste para calendário',
            'approved',
            NOW(),
            NOW()
        );
        
        -- Criar uma solicitação de saída antecipada aprovada (hoje)
        INSERT INTO public.requests (
            id, 
            type, 
            user_id, 
            start_date, 
            reason, 
            status, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'early-departure',
            test_user_id,
            CURRENT_DATE,
            'Saída antecipada de teste',
            'approved',
            NOW(),
            NOW()
        );
        
        -- Criar uma falta (absence) aprovada (ontem)
        INSERT INTO public.time_off (
            id, 
            user_id, 
            start_date, 
            end_date, 
            reason, 
            status, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            CURRENT_DATE - INTERVAL '1 day',
            CURRENT_DATE - INTERVAL '1 day',
            'Falta de teste para calendário',
            'approved',
            NOW(),
            NOW()
        );
        
        -- Criar uma solicitação de atraso aprovada (amanhã)
        INSERT INTO public.requests (
            id, 
            type, 
            user_id, 
            start_date, 
            reason, 
            status, 
            created_at, 
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'lateness',
            test_user_id,
            CURRENT_DATE + INTERVAL '1 day',
            'Atraso de teste',
            'approved',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Solicitações de teste criadas com sucesso!';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para criar solicitações de teste';
    END IF;
END $$;

-- 4. Verificar se as solicitações foram criadas
SELECT 
    'VERIFICACAO_FINAL' as info,
    'requests' as tabela,
    type::text as type,
    status,
    start_date,
    reason,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = requests.user_id) as usuario
FROM public.requests 
WHERE status = 'approved'
ORDER BY start_date DESC;

SELECT 
    'VERIFICACAO_FINAL' as info,
    'time_off' as tabela,
    CASE 
        WHEN start_date = end_date THEN 'absence'
        ELSE 'time-off'
    END as type,
    status,
    start_date,
    end_date,
    reason,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = time_off.user_id) as usuario
FROM public.time_off 
WHERE status = 'approved'
ORDER BY start_date DESC;

-- 5. Verificar feriados existentes
SELECT 
    'FERIADOS_EXISTENTES' as info,
    h.date,
    h.name,
    f.name as factory_name
FROM public.holidays h
LEFT JOIN public.factories f ON h.factory_id = f.id
ORDER BY h.date; 