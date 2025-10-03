-- Diagnóstico do Erro 500 - APENAS VERIFICAÇÃO (sem alterações)
-- Este script apenas verifica o status atual sem modificar configurações

-- 1. Verificar se a tabela profiles existe e está acessível
SELECT 
    'Tabela profiles existe:' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) as resultado;

-- 2. Verificar estrutura da tabela
SELECT 
    'Estrutura da tabela:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela
SELECT 
    'Total de perfis:' as info,
    COUNT(*) as quantidade
FROM public.profiles;

-- 4. Verificar alguns registros (se houver)
SELECT 
    'Amostra de dados:' as info,
    id,
    first_name,
    last_name,
    phone,
    role,
    status
FROM public.profiles 
LIMIT 3;

-- 5. Verificar status do RLS (apenas leitura)
SELECT 
    'Status RLS:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 6. Verificar políticas RLS existentes (apenas leitura)
SELECT 
    'Políticas RLS:' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 7. Verificar se a função create_profiles_table existe
SELECT 
    'Função create_profiles_table:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_profiles_table') 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status;

-- 8. Verificar se o trigger existe
SELECT 
    'Trigger on_auth_user_created:' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ) 
        THEN 'EXISTE' 
        ELSE 'NÃO EXISTE' 
    END as status;

-- 9. Verificar usuários na tabela auth.users
SELECT 
    'Usuários auth:' as info,
    COUNT(*) as total_usuarios
FROM auth.users;

-- 10. Verificar se há usuários sem perfil correspondente
SELECT 
    'Usuários sem perfil:' as info,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL; 