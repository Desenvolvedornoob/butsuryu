-- Corrigir Perfis com Role Vazia
-- Este script corrige perfis que têm role vazia, o que pode estar causando o erro 500

-- 1. Primeiro, verificar quantos perfis têm role vazia
SELECT 
    'Perfis com role vazia encontrados:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = '';

-- 2. Mostrar os perfis com role vazia
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

-- 3. Corrigir perfis com role vazia (definir como 'funcionario')
UPDATE public.profiles 
SET 
    role = 'funcionario',
    updated_at = NOW()
WHERE role = '';

-- 4. Verificar se a correção funcionou
SELECT 
    'Perfis corrigidos:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = 'funcionario' 
AND updated_at >= NOW() - INTERVAL '1 minute';

-- 5. Verificar se ainda há perfis com role vazia
SELECT 
    'Perfis ainda com role vazia:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role = '';

-- 6. Mostrar uma amostra dos perfis corrigidos
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
WHERE role = 'funcionario' 
AND updated_at >= NOW() - INTERVAL '1 minute'
LIMIT 5; 