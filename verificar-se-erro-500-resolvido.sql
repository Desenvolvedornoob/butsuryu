-- Verificar se o Erro 500 foi Resolvido
-- Este script confirma que os dados estão corretos

-- 1. Verificar valores finais de role
SELECT 'Valores finais de role:' as info, role, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY role;

-- 2. Verificar valores finais de status
SELECT 'Valores finais de status:' as info, status, COUNT(*) as quantidade
FROM public.profiles 
GROUP BY status;

-- 3. Verificar se há perfis com dados nulos importantes
SELECT 'Perfis com dados nulos:' as info, COUNT(*) as quantidade
FROM public.profiles 
WHERE id IS NULL OR role IS NULL OR status IS NULL;

-- 4. Mostrar uma amostra dos perfis mais recentes
SELECT 'Amostra de perfis:' as info, id, first_name, last_name, phone, role, status
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 3;

-- 5. Verificar se há usuários sem perfil correspondente
SELECT 'Usuários sem perfil:' as info, COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL; 