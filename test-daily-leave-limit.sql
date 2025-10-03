-- Script para testar o sistema de limite de folgas por dia

-- 1. Verificar configurações atuais
SELECT 
    f.name as factory_name,
    dll.max_leaves_per_day
FROM daily_leave_limits dll
JOIN factories f ON dll.factory_id = f.id
ORDER BY f.name;

-- 2. Verificar folgas aprovadas para hoje
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

-- 3. Verificar folgas pendentes para hoje
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

-- 4. Testar configuração de limite para Nishiazai (exemplo)
UPDATE daily_leave_limits 
SET max_leaves_per_day = 1
WHERE factory_id = '5ac85ce0-6594-4ffc-ad9f-64e78e1aba33'; -- Nishiazai

-- 5. Verificar se a configuração foi aplicada
SELECT 
    f.name as factory_name,
    dll.max_leaves_per_day
FROM daily_leave_limits dll
JOIN factories f ON dll.factory_id = f.id
WHERE f.name = 'Nishiazai';
