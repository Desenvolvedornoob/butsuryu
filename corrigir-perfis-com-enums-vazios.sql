-- Corrigir Perfis com Role e Status Vazios
-- Este script corrige perfis que têm role ou status vazios, causando o erro 500

-- 1. Primeiro, verificar quantos perfis têm role vazia
SELECT 
    'Perfis com role vazia encontrados:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = '';

-- 2. Verificar quantos perfis têm status vazio
SELECT 
    'Perfis com status vazio encontrados:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status = '';

-- 3. Mostrar os perfis com role vazia
SELECT 
    'Perfis com role vazia:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at
FROM public.profiles 
WHERE role = '';

-- 4. Mostrar os perfis com status vazio
SELECT 
    'Perfis com status vazio:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status,
    created_at
FROM public.profiles 
WHERE status = '';

-- 5. Corrigir perfis com role vazia (definir como 'funcionario')
UPDATE public.profiles 
SET 
    role = 'funcionario',
    updated_at = NOW()
WHERE role = '';

-- 6. Corrigir perfis com status vazio (definir como 'active')
UPDATE public.profiles 
SET 
    status = 'active',
    updated_at = NOW()
WHERE status = '';

-- 7. Verificar se as correções funcionaram
SELECT 
    'Perfis corrigidos (role):' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = 'funcionario' 
AND updated_at >= NOW() - INTERVAL '1 minute';

SELECT 
    'Perfis corrigidos (status):' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status = 'active' 
AND updated_at >= NOW() - INTERVAL '1 minute';

-- 8. Verificar se ainda há perfis com role vazia
SELECT 
    'Perfis ainda com role vazia:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = '';

-- 9. Verificar se ainda há perfis com status vazio
SELECT 
    'Perfis ainda com status vazio:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status = '';

-- 10. Mostrar uma amostra dos perfis corrigidos
SELECT 
    'Amostra dos perfis corrigidos:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status,
    updated_at
FROM public.profiles 
WHERE (role = 'funcionario' OR status = 'active')
AND updated_at >= NOW() - INTERVAL '1 minute'
LIMIT 5; 