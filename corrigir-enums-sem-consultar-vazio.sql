-- Corrigir Enums sem Consultar Valores Vazios
-- Este script corrige perfis com enums inválidos sem causar erro

-- 1. Verificar todos os valores únicos de role na tabela
SELECT 'Valores únicos de role:' as info, role, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY role;

-- 2. Verificar todos os valores únicos de status na tabela
SELECT 'Valores únicos de status:' as info, status, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY status;

-- 3. Corrigir perfis com role inválida (usando CAST para evitar erro)
UPDATE public.profiles 
SET role = 'funcionario' 
WHERE role::text NOT IN ('admin', 'superuser', 'funcionario');

-- 4. Corrigir perfis com status inválido (usando CAST para evitar erro)
UPDATE public.profiles 
SET status = 'active' 
WHERE status::text NOT IN ('active', 'inactive', 'pending');

-- 5. Verificar se as correções funcionaram
SELECT 'Perfis com role funcionario:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE role = 'funcionario';

SELECT 'Perfis com status active:' as info, COUNT(*) as quantidade
FROM public.profiles WHERE status = 'active';

-- 6. Verificar valores finais de role
SELECT 'Valores finais de role:' as info, role, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY role;

-- 7. Verificar valores finais de status
SELECT 'Valores finais de status:' as info, status, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY status; 