-- Verificar dados inconsistentes na tabela site_texts
SELECT 
    language,
    category,
    text_key,
    text_value,
    LENGTH(text_value) as tamanho_valor
FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard'
ORDER BY text_key;

-- Verificar se há textos com valores muito longos ou estranhos
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard'
AND (LENGTH(text_value) > 100 OR text_value LIKE '%Meus Dados%')
ORDER BY text_key;
