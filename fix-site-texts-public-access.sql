-- Corrigir permissões RLS para permitir acesso público à tabela site_texts
-- Isso é necessário para que a página de login possa carregar os textos

-- Primeiro, vamos verificar as políticas existentes
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_texts';

-- Remover políticas existentes se necessário
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON site_texts;
DROP POLICY IF EXISTS "Allow write access to admins and superusers" ON site_texts;

-- Criar política de leitura pública (para usuários não autenticados)
CREATE POLICY "Allow public read access to site_texts" ON site_texts
    FOR SELECT 
    TO public
    USING (true);

-- Criar política de escrita para usuários autenticados com permissões
CREATE POLICY "Allow write access to admins and superusers" ON site_texts
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superuser')
        )
    );

-- Verificar se as políticas foram criadas corretamente
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_texts';

-- Testar se a consulta funciona para usuários anônimos
SELECT COUNT(*) as total_texts FROM site_texts WHERE language = 'pt-BR';
