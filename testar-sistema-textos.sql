-- Teste completo do sistema de textos
-- Execute este SQL para verificar se tudo está funcionando

-- 1. Verificar se a tabela existe
SELECT 'Tabela existe?' as status, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_texts') 
            THEN 'SIM' 
            ELSE 'NÃO' 
       END as resultado;

-- 2. Verificar políticas RLS
SELECT 'Políticas RLS' as status, COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'site_texts';

-- 3. Testar inserção de dados (simular o que o sistema faz)
INSERT INTO site_texts (language, category, text_key, text_value) 
VALUES ('pt-BR', 'test', 'test_key', 'Teste de funcionamento')
ON CONFLICT (language, category, text_key) 
DO UPDATE SET text_value = EXCLUDED.text_value;

-- 4. Verificar se o dado foi inserido
SELECT 'Dados inseridos?' as status,
       CASE WHEN EXISTS (SELECT 1 FROM site_texts WHERE text_key = 'test_key') 
            THEN 'SIM' 
            ELSE 'NÃO' 
       END as resultado;

-- 5. Mostrar dados de teste
SELECT language, category, text_key, text_value, created_at
FROM site_texts 
WHERE text_key = 'test_key';

-- 6. Limpar dados de teste
DELETE FROM site_texts WHERE text_key = 'test_key';

-- 7. Verificar permissões do usuário atual
SELECT 'Usuário atual' as info, auth.uid() as user_id;

-- 8. Verificar se o usuário tem perfil
SELECT 'Perfil existe?' as status,
       CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) 
            THEN 'SIM' 
            ELSE 'NÃO' 
       END as resultado;

-- 9. Verificar role do usuário
SELECT 'Role do usuário' as info, role
FROM profiles 
WHERE id = auth.uid();
