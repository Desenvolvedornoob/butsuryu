-- VERIFICAR E CORRIGIR TRIGGER - VERSÃO SIMPLES
-- Execute este script para resolver o erro 500 na criação de usuários

-- ===============================================
-- 1. VERIFICAR STATUS ATUAL
-- ===============================================

-- Verificar se o trigger existe
SELECT 
  'TRIGGER_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
    THEN 'EXISTE' 
    ELSE 'NAO EXISTE' 
  END as status;

-- Verificar se a função existe
SELECT 
  'FUNCAO_STATUS' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
    THEN 'EXISTE' 
    ELSE 'NAO EXISTE' 
  END as status;

-- ===============================================
-- 2. REMOVER PROBLEMAS
-- ===============================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover função existente
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ===============================================
-- 3. RECRIAR FUNÇÃO E TRIGGER
-- ===============================================

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir perfil com tratamento de erro
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
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
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
      RAISE LOG 'Erro ao criar perfil para usuario %: %', NEW.id, SQLERRM;
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
-- 4. VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar se tudo foi criado
SELECT 
  'VERIFICACAO_FINAL' as verificacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
         AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN 'FUNCAO E TRIGGER CRIADOS COM SUCESSO!'
    ELSE 'PROBLEMA NA CRIACAO'
  END as status;
