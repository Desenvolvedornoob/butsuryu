-- Verificar folgas para 2025-09-26 no Supabase
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar todas as folgas que contêm 2025-09-26 no start_date
SELECT 
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
ORDER BY start_date;

-- 2. Contar folgas por status para 2025-09-26
SELECT 
  status,
  COUNT(*) as quantidade
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'
GROUP BY status
ORDER BY status;

-- 3. Verificar folgas aprovadas especificamente para 2025-09-26
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

-- 4. Verificar formato das datas
SELECT 
  id,
  start_date,
  start_date::text as data_texto,
  EXTRACT(YEAR FROM start_date) as ano,
  EXTRACT(MONTH FROM start_date) as mes,
  EXTRACT(DAY FROM start_date) as dia
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
ORDER BY start_date;
