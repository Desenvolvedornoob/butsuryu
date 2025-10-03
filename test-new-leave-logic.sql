-- Script para testar a NOVA lógica de limite de folgas

-- 1. Verificar configuração atual
SELECT 
    id,
    max_leaves_per_day,
    'Limite global' as tipo
FROM daily_leave_limits
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Verificar folgas APROVADAS para hoje
SELECT 
    f.name as factory_name,
    p.first_name,
    r.start_date,
    r.status,
    'APROVADA' as tipo_contagem
FROM requests r
JOIN factories f ON r.factory_id = f.id
JOIN profiles p ON r.user_id = p.id
WHERE r.type = 'time-off' 
  AND r.status = 'approved'
  AND DATE(r.start_date) = CURRENT_DATE
ORDER BY f.name, p.first_name;

-- 3. Verificar folgas PENDENTES para hoje
SELECT 
    f.name as factory_name,
    p.first_name,
    r.start_date,
    r.status,
    'PENDENTE (não conta no limite)' as tipo_contagem
FROM requests r
JOIN factories f ON r.factory_id = f.id
JOIN profiles p ON r.user_id = p.id
WHERE r.type = 'time-off' 
  AND r.status = 'pending'
  AND DATE(r.start_date) = CURRENT_DATE
ORDER BY f.name, p.first_name;

-- 4. Contar apenas folgas APROVADAS (que contam no limite)
SELECT 
    COUNT(*) as folgas_aprovadas_hoje,
    'Estas contam no limite' as observacao
FROM requests r
WHERE r.type = 'time-off' 
  AND r.status = 'approved'
  AND DATE(r.start_date) = CURRENT_DATE;

-- 5. Contar folgas PENDENTES (que NÃO contam no limite)
SELECT 
    COUNT(*) as folgas_pendentes_hoje,
    'Estas NÃO contam no limite' as observacao
FROM requests r
WHERE r.type = 'time-off' 
  AND r.status = 'pending'
  AND DATE(r.start_date) = CURRENT_DATE;

-- 6. Resumo da lógica
SELECT 
    'NOVA LÓGICA' as regra,
    'Só bloqueia quando tiver 2+ folgas APROVADAS' as descricao,
    'Folgas pendentes são liberadas para todos' as observacao;
