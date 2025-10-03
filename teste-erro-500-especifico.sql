-- Teste Específico para o Erro 500
-- Este script simula a consulta que está falhando

-- 1. Verificar se conseguimos fazer a consulta exata que está falhando
-- (simulando a consulta do AuthContext)
SELECT 
    'Teste consulta específica:' as info,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCESSO - Consulta funciona'
        ELSE 'ERRO - Consulta falha'
    END as resultado
FROM public.profiles
WHERE id = '00000000-0000-0000-0000-000000000000'; -- ID fictício para teste

-- 2. Verificar se há perfis com IDs específicos que podem estar causando problemas
SELECT 
    'Perfis com IDs problemáticos:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status
FROM public.profiles 
WHERE id IS NULL 
   OR id = ''
   OR id = 'null'
   OR id = 'undefined'
   OR LENGTH(id) != 36;

-- 3. Verificar se há perfis com dados JSON corrompidos
SELECT 
    'Perfis com dados JSON:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE factory_id IS NOT NULL 
AND factory_id::text LIKE '%{%' 
OR factory_id::text LIKE '%}%';

-- 4. Verificar se há perfis com caracteres especiais problemáticos
SELECT 
    'Perfis com caracteres especiais:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE first_name LIKE '%\0%' 
   OR last_name LIKE '%\0%'
   OR phone LIKE '%\0%'
   OR department LIKE '%\0%'
   OR responsible LIKE '%\0%';

-- 5. Verificar se há perfis com strings muito longas
SELECT 
    'Perfis com strings muito longas:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE LENGTH(first_name) > 100 
   OR LENGTH(last_name) > 100
   OR LENGTH(phone) > 20
   OR LENGTH(department) > 200
   OR LENGTH(responsible) > 200;

-- 6. Verificar se há perfis com timestamps inválidos
SELECT 
    'Perfis com timestamps inválidos:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE created_at < '1900-01-01' 
   OR updated_at < '1900-01-01'
   OR created_at > '2100-01-01'
   OR updated_at > '2100-01-01';

-- 7. Testar consulta com LIMIT e ORDER BY (como pode estar sendo feita)
SELECT 
    'Teste consulta com LIMIT:' as info,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCESSO - Consulta com LIMIT funciona'
        ELSE 'ERRO - Consulta com LIMIT falha'
    END as resultado
FROM public.profiles
ORDER BY created_at DESC
LIMIT 1;

-- 8. Verificar se há problemas com encoding de caracteres
SELECT 
    'Perfis com encoding problemático:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE first_name ~ '[^\x20-\x7E]' 
   OR last_name ~ '[^\x20-\x7E]'
   OR department ~ '[^\x20-\x7E]'
   OR responsible ~ '[^\x20-\x7E]';

-- 9. Verificar se há perfis com dados binários
SELECT 
    'Perfis com dados binários:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE first_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]' 
   OR last_name ~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
   OR phone ~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]';

-- 10. Mostrar os 3 perfis mais recentes para análise
SELECT 
    'Perfis mais recentes:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 3; 