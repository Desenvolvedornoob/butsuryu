-- Teste simples para inserir um texto em japonês
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
('jp', 'dashboard', 'cards.approval.title', '申請承認')
ON CONFLICT (language, category, text_key) 
DO UPDATE SET 
    text_value = EXCLUDED.text_value,
    updated_at = NOW();

-- Verificar se foi inserido
SELECT * FROM site_texts WHERE text_key = 'cards.approval.title' AND language = 'jp';
