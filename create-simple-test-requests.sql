-- Script simples para criar solicitações de teste
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos ver os usuários existentes
SELECT 
  id,
  first_name,
  last_name,
  role,
  'COPIE ESTE ID PARA USAR ABAIXO' as instrucao
FROM public.profiles 
ORDER BY created_at DESC;

-- ===================================================
-- INSTRUÇÕES:
-- 1. Execute a query acima para ver os usuários
-- 2. Copie o ID de um usuário
-- 3. Substitua 'SEU_USER_ID_AQUI' pelo ID copiado
-- 4. Execute as queries abaixo
-- ===================================================

-- Exemplo de como criar solicitações manualmente:
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real de um usuário

/*
-- Criar solicitação de folga
INSERT INTO public.time_off (id, user_id, start_date, end_date, reason, status, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'SEU_USER_ID_AQUI', 
  '2025-01-25', 
  '2025-01-26', 
  'Solicitação de folga teste', 
  'pending', 
  NOW(), 
  NOW()
);

-- Criar solicitação de saída antecipada
INSERT INTO public.requests (id, type, user_id, start_date, reason, status, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'early-departure', 
  'SEU_USER_ID_AQUI', 
  '2025-01-24', 
  'Saída antecipada teste', 
  'pending', 
  NOW(), 
  NOW()
);

-- Criar solicitação de atraso
INSERT INTO public.requests (id, type, user_id, start_date, reason, status, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'lateness', 
  'SEU_USER_ID_AQUI', 
  '2025-01-23', 
  'Atraso teste', 
  'pending', 
  NOW(), 
  NOW()
);
*/

-- Para verificar as solicitações existentes:
SELECT 
    'TIME_OFF' as tipo,
    id, 
    user_id, 
    reason, 
    status, 
    start_date,
    end_date,
    created_at,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = time_off.user_id) as usuario_nome
FROM public.time_off
UNION ALL
SELECT 
    'REQUEST_' || type as tipo,
    id, 
    user_id, 
    reason, 
    status, 
    start_date,
    end_date,
    created_at,
    (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = requests.user_id) as usuario_nome
FROM public.requests
ORDER BY created_at DESC; 