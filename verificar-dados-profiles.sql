-- Verificar Dados da Tabela Profiles - Detalhado
-- Este script verifica se há problemas específicos com os dados

-- 1. Verificar perfis com dados nulos ou vazios
SELECT 
    'Perfis com problemas:' as info,
    COUNT(*) as total_problemas,
    COUNT(CASE WHEN id IS NULL THEN 1 END) as id_nulo,
    COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as phone_vazio,
    COUNT(CASE WHEN first_name IS NULL OR first_name = '' THEN 1 END) as nome_vazio,
    COUNT(CASE WHEN last_name IS NULL OR last_name = '' THEN 1 END) as sobrenome_vazio,
    COUNT(CASE WHEN role IS NULL OR role = '' THEN 1 END) as role_vazio,
    COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as status_vazio
FROM public.profiles;

-- 2. Verificar perfis com IDs inválidos (não UUID)
SELECT 
    'Perfis com ID inválido:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Verificar perfis com telefones em formato inválido
SELECT 
    'Perfis com telefone inválido:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE phone IS NOT NULL 
AND phone != '' 
AND phone !~ '^\+81[0-9]{9,10}$'
AND phone !~ '^[0-9]{10,11}$';

-- 4. Verificar perfis com roles inválidas
SELECT 
    'Perfis com role inválida:' as info,
    role,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE role NOT IN ('admin', 'superuser', 'funcionario')
GROUP BY role;

-- 5. Verificar perfis com status inválido
SELECT 
    'Perfis com status inválido:' as info,
    status,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE status NOT IN ('active', 'inactive', 'pending')
GROUP BY status;

-- 6. Verificar perfis duplicados (mesmo ID)
SELECT 
    'Perfis duplicados:' as info,
    id,
    COUNT(*) as quantidade
FROM public.profiles 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 7. Verificar perfis com datas inválidas
SELECT 
    'Perfis com data inválida:' as info,
    COUNT(*) as quantidade
FROM public.profiles 
WHERE created_at IS NULL 
OR updated_at IS NULL
OR created_at > NOW()
OR updated_at > NOW();

-- 8. Verificar perfis órfãos (sem usuário correspondente em auth.users)
SELECT 
    'Perfis órfãos:' as info,
    COUNT(*) as quantidade
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 9. Verificar usuários sem perfil (na tabela auth.users mas não em profiles)
SELECT 
    'Usuários sem perfil:' as info,
    COUNT(*) as quantidade
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 10. Mostrar uma amostra detalhada dos dados
SELECT 
    'Amostra detalhada:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status,
    department,
    factory_id,
    responsible,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5; 