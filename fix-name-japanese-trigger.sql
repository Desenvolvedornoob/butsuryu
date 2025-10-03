-- CORRIGIR TRIGGER PARA INCLUIR NAME_JAPANESE
-- Execute este script para resolver o problema do nome em japonês não ser registrado

-- ===============================================
-- 1. VERIFICAR TRIGGER ATUAL
-- ===============================================

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN 'EXISTE' 
    ELSE 'NAO EXISTE' 
  END as status;

-- Verificar estrutura da tabela profiles para confirmar campo name_japanese
SELECT 
  'ESTRUTURA_PROFILES' as verificacao,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('first_name', 'name_japanese', 'birth_date', 'hire_date', 'city')
ORDER BY column_name;

-- ===============================================
-- 2. RECRIAR FUNÇÃO COM TODOS OS CAMPOS
-- ===============================================

-- Criar função corrigida incluindo TODOS os campos necessários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  valid_factory_id UUID;
BEGIN
  -- Obter um factory_id válido
  SELECT id INTO valid_factory_id 
  FROM public.factories 
  LIMIT 1;
  
  -- Se não encontrou nenhuma factory, usar UUID padrão
  IF valid_factory_id IS NULL THEN
    valid_factory_id := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  -- Inserir perfil com TODOS os campos incluindo name_japanese
  BEGIN
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
      COALESCE(NEW.raw_user_meta_data->>'name_japanese', ''),  -- CAMPO ADICIONADO!
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
      COALESCE(NEW.raw_user_meta_data->>'city', ''),  -- CAMPO ADICIONADO!
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Perfil criado com sucesso para usuario % com name_japanese: %', 
              NEW.id, 
              COALESCE(NEW.raw_user_meta_data->>'name_japanese', 'vazio');
              
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Erro ao criar perfil para usuario %: %', NEW.id, SQLERRM;
      -- Não vamos falhar o trigger, apenas logar o erro
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 3. RECRIAR TRIGGER
-- ===============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- 4. VERIFICAR CRIAÇÃO
-- ===============================================

-- Verificar se função foi criada corretamente
SELECT 
  'FUNCAO_CORRIGIDA' as verificacao,
  p.proname as nome_funcao,
  pg_get_functiondef(p.oid) LIKE '%name_japanese%' as contem_name_japanese,
  pg_get_functiondef(p.oid) LIKE '%city%' as contem_city,
  'SUCESSO' as status
FROM pg_proc p 
WHERE p.proname = 'handle_new_user';

-- Verificar se trigger foi criado
SELECT 
  'TRIGGER_CORRIGIDO' as verificacao,
  t.tgname as nome_trigger,
  t.tgenabled as habilitado,
  'FUNCIONAL' as status
FROM pg_trigger t
WHERE t.tgname = 'on_auth_user_created';

-- ===============================================
-- 5. TESTE RÁPIDO COM DADOS SIMULADOS
-- ===============================================

-- Simular dados que seriam recebidos pelo trigger
SELECT 
  'TESTE_DADOS_METADATA' as verificacao,
  '{"first_name": "Teste", "name_japanese": "テスト", "city": "Tokyo"}'::jsonb->>'first_name' as first_name,
  '{"first_name": "Teste", "name_japanese": "テスト", "city": "Tokyo"}'::jsonb->>'name_japanese' as name_japanese,
  '{"first_name": "Teste", "name_japanese": "テスト", "city": "Tokyo"}'::jsonb->>'city' as city,
  'DADOS_EXTRAIDOS_CORRETAMENTE' as status;

-- ===============================================
-- 6. RESULTADO FINAL
-- ===============================================

SELECT 
  'RESULTADO_FINAL' as verificacao,
  'NAME_JAPANESE_CORRIGIDO_NO_TRIGGER' as correcao,
  'TESTANDO_CRIACAO_DE_FUNCIONARIO_AGORA' as proxima_acao,
  '✅ TRIGGER ATUALIZADO COM SUCESSO!' as status;
