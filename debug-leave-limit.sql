-- Script para debugar o sistema de limite de folgas

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    'Tabela existe' as status
FROM information_schema.tables 
WHERE table_name = 'daily_leave_limits';

-- 2. Verificar dados na tabela
SELECT 
    id,
    max_leaves_per_day,
    created_at,
    updated_at
FROM daily_leave_limits;

-- 3. Verificar folgas aprovadas para hoje
SELECT 
    p.factory_id,
    p.first_name,
    r.start_date,
    r.status,
    'APROVADA' as tipo
FROM requests r
JOIN profiles p ON r.user_id = p.id
WHERE r.type = 'time-off' 
  AND r.status = 'approved'
  AND DATE(r.start_date) = CURRENT_DATE
ORDER BY p.factory_id, p.first_name;

-- 4. Contar folgas aprovadas para hoje
SELECT 
    COUNT(*) as total_aprovadas_hoje,
    'Estas deveriam bloquear novas solicitações' as observacao
FROM requests r
WHERE r.type = 'time-off' 
  AND r.status = 'approved'
  AND DATE(r.start_date) = CURRENT_DATE;

-- 5. Verificar se há dados de teste
SELECT 
    'Dados de teste' as tipo,
    COUNT(*) as quantidade
FROM requests r
WHERE r.type = 'time-off' 
  AND DATE(r.start_date) = CURRENT_DATE;
