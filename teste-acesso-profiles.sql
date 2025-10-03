-- Teste de Acesso à Tabela Profiles - SEM ALTERAR CONFIGURAÇÕES
-- Este script apenas testa se conseguimos acessar a tabela

-- Teste 1: Tentar fazer uma consulta simples
SELECT 
    'Teste de acesso básico:' as info,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCESSO - Tabela acessível'
        ELSE 'ERRO - Tabela não acessível'
    END as resultado
FROM public.profiles;

-- Teste 2: Tentar buscar um perfil específico (substitua pelo ID de um usuário existente)
-- Descomente e modifique a linha abaixo com um ID real se quiser testar
-- SELECT * FROM public.profiles WHERE id = 'ID_DO_USUARIO_AQUI' LIMIT 1;

-- Teste 3: Verificar se conseguimos fazer INSERT (apenas simulação, sem executar)
SELECT 
    'Teste de permissão INSERT:' as info,
    'Verificar se há políticas que permitem INSERT' as observacao;

-- Teste 4: Verificar se conseguimos fazer UPDATE (apenas simulação, sem executar)
SELECT 
    'Teste de permissão UPDATE:' as info,
    'Verificar se há políticas que permitem UPDATE' as observacao;

-- Teste 5: Verificar se conseguimos fazer DELETE (apenas simulação, sem executar)
SELECT 
    'Teste de permissão DELETE:' as info,
    'Verificar se há políticas que permitem DELETE' as observacao;

-- Teste 6: Verificar se há dados de teste
SELECT 
    'Dados disponíveis:' as info,
    COUNT(*) as total_perfis,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as com_nome,
    COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as com_sobrenome,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as com_telefone
FROM public.profiles; 