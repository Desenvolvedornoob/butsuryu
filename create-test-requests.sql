-- Script para criar solicitações de teste usando profiles existentes
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos ver quais usuários temos disponíveis
SELECT id, first_name, last_name, role FROM public.profiles ORDER BY created_at DESC LIMIT 10;

-- Criar algumas solicitações de teste na tabela requests usando usuários existentes
-- Substitua os UUIDs pelos IDs reais dos seus usuários
DO $$ 
DECLARE 
    user_funcionario UUID;
    user_superuser UUID;
BEGIN
    -- Pegar o primeiro funcionário disponível
    SELECT id INTO user_funcionario FROM public.profiles WHERE role = 'funcionario' LIMIT 1;
    
    -- Pegar o superuser (se existir)
    SELECT id INTO user_superuser FROM public.profiles WHERE role = 'superuser' LIMIT 1;
    
    -- Se não encontrou funcionário, usar qualquer usuário
    IF user_funcionario IS NULL THEN
        SELECT id INTO user_funcionario FROM public.profiles LIMIT 1;
    END IF;
    
    -- Criar solicitações apenas se tivermos usuários
    IF user_funcionario IS NOT NULL THEN
        -- Inserir na tabela requests
        INSERT INTO public.requests (id, type, user_id, start_date, end_date, reason, status, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), 'time-off', user_funcionario, CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 'Solicitação de folga teste', 'pending', NOW(), NOW()),
          (gen_random_uuid(), 'early-departure', user_funcionario, CURRENT_DATE + INTERVAL '1 day', NULL, 'Saída antecipada teste', 'pending', NOW(), NOW()),
          (gen_random_uuid(), 'lateness', user_funcionario, CURRENT_DATE, NULL, 'Atraso teste', 'pending', NOW(), NOW());
        
        -- Inserir na tabela time_off
        INSERT INTO public.time_off (id, user_id, start_date, end_date, reason, status, created_at, updated_at)
        VALUES 
          (gen_random_uuid(), user_funcionario, CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 week' + INTERVAL '2 days', 'Folga teste 1', 'pending', NOW(), NOW()),
          (gen_random_uuid(), user_funcionario, CURRENT_DATE + INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '2 weeks' + INTERVAL '1 day', 'Folga teste 2', 'pending', NOW(), NOW());
        
        RAISE NOTICE 'Solicitações de teste criadas para usuário: %', user_funcionario;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para criar solicitações de teste';
    END IF;
END $$;

-- Verificar as solicitações criadas
SELECT 
    'REQUESTS' as origem,
    id, 
    type, 
    user_id, 
    reason, 
    status, 
    created_at,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = requests.user_id) as usuario_nome
FROM public.requests
WHERE created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'TIME_OFF' as origem,
    id, 
    'time-off' as type, 
    user_id, 
    reason, 
    status, 
    created_at,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = time_off.user_id) as usuario_nome
FROM public.time_off
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC; 