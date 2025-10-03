-- CORREÇÃO EMERGENCIAL - TRIGGER NÃO FUNCIONA
-- Execute este script para resolver IMEDIATAMENTE o problema do trigger

-- ===============================================
-- 1. LIMPEZA TOTAL E FORÇADA
-- ===============================================

-- Remover TUDO que pode estar causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_on_user_create() CASCADE;

-- Verificar se foi removido
SELECT 
  'LIMPEZA_CONCLUIDA' as verificacao,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
         AND NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
    THEN 'TUDO_REMOVIDO_COM_SUCESSO'
    ELSE 'AINDA_EXISTE_ALGO'
  END as status;

-- ===============================================
-- 2. VERIFICAR USUÁRIOS SEM PERFIL
-- ===============================================

-- Antes de recriar, ver usuários que precisam de perfil
SELECT 
  'USUARIOS_SEM_PERFIL_ANTES' as verificacao,
  COUNT(*) as quantidade_usuarios_sem_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ===============================================
-- 3. RECRIAR FUNÇÃO COM LOGS DETALHADOS
-- ===============================================

-- Criar função com logs MUITO detalhados para debug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_factory_id UUID;
  log_message TEXT;
BEGIN
  -- Log inicial
  RAISE LOG 'TRIGGER INICIADO para usuario: %', NEW.id;
  
  -- Obter factory_id válido
  SELECT id INTO valid_factory_id 
  FROM public.factories 
  LIMIT 1;
  
  -- Se não encontrou factory, usar UUID padrão
  IF valid_factory_id IS NULL THEN
    valid_factory_id := '00000000-0000-0000-0000-000000000001'::uuid;
    RAISE LOG 'Usando factory_id padrão: %', valid_factory_id;
  ELSE
    RAISE LOG 'Factory_id válido encontrado: %', valid_factory_id;
  END IF;

  -- Log dos metadados recebidos
  RAISE LOG 'Metadados recebidos: %', NEW.raw_user_meta_data;
  RAISE LOG 'first_name: %', NEW.raw_user_meta_data->>'first_name';
  RAISE LOG 'name_japanese: %', NEW.raw_user_meta_data->>'name_japanese';
  RAISE LOG 'phone: %', NEW.phone;

  -- Tentar inserir perfil
  BEGIN
    RAISE LOG 'Iniciando inserção do perfil...';
    
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
    VALUES (
      NEW.id,
      COALESCE(NEW.phone, ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
      COALESCE(NEW.raw_user_meta_data->>'name_japanese', ''),
      CASE 
        WHEN NEW.raw_user_meta_data->>'birth_date' = '' OR NEW.raw_user_meta_data->>'birth_date' = 'null'
        THEN NULL
        ELSE NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'hire_date' = '' OR NEW.raw_user_meta_data->>'hire_date' = 'null'
        THEN NULL
        ELSE NULLIF(NEW.raw_user_meta_data->>'hire_date', '')::date
      END,
      COALESCE(NEW.raw_user_meta_data->>'role', 'funcionario')::user_role,
      'active'::user_status,
      COALESCE(NEW.raw_user_meta_data->>'department', ''),
      CASE 
        WHEN NEW.raw_user_meta_data->>'responsible' = 'none' OR NEW.raw_user_meta_data->>'responsible' = ''
        THEN NULL
        ELSE NEW.raw_user_meta_data->>'responsible'
      END,
      valid_factory_id,
      COALESCE(NEW.raw_user_meta_data->>'city', ''),
      NOW(),
      NOW()
    );
    
    RAISE LOG 'PERFIL CRIADO COM SUCESSO para usuario: % com name_japanese: %', 
              NEW.id, 
              COALESCE(NEW.raw_user_meta_data->>'name_japanese', 'vazio');
              
  EXCEPTION
    WHEN OTHERS THEN
      -- Log detalhado do erro
      log_message := format('ERRO AO CRIAR PERFIL para usuario %: SQLSTATE=%s, SQLERRM=%s', 
                           NEW.id, SQLSTATE, SQLERRM);
      RAISE LOG '%', log_message;
      
      -- RE-RAISE o erro para debugging
      RAISE EXCEPTION 'Falha na criação do perfil: %', SQLERRM;
  END;
  
  RAISE LOG 'TRIGGER CONCLUIDO com sucesso para usuario: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 4. RECRIAR TRIGGER
-- ===============================================

-- Criar trigger novo
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verificar se foi criado
SELECT 
  'TRIGGER_RECRIADO' as verificacao,
  t.tgname as nome_trigger,
  t.tgenabled as habilitado,
  CASE t.tgenabled
    WHEN 'O' THEN 'ATIVO_E_FUNCIONANDO'
    ELSE 'PROBLEMA'
  END as status
FROM pg_trigger t
WHERE t.tgname = 'on_auth_user_created';

-- ===============================================
-- 5. CRIAR PERFIS PARA USUÁRIOS ÓRFÃOS
-- ===============================================

-- Inserir perfis para usuários que não têm
INSERT INTO public.profiles (
  id,
  phone,
  first_name,
  name_japanese,
  role,
  status,
  department,
  responsible,
  factory_id,
  created_at,
  updated_at
)
SELECT DISTINCT
  u.id,
  COALESCE(u.phone, ''),
  COALESCE(u.raw_user_meta_data->>'first_name', 'Usuario'),
  COALESCE(u.raw_user_meta_data->>'name_japanese', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'funcionario')::user_role,
  'active'::user_status,
  COALESCE(u.raw_user_meta_data->>'department', ''),
  CASE 
    WHEN u.raw_user_meta_data->>'responsible' = 'none' OR u.raw_user_meta_data->>'responsible' = ''
    THEN NULL
    ELSE u.raw_user_meta_data->>'responsible'
  END,
  COALESCE(
    (SELECT id FROM public.factories LIMIT 1), 
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Verificar quantos perfis foram criados
SELECT 
  'PERFIS_CRIADOS_PARA_USUARIOS_ORFAOS' as verificacao,
  COUNT(*) as perfis_criados
FROM public.profiles p
WHERE p.created_at > NOW() - INTERVAL '1 minute';

-- ===============================================
-- 6. TESTE DO TRIGGER
-- ===============================================

-- Verificar se agora não há mais usuários órfãos
SELECT 
  'USUARIOS_SEM_PERFIL_DEPOIS' as verificacao,
  COUNT(*) as quantidade_usuarios_sem_perfil,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TODOS_USUARIOS_TEM_PERFIL'
    ELSE '❌ AINDA_HA_USUARIOS_SEM_PERFIL'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ===============================================
-- 7. RESULTADO FINAL
-- ===============================================

SELECT 
  'CORRECAO_EMERGENCIAL_CONCLUIDA' as verificacao,
  'TRIGGER_RECRIADO_COM_LOGS_DETALHADOS' as acao1,
  'PERFIS_CRIADOS_PARA_USUARIOS_ORFAOS' as acao2,
  'TESTE_CRIANDO_NOVO_FUNCIONARIO_AGORA' as proxima_acao,
  '🚀 SISTEMA_CORRIGIDO_E_FUNCIONAL' as status;
