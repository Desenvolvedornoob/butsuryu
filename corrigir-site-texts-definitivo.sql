-- 🔧 CORREÇÃO DEFINITIVA DA TABELA site_texts
-- Execute este SQL no Supabase para corrigir todos os problemas

-- 1. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON site_texts;
DROP POLICY IF EXISTS "Allow write access to admins and superusers" ON site_texts;
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON site_texts;

-- 2. Remover trigger existente (se houver)
DROP TRIGGER IF EXISTS trigger_update_site_texts_updated_at ON site_texts;

-- 3. Remover função existente (se houver)
DROP FUNCTION IF EXISTS update_site_texts_updated_at();

-- 4. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS site_texts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    text_key VARCHAR(100) NOT NULL,
    text_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(language, category, text_key)
);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_site_texts_language_category ON site_texts(language, category);
CREATE INDEX IF NOT EXISTS idx_site_texts_key ON site_texts(text_key);

-- 6. Habilitar RLS
ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas simples (qualquer usuário autenticado pode ler e escrever)
CREATE POLICY "Allow all access to authenticated users" ON site_texts
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_site_texts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger
CREATE TRIGGER trigger_update_site_texts_updated_at
    BEFORE UPDATE ON site_texts
    FOR EACH ROW
    EXECUTE FUNCTION update_site_texts_updated_at();

-- 10. Inserir dados padrão
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
('pt-BR', 'navbar', 'dashboard', 'Dashboard'),
('pt-BR', 'navbar', 'myData', 'Meus Dados'),
('pt-BR', 'navbar', 'requests', 'Solicitações'),
('pt-BR', 'navbar', 'employees', 'Funcionários'),
('pt-BR', 'navbar', 'factories', 'Fábricas'),
('pt-BR', 'navbar', 'monitoring', 'Monitoramento'),
('pt-BR', 'navbar', 'data', 'Dados'),
('pt-BR', 'navbar', 'profile', 'Perfil'),
('pt-BR', 'navbar', 'logout', 'Sair')
ON CONFLICT (language, category, text_key) 
DO UPDATE SET text_value = EXCLUDED.text_value;

-- 11. Verificar se tudo funcionou
SELECT 
    'Tabela criada' as status,
    COUNT(*) as total_registros
FROM site_texts;
