-- Script para verificar permissões do calendário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existem solicitações na tabela requests
SELECT 
    'REQUESTS' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitadas
FROM public.requests;

-- 2. Verificar se existem solicitações na tabela time_off
SELECT 
    'TIME_OFF' as tabela,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitadas
FROM public.time_off;

-- 3. Verificar feriados
SELECT 
    'HOLIDAYS' as tabela,
    COUNT(*) as total
FROM public.holidays;

-- 4. Verificar fábricas
SELECT 
    'FACTORIES' as tabela,
    COUNT(*) as total
FROM public.factories;

-- 5. Mostrar algumas solicitações aprovadas com detalhes
SELECT 
    'SAMPLE_APPROVED_REQUESTS' as tipo,
    r.id,
    r.type,
    r.status,
    r.start_date,
    r.end_date,
    r.reason,
    p.first_name || ' ' || p.last_name as usuario,
    p.factory_id
FROM public.requests r
LEFT JOIN public.profiles p ON r.user_id = p.id
WHERE r.status = 'approved'
ORDER BY r.start_date DESC
LIMIT 5;

-- 6. Mostrar algumas solicitações time_off aprovadas
SELECT 
    'SAMPLE_APPROVED_TIME_OFF' as tipo,
    t.id,
    'time-off' as type,
    t.status,
    t.start_date,
    t.end_date,
    t.reason,
    p.first_name || ' ' || p.last_name as usuario,
    p.factory_id
FROM public.time_off t
LEFT JOIN public.profiles p ON t.user_id = p.id
WHERE t.status = 'approved'
ORDER BY t.start_date DESC
LIMIT 5;

-- 7. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'time_off', 'holidays', 'factories')
ORDER BY tablename, policyname;

-- 8. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'time_off', 'holidays', 'factories');

-- 9. Teste de consulta como seria feita pelo frontend
-- (simula a consulta que o Calendar.tsx faz)
SELECT 
    r.id,
    r.type::text as type,
    r.status,
    r.start_date as date,
    r.end_date as "endDate",
    r.reason,
    r.user_id,
    p.first_name,
    p.last_name,
    p.factory_id
FROM public.requests r
INNER JOIN public.profiles p ON r.user_id = p.id
WHERE r.status = 'approved'
UNION ALL
SELECT 
    t.id,
    CASE 
        WHEN t.start_date = t.end_date THEN 'absence'
        ELSE 'time-off'
    END as type,
    t.status,
    t.start_date as date,
    t.end_date as "endDate",
    t.reason,
    t.user_id,
    p.first_name,
    p.last_name,
    p.factory_id
FROM public.time_off t
INNER JOIN public.profiles p ON t.user_id = p.id
WHERE t.status = 'approved'
ORDER BY date DESC; 