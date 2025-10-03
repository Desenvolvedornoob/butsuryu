-- Aprovar folgas para 2025-09-26 para testar o limite
UPDATE requests 
SET status = 'approved', 
    updated_at = NOW()
WHERE DATE(start_date) = '2025-09-26'
  AND type = 'time-off'
  AND status = 'pending'
LIMIT 2; -- Aprovar apenas 2 para testar o limite

-- Verificar o resultado
SELECT 
  id,
  type,
  status,
  start_date
FROM requests 
WHERE DATE(start_date) = '2025-09-26'
  AND type = 'time-off'
ORDER BY status, created_at;
