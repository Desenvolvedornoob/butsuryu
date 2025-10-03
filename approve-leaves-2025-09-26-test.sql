-- Aprovar folgas para 2025-09-26 para testar o limite
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar folgas pendentes para 2025-09-26
SELECT 
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
ORDER BY created_at DESC;

-- 2. Aprovar 2 folgas para 2025-09-26 (atingir o limite)
UPDATE requests
SET status = 'approved'
WHERE id IN (
  SELECT id FROM requests
  WHERE start_date::text LIKE '2025-09-26%'
    AND type = 'time-off'
    AND status = 'pending'
  LIMIT 2
);

-- 3. Verificar resultado
SELECT 
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
ORDER BY status, created_at DESC;

-- 4. Contar folgas aprovadas para 2025-09-26
SELECT 
  COUNT(*) as total_aprovadas,
  'Deveria bloquear novas solicitações' as observacao
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
  AND status = 'approved';
