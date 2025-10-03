-- Verificar se os textos dos cards existem no banco
SELECT 
    language,
    category,
    text_key,
    text_value,
    created_at
FROM site_texts 
WHERE category = 'dashboard' 
AND text_key LIKE 'cards.%'
ORDER BY language, text_key;

-- Contar quantos textos existem
SELECT 
    COUNT(*) as total_textos,
    language
FROM site_texts 
WHERE category = 'dashboard' 
AND text_key LIKE 'cards.%'
GROUP BY language;
