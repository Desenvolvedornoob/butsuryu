-- Verificar se os textos dos cards do dashboard estão no banco
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
WHERE category = 'dashboard' 
AND text_key LIKE 'cards.%'
ORDER BY language, text_key;
