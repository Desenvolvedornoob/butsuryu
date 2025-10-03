-- Verificar se os cards em japonês foram adicionados
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%'
ORDER BY text_key;
