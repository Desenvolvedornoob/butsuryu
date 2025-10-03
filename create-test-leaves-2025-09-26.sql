-- Criar folgas de teste para 2025-09-26
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Inserir 2 folgas aprovadas para 2025-09-26 (atingir o limite)
INSERT INTO requests (
  id,
  type,
  status,
  start_date,
  end_date,
  reason,
  user_id,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'time-off',
  'approved',
  '2025-09-26T00:00:00+00:00',
  '2025-09-26T00:00:00+00:00',
  'Teste de limite',
  '6fae5e52-6914-46ac-85e5-fe22b034e112',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'time-off',
  'approved',
  '2025-09-26T00:00:00+00:00',
  '2025-09-26T00:00:00+00:00',
  'Teste de limite 2',
  '6fae5e52-6914-46ac-85e5-fe22b034e112',
  NOW(),
  NOW()
);

-- 2. Verificar se foram inseridas
SELECT 
  id,
  type,
  status,
  start_date,
  reason
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
ORDER BY created_at DESC;

-- 3. Contar folgas aprovadas para 2025-09-26
SELECT 
  COUNT(*) as total_aprovadas,
  'Agora deve bloquear novas solicitações' as observacao
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
  AND status = 'approved';
