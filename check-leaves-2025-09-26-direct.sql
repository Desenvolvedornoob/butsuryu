-- Verificar folgas para 2025-09-26 diretamente no Supabase
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar TODAS as folgas para 2025-09-26
SELECT 
  id,
  type,
  status,
  start_date,
  user_id,
  created_at
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
ORDER BY created_at DESC;

-- 2. Contar por status
SELECT 
  status,
  COUNT(*) as quantidade
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
GROUP BY status
ORDER BY status;

-- 3. Verificar se há folgas aprovadas especificamente
SELECT 
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
  AND status = 'approved'
ORDER BY created_at DESC;

-- 4. Verificar também na tabela time_off
SELECT 
  id,
  status,
  start_date,
  user_id
FROM time_off 
WHERE start_date::text LIKE '2025-09-26%'
  AND status = 'approved'
ORDER BY created_at DESC;
