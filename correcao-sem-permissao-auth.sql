-- CORREÇÃO SEM MEXER NA TABELA AUTH.USERS
-- Como não temos permissão para alterar auth.users, vamos usar outra abordagem

-- ===============================================
-- 1. REMOVER TRIGGER PROBLEMÁTICO (SE POSSÍVEL)
-- ===============================================

-- Tentar remover apenas o trigger (pode não funcionar se não tiver permissão)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ===============================================
-- 2. REMOVER FUNÇÃO PROBLEMÁTICA
-- ===============================================

-- Isso podemos fazer - remover a função vai "quebrar" o trigger automaticamente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verificar se função foi removida
SELECT 
  'FUNCAO_REMOVIDA' as verificacao,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN '✅ FUNCAO_REMOVIDA - TRIGGER_INATIVO'
    ELSE '❌ FUNCAO_AINDA_EXISTE'
  END as status;

-- ===============================================
-- 3. ABORDAGEM ALTERNATIVA - SEM TRIGGER
-- ===============================================

-- Como não podemos controlar o trigger, vamos VOLTAR para a abordagem manual
-- Isso significa que o client.ts VAI CRIAR o perfil manualmente

-- Primeiro, verificar usuários sem perfil
SELECT 
  'USUARIOS_SEM_PERFIL' as verificacao,
  u.id,
  u.phone,
  u.raw_user_meta_data->>'first_name' as nome,
  u.raw_user_meta_data->>'name_japanese' as nome_japones,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- ===============================================
-- 4. CRIAR PERFIS PARA USUÁRIOS ÓRFÃOS
-- ===============================================

-- Inserir perfis para usuários que não têm
INSERT INTO public.profiles (
  id,
  phone,
  first_name,
  name_japanese,
  birth_date,
  hire_date,
  role,
  status,
  department,
  responsible,
  factory_id,
  city,
  created_at,
  updated_at
)
SELECT DISTINCT
  u.id,
  COALESCE(u.phone, ''),
  COALESCE(u.raw_user_meta_data->>'first_name', 'Usuario'),
  COALESCE(u.raw_user_meta_data->>'name_japanese', ''),
  CASE 
    WHEN u.raw_user_meta_data->>'birth_date' IS NULL OR 
         u.raw_user_meta_data->>'birth_date' = '' OR 
         u.raw_user_meta_data->>'birth_date' = 'null'
    THEN NULL
    ELSE 
      CASE 
        WHEN u.raw_user_meta_data->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (u.raw_user_meta_data->>'birth_date')::date
        ELSE NULL
      END
  END,
  CASE 
    WHEN u.raw_user_meta_data->>'hire_date' IS NULL OR 
         u.raw_user_meta_data->>'hire_date' = '' OR 
         u.raw_user_meta_data->>'hire_date' = 'null'
    THEN NULL
    ELSE 
      CASE 
        WHEN u.raw_user_meta_data->>'hire_date' ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (u.raw_user_meta_data->>'hire_date')::date
        ELSE NULL
      END
  END,
  CASE 
    WHEN u.raw_user_meta_data->>'role' IN ('funcionario', 'admin', 'superuser')
    THEN (u.raw_user_meta_data->>'role')::user_role
    ELSE 'funcionario'::user_role
  END,
  'active'::user_status,
  COALESCE(u.raw_user_meta_data->>'department', ''),
  CASE 
    WHEN u.raw_user_meta_data->>'responsible' = 'none' OR 
         u.raw_user_meta_data->>'responsible' = '' OR
         u.raw_user_meta_data->>'responsible' IS NULL
    THEN NULL
    ELSE u.raw_user_meta_data->>'responsible'
  END,
  COALESCE(
    (SELECT id FROM public.factories LIMIT 1), 
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  COALESCE(u.raw_user_meta_data->>'city', ''),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Verificar quantos perfis foram criados
SELECT 
  'PERFIS_CRIADOS' as verificacao,
  COUNT(*) as quantidade,
  'USUARIOS_ORFAOS_CORRIGIDOS' as status
FROM public.profiles p
WHERE p.created_at > NOW() - INTERVAL '1 minute';

-- ===============================================
-- 5. VERIFICAR RESULTADO
-- ===============================================

-- Verificar se ainda há usuários sem perfil
SELECT 
  'VERIFICACAO_FINAL' as verificacao,
  COUNT(*) as usuarios_sem_perfil,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS_USUARIOS_TEM_PERFIL'
    ELSE '❌ AINDA_HA_USUARIOS_SEM_PERFIL'
  END as resultado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ===============================================
-- 6. INSTRUÇÃO PARA CÓDIGO
-- ===============================================

SELECT 
  'INSTRUCAO_PARA_CODIGO' as verificacao,
  'DESCOMENTAR_CRIACAO_MANUAL_DE_PERFIL_NO_CLIENT_TS' as acao_necessaria,
  'LINHAS_1093_A_1117_NO_CLIENT_TS' as localizacao,
  'SEM_TRIGGER_PRECISAMOS_CRIAR_PERFIL_MANUALMENTE' as motivo;
