-- Debug: Verificar por que o sistema de limite não encontra as folgas
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Verificar todas as folgas aprovadas (sem filtro de data)
SELECT 
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE type = 'time-off'
  AND status = 'approved'
ORDER BY start_date DESC
LIMIT 20;

-- 2. Verificar folgas aprovadas na tabela time_off
SELECT 
  id,
  status,
  start_date,
  user_id
FROM time_off 
WHERE status = 'approved'
ORDER BY start_date DESC
LIMIT 20;

-- 3. Verificar se há folgas para 2025-09-26 em qualquer status
SELECT 
  'requests' as tabela,
  id,
  type,
  status,
  start_date,
  user_id
FROM requests 
WHERE start_date::text LIKE '2025-09-26%'
  AND type = 'time-off'

UNION ALL

SELECT 
  'time_off' as tabela,
  id,
  'time-off' as type,
  status,
  start_date,
  user_id
FROM time_off 
WHERE start_date::text LIKE '2025-09-26%'

ORDER BY tabela, status, start_date DESC;

-- 4. Verificar formato das datas das folgas aprovadas
SELECT 
  id,
  start_date,
  start_date::text as data_texto,
  EXTRACT(YEAR FROM start_date) as ano,
  EXTRACT(MONTH FROM start_date) as mes,
  EXTRACT(DAY FROM start_date) as dia
FROM requests 
WHERE type = 'time-off'
  AND status = 'approved'
  AND start_date::text LIKE '2025-09%'
ORDER BY start_date DESC
LIMIT 10;
