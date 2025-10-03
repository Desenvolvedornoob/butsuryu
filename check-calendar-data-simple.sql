-- Script simples para verificar dados do calendário
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar quantos usuários existem
SELECT 
    'TOTAL_USUARIOS' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'superuser' THEN 1 END) as superusers,
    COUNT(CASE WHEN role = 'funcionario' THEN 1 END) as funcionarios
FROM public.profiles;

-- 2. Verificar solicitações na tabela requests
SELECT 
    'REQUESTS_RESUMO' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitadas
FROM public.requests;

-- 3. Verificar solicitações na tabela time_off
SELECT 
    'TIME_OFF_RESUMO' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as aprovadas,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejeitadas
FROM public.time_off;

-- 4. Verificar feriados
SELECT 
    'FERIADOS_RESUMO' as info,
    COUNT(*) as total
FROM public.holidays;

-- 5. Verificar fábricas
SELECT 
    'FABRICAS_RESUMO' as info,
    COUNT(*) as total
FROM public.factories;

-- 6. Mostrar solicitações aprovadas da tabela requests (separadamente)
SELECT 
    'REQUESTS_APROVADAS' as tipo,
    r.id,
    r.type::text as tipo_solicitacao,
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
LIMIT 10;

-- 7. Mostrar solicitações aprovadas da tabela time_off (separadamente)
SELECT 
    'TIME_OFF_APROVADAS' as tipo,
    t.id,
    CASE 
        WHEN t.start_date = t.end_date THEN 'absence'
        ELSE 'time-off'
    END as tipo_solicitacao,
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
LIMIT 10;

-- 8. Verificar se há registros órfãos (sem perfil)
SELECT 
    'REQUESTS_ORFAOS' as info,
    COUNT(*) as total
FROM public.requests r
WHERE r.user_id NOT IN (SELECT id FROM public.profiles);

SELECT 
    'TIME_OFF_ORFAOS' as info,
    COUNT(*) as total
FROM public.time_off t
WHERE t.user_id NOT IN (SELECT id FROM public.profiles);

-- 9. Verificar políticas RLS ativas
SELECT 
    'POLITICAS_RLS' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'time_off', 'holidays', 'factories')
ORDER BY tablename, policyname;

-- 10. Status do RLS nas tabelas
SELECT 
    'RLS_STATUS' as info,
    tablename,
    rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'time_off', 'holidays', 'factories'); 