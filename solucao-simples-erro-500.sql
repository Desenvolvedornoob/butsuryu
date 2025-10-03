-- Solução Simples para o Erro 500
-- Este script resolve o problema de perfis com role/status vazios

-- 1. Verificar se há perfis com role vazia
SELECT 'Perfis com role vazia:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE role = '';

-- 2. Verificar se há perfis com status vazio  
SELECT 'Perfis com status vazio:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE status = '';

-- 3. Corrigir perfis com role vazia
UPDATE public.profiles SET role = 'funcionario' WHERE role = '';

-- 4. Corrigir perfis com status vazio
UPDATE public.profiles SET status = 'active' WHERE status = '';

-- 5. Verificar se a correção funcionou
SELECT 'Perfis corrigidos - role:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE role = 'funcionario';

SELECT 'Perfis corrigidos - status:' as info, COUNT(*) as quantidade  
FROM public.profiles WHERE status = 'active';

-- 6. Confirmar que não há mais perfis com enums vazios
SELECT 'Perfis ainda com role vazia:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE role = '';

SELECT 'Perfis ainda com status vazio:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE status = ''; 