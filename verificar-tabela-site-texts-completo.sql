-- 🔍 VERIFICAÇÃO COMPLETA DA TABELA site_texts
-- Execute este SQL no Supabase para diagnosticar o problema

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'site_texts';

-- 2. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'site_texts'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'site_texts';

-- 4. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'site_texts';

-- 5. Verificar se há dados na tabela
SELECT COUNT(*) as total_registros FROM site_texts;

-- 6. Verificar permissões do usuário atual
SELECT 
    has_table_privilege('site_texts', 'SELECT') as pode_ler,
    has_table_privilege('site_texts', 'INSERT') as pode_inserir,
    has_table_privilege('site_texts', 'UPDATE') as pode_atualizar,
    has_table_privilege('site_texts', 'DELETE') as pode_deletar;

-- 7. Verificar se o usuário atual tem perfil
SELECT 
    id,
    role,
    status
FROM profiles 
WHERE id = auth.uid();

-- 8. Testar inserção de dados
INSERT INTO site_texts (language, category, text_key, text_value) 
VALUES ('pt-BR', 'teste', 'teste_verificacao', 'Teste de verificação - ' || NOW())
ON CONFLICT (language, category, text_key) 
DO UPDATE SET text_value = EXCLUDED.text_value;

-- 9. Verificar se o teste foi inserido
SELECT * FROM site_texts WHERE text_key = 'teste_verificacao';

-- 10. Limpar dados de teste
DELETE FROM site_texts WHERE text_key = 'teste_verificacao';
