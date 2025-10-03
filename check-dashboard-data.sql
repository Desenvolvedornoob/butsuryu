-- Verificar dados para a dashboard
-- Execute este script no SQL Editor do Supabase

-- ===============================================
-- VERIFICAR DADOS NAS TABELAS PRINCIPAIS
-- ===============================================

-- Verificar dados na tabela requests
SELECT 'REQUESTS' as tabela, COUNT(*) as total_registros
FROM public.requests;

-- Verificar dados na tabela time_off
SELECT 'TIME_OFF' as tabela, COUNT(*) as total_registros
FROM public.time_off;

-- Verificar dados na tabela early_departures
SELECT 'EARLY_DEPARTURES' as tabela, COUNT(*) as total_registros
FROM public.early_departures;

-- Verificar dados na tabela lateness
SELECT 'LATENESS' as tabela, COUNT(*) as total_registros
FROM public.lateness;

-- ===============================================
-- VERIFICAR DADOS POR USUÁRIO (exemplo com um ID específico)
-- ===============================================

-- Substitua 'USER_ID_AQUI' pelo ID real do usuário
-- SELECT 'DADOS DO USUÁRIO' as info, 
--        (SELECT COUNT(*) FROM public.requests WHERE user_id = 'USER_ID_AQUI') as requests,
--        (SELECT COUNT(*) FROM public.time_off WHERE user_id = 'USER_ID_AQUI') as time_off,
--        (SELECT COUNT(*) FROM public.early_departures WHERE user_id = 'USER_ID_AQUI') as early_departures,
--        (SELECT COUNT(*) FROM public.lateness WHERE user_id = 'USER_ID_AQUI') as lateness;

-- ===============================================
-- VERIFICAR POLÍTICAS RLS
-- ===============================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('requests', 'time_off', 'early_departures', 'lateness') 
  AND schemaname = 'public';

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('requests', 'time_off', 'early_departures', 'lateness')
  AND schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- ===============================================
-- VERIFICAR PERFIS DE USUÁRIOS
-- ===============================================

-- Verificar perfis existentes
SELECT 
    id,
    first_name,
    role,
    status,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- ===============================================
-- TESTAR QUERY SIMILAR À DA DASHBOARD
-- ===============================================

-- Simular a query que a dashboard faz para carregar dados
-- (substitua 'USER_ID_AQUI' pelo ID real do usuário)
-- SELECT 
--     'time-off' as type,
--     status,
--     start_date as date,
--     end_date,
--     reason,
--     created_at,
--     user_id
-- FROM public.time_off 
-- WHERE user_id = 'USER_ID_AQUI'
-- UNION ALL
-- SELECT 
--     'early-departure' as type,
--     status,
--     date,
--     date as end_date,
--     reason,
--     created_at,
--     user_id
-- FROM public.early_departures 
-- WHERE user_id = 'USER_ID_AQUI'
-- UNION ALL
-- SELECT 
--     'lateness' as type,
--     status,
--     date,
--     date as end_date,
--     reason,
--     created_at,
--     user_id
-- FROM public.lateness 
-- WHERE user_id = 'USER_ID_AQUI'
-- ORDER BY created_at DESC;
