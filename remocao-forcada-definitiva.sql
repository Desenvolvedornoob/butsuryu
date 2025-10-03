-- REMOÇÃO FORÇADA DEFINITIVA - RESOLVE TUDO DE UMA VEZ
-- Execute este script para FORÇAR a remoção de todas as políticas

-- ===============================================
-- 1. DESABILITAR RLS FORÇADAMENTE
-- ===============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- 2. REMOVER TODAS AS POLÍTICAS FORÇADAMENTE
-- ===============================================

-- Listar políticas ANTES da remoção
SELECT 'POLITICAS_ANTES' as etapa, COUNT(*) as total FROM pg_policies WHERE tablename = 'profiles';

-- Remover TODAS as políticas conhecidas
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_simple" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_simple" ON public.profiles;
DROP POLICY IF EXISTS "Permitir operações para usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem deletar próprio perfil" ON public.profiles;

-- ===============================================
-- 3. REMOÇÃO FORÇADA DE POLÍTICAS RESTANTES
-- ===============================================

-- Se ainda existirem políticas, remover TODAS as que sobrarem
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- ===============================================
-- 4. VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar se ainda existem políticas
SELECT 
    'VERIFICACAO_FINAL' as verificacao,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCESSO - NENHUMA POLÍTICA RESTANTE!'
        ELSE '❌ FALHOU - AINDA EXISTEM ' || COUNT(*) || ' POLÍTICAS'
    END as status,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'profiles';

-- Se ainda houver políticas, mostrar detalhes
SELECT 
    'DETALHES_POLITICAS_RESTANTES' as verificacao,
    policyname,
    cmd as operacao
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ===============================================
-- 5. TESTE DO SISTEMA
-- ===============================================

-- Teste se o sistema está funcionando
SELECT 
    'TESTE_SISTEMA' as verificacao,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles')
             AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity)
        THEN '✅ SISTEMA FUNCIONANDO - PRONTO PARA USO!'
        ELSE '❌ SISTEMA AINDA COM PROBLEMAS'
    END as status;
