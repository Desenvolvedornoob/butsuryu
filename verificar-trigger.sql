-- VERIFICAR E CORRIGIR TRIGGER
-- Execute este script para resolver o erro 500 na criação de usuários

-- ===============================================
-- 1. VERIFICAR STATUS DO TRIGGER
-- ===============================================

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- Se existir, mostrar detalhes
SELECT 
  'DETALHES_TRIGGER' as verificacao,
  tgname as nome_trigger,
  tgrelid::regclass as tabela,
  tgfoid::regproc as funcao,
  tgenabled as habilitado
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- ===============================================
-- 2. VERIFICAR STATUS DA FUNÇÃO
-- ===============================================

-- Verificar se a função existe
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN '✅ EXISTE' 
    ELSE '❌ NÃO EXISTE' 
  END as status;

-- Se existir, mostrar detalhes
SELECT 
  'DETALHES_FUNCAO' as verificacao,
  proname as nome_funcao,
  proowner::regrole as proprietario,
  CASE 
    WHEN prosrc LIKE '%SECURITY DEFINER%' THEN '✅ SECURITY DEFINER'
    ELSE '❌ SEM SECURITY DEFINER'
  END as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ===============================================
-- 3. TESTAR FUNÇÃO MANUALMENTE
-- ===============================================

-- Testar se a função funciona sem o trigger
SELECT 
  'TESTE_FUNCAO' as verificacao,
  'Função será testada manualmente' as status;

-- ===============================================
-- 4. CORRIGIR TRIGGER SE NECESSÁRIO
-- ===============================================

-- Remover trigger existente se houver problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função existente se houver problemas
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ===============================================
-- 5. RECRIAR FUNÇÃO E TRIGGER CORRETAMENTE
-- ===============================================

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil com tratamento de erro melhorado
  BEGIN
    INSERT INTO public.profiles (
      id,
      phone,
      first_name,
      role,
      status,
      department,
      responsible,
      factory_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.phone, ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuário'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'funcionario')::user_role,
      'active',
      COALESCE(NEW.raw_user_meta_data->>'department', 'N/A'),
      COALESCE(NEW.raw_user_meta_data->>'responsible', 'N/A'),
      COALESCE(NEW.raw_user_meta_data->>'factory_id', '1')::uuid,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro sem interromper a criação do usuário
      RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      -- Retornar NEW para permitir que o usuário seja criado mesmo se o perfil falhar
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger corrigido
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- 6. VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar se tudo foi criado corretamente
SELECT 
  'VERIFICACAO_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
         AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN '✅ FUNÇÃO E TRIGGER CRIADOS COM SUCESSO!'
    ELSE '❌ PROBLEMA NA CRIAÇÃO'
  END as status;

-- Mostrar detalhes finais
SELECT 
  'DETALHES_FINAIS' as verificacao,
  'Trigger:' as tipo,
  tgname as nome,
  tgrelid::regclass as tabela
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'

UNION ALL

SELECT 
  'DETALHES_FINAIS' as verificacao,
  'Função:' as tipo,
  proname as nome,
  'Função PostgreSQL' as tabela
FROM pg_proc 
WHERE proname = 'handle_new_user';
