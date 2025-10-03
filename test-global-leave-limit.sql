-- Script para testar o sistema de limite GLOBAL de folgas por dia

-- 1. Verificar configuração global atual
SELECT 
    id,
    max_leaves_per_day,
    created_at,
    updated_at
FROM daily_leave_limits
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Verificar folgas aprovadas para hoje (TODAS as fábricas)
SELECT 
    f.name as factory_name,
    r.start_date,
    COUNT(*) as approved_leaves_today
FROM requests r
JOIN factories f ON r.factory_id = f.id
WHERE r.type = 'time-off' 
  AND r.status = 'approved'
  AND DATE(r.start_date) = CURRENT_DATE
GROUP BY f.name, r.start_date
ORDER BY f.name;

-- 3. Verificar folgas pendentes para hoje (TODAS as fábricas)
SELECT 
    f.name as factory_name,
    r.start_date,
    COUNT(*) as pending_leaves_today
FROM requests r
JOIN factories f ON r.factory_id = f.id
WHERE r.type = 'time-off' 
  AND r.status = 'pending'
  AND DATE(r.start_date) = CURRENT_DATE
GROUP BY f.name, r.start_date
ORDER BY f.name;

-- 4. Contar total de folgas para hoje (TODAS as fábricas)
SELECT 
    COUNT(*) as total_leaves_today,
    'Todas as fábricas' as scope
FROM requests r
WHERE r.type = 'time-off' 
  AND r.status IN ('approved', 'pending')
  AND DATE(r.start_date) = CURRENT_DATE;

-- 5. Testar configuração de limite global
UPDATE daily_leave_limits 
SET max_leaves_per_day = 1
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 6. Verificar se a configuração foi aplicada
SELECT 
    id,
    max_leaves_per_day,
    updated_at
FROM daily_leave_limits
WHERE id = '00000000-0000-0000-0000-000000000001';
