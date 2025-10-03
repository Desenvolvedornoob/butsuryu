-- Verificar os últimos textos salvos no banco de dados
SELECT 
  language,
  category,
  text_key,
  text_value,
  updated_at
FROM site_texts
WHERE language = 'pt-BR'
  AND category = 'navbar'
ORDER BY updated_at DESC
LIMIT 20;
