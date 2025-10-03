-- Verificar se os textos dos cards do dashboard estão no banco
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

-- Verificar se existem textos em japonês
SELECT 
    COUNT(*) as total_textos_jp,
    'Japonês' as idioma
FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%'

UNION ALL

-- Verificar se existem textos em português
SELECT 
    COUNT(*) as total_textos_pt,
    'Português' as idioma
FROM site_texts 
WHERE language = 'pt-BR' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%';
