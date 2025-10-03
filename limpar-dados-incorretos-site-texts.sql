-- Limpar todos os dados incorretos da tabela site_texts
DELETE FROM site_texts WHERE language = 'pt-BR';
DELETE FROM site_texts WHERE language = 'jp';

-- Agora os textos padrão serão inseridos automaticamente na próxima vez que você acessar o sistema
