-- Verificar se a tabela existe e criar se necessário
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

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_site_texts_language_category ON site_texts(language, category);
CREATE INDEX IF NOT EXISTS idx_site_texts_key ON site_texts(text_key);

-- Habilitar RLS
ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas já existem antes de criar
DO $$
BEGIN
    -- Verificar se a política de leitura existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_texts' 
        AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON site_texts
            FOR SELECT TO authenticated
            USING (true);
    END IF;
    
    -- Verificar se a política de escrita existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_texts' 
        AND policyname = 'Allow write access to admins and superusers'
    ) THEN
        CREATE POLICY "Allow write access to admins and superusers" ON site_texts
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'superuser')
                )
            );
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_site_texts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_site_texts_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_site_texts_updated_at
            BEFORE UPDATE ON site_texts
            FOR EACH ROW
            EXECUTE FUNCTION update_site_texts_updated_at();
    END IF;
END $$;

-- Inserir textos padrão em português (apenas se não existirem)
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
-- Common texts
('pt-BR', 'common', 'email', 'E-mail'),
('pt-BR', 'common', 'password', 'Senha'),
('pt-BR', 'common', 'login', 'Entrar'),
('pt-BR', 'common', 'logout', 'Sair'),
('pt-BR', 'common', 'loading', 'Carregando...'),
('pt-BR', 'common', 'save', 'Salvar'),
('pt-BR', 'common', 'cancel', 'Cancelar'),
('pt-BR', 'common', 'edit', 'Editar'),
('pt-BR', 'common', 'delete', 'Excluir'),
('pt-BR', 'common', 'confirm', 'Confirmar'),
('pt-BR', 'common', 'back', 'Voltar'),
('pt-BR', 'common', 'next', 'Próximo'),
('pt-BR', 'common', 'previous', 'Anterior'),
('pt-BR', 'common', 'search', 'Pesquisar'),
('pt-BR', 'common', 'filter', 'Filtrar'),
('pt-BR', 'common', 'all', 'Todos'),
('pt-BR', 'common', 'select', 'Selecionar'),
('pt-BR', 'common', 'language', 'Idioma'),
('pt-BR', 'common', 'portuguese', 'Português'),
('pt-BR', 'common', 'japanese', '日本語'),

-- Auth texts
('pt-BR', 'auth', 'title', 'Agenda Otics'),
('pt-BR', 'auth', 'subtitle', 'Sistema de Gestão de Funcionários'),
('pt-BR', 'auth', 'loginButton', 'Entrar'),
('pt-BR', 'auth', 'invalidCredentials', 'E-mail ou senha inválidos'),
('pt-BR', 'auth', 'loginError', 'Erro ao fazer login'),
('pt-BR', 'auth', 'welcome', 'Bem-vindo'),
('pt-BR', 'auth', 'selectLanguage', 'Selecionar Idioma'),

-- Dashboard texts
('pt-BR', 'dashboard', 'title', 'Dashboard'),
('pt-BR', 'dashboard', 'welcome', 'Bem-vindo'),
('pt-BR', 'dashboard', 'subtitle', 'Acompanhe suas folgas, saídas antecipadas, atrasos e faltas'),
('pt-BR', 'dashboard', 'myData', 'Meus Dados'),
('pt-BR', 'dashboard', 'requests', 'Solicitações'),
('pt-BR', 'dashboard', 'employees', 'Funcionários'),
('pt-BR', 'dashboard', 'factories', 'Fábricas'),
('pt-BR', 'dashboard', 'monitoring', 'Monitoramento'),
('pt-BR', 'dashboard', 'data', 'Dados e Relatórios'),
('pt-BR', 'dashboard', 'settings', 'Configurações'),

-- Navbar texts
('pt-BR', 'navbar', 'dashboard', 'Dashboard'),
('pt-BR', 'navbar', 'myData', 'Meus Dados'),
('pt-BR', 'navbar', 'requests', 'Solicitações'),
('pt-BR', 'navbar', 'employees', 'Funcionários'),
('pt-BR', 'navbar', 'factories', 'Fábricas'),
('pt-BR', 'navbar', 'monitoring', 'Monitoramento'),
('pt-BR', 'navbar', 'data', 'Dados'),
('pt-BR', 'navbar', 'profile', 'Perfil'),
('pt-BR', 'navbar', 'logout', 'Sair'),

-- Monitoring texts
('pt-BR', 'monitoring', 'title', 'Monitoramento'),
('pt-BR', 'monitoring', 'subtitle', 'Acompanhe os acontecimentos de hoje e os próximos eventos'),
('pt-BR', 'monitoring', 'todayEvents', 'Acontecimentos de Hoje'),
('pt-BR', 'monitoring', 'upcomingEvents', 'Próximos Eventos'),
('pt-BR', 'monitoring', 'employeeStats', 'Funcionários - Acontecimentos do Mês'),
('pt-BR', 'monitoring', 'distributionChart', 'Distribuição de Acontecimentos'),
('pt-BR', 'monitoring', 'yearlyTotals', 'Totais do Ano'),
('pt-BR', 'monitoring', 'selectFactory', 'Selecionar fábrica'),
('pt-BR', 'monitoring', 'allFactories', 'Todas as fábricas'),
('pt-BR', 'monitoring', 'timeOff', 'Folgas'),
('pt-BR', 'monitoring', 'earlyDeparture', 'Saídas Antecipadas'),
('pt-BR', 'monitoring', 'lateness', 'Atrasos'),
('pt-BR', 'monitoring', 'absence', 'Faltas'),
('pt-BR', 'monitoring', 'total', 'Total'),

-- Requests texts
('pt-BR', 'requests', 'title', 'Solicitações'),
('pt-BR', 'requests', 'newRequest', 'Nova Solicitação'),
('pt-BR', 'requests', 'type', 'Tipo'),
('pt-BR', 'requests', 'reason', 'Motivo'),
('pt-BR', 'requests', 'startDate', 'Data de Início'),
('pt-BR', 'requests', 'endDate', 'Data de Fim'),
('pt-BR', 'requests', 'status', 'Status'),
('pt-BR', 'requests', 'approved', 'Aprovado'),
('pt-BR', 'requests', 'pending', 'Pendente'),
('pt-BR', 'requests', 'rejected', 'Rejeitado'),

-- Employees texts
('pt-BR', 'employees', 'title', 'Funcionários'),
('pt-BR', 'employees', 'addEmployee', 'Adicionar Funcionário'),
('pt-BR', 'employees', 'name', 'Nome'),
('pt-BR', 'employees', 'email', 'E-mail'),
('pt-BR', 'employees', 'phone', 'Telefone'),
('pt-BR', 'employees', 'factory', 'Fábrica'),
('pt-BR', 'employees', 'group', 'Grupo'),
('pt-BR', 'employees', 'status', 'Status'),
('pt-BR', 'employees', 'active', 'Ativo'),
('pt-BR', 'employees', 'inactive', 'Inativo'),

-- Factories texts
('pt-BR', 'factories', 'title', 'Fábricas'),
('pt-BR', 'factories', 'addFactory', 'Adicionar Fábrica'),
('pt-BR', 'factories', 'name', 'Nome'),
('pt-BR', 'factories', 'address', 'Endereço'),
('pt-BR', 'factories', 'shifts', 'Turnos'),
('pt-BR', 'factories', 'holidays', 'Feriados'),

-- Errors texts
('pt-BR', 'errors', 'generic', 'Ocorreu um erro inesperado'),
('pt-BR', 'errors', 'network', 'Erro de conexão. Verifique sua internet.'),
('pt-BR', 'errors', 'unauthorized', 'Você não tem permissão para acessar esta página'),
('pt-BR', 'errors', 'notFound', 'Página não encontrada'),
('pt-BR', 'errors', 'serverError', 'Erro interno do servidor'),
('pt-BR', 'errors', 'validation', 'Dados inválidos'),
('pt-BR', 'errors', 'loginFailed', 'Falha no login. Verifique suas credenciais'),
('pt-BR', 'errors', 'signupFailed', 'Falha no cadastro. Tente novamente'),
('pt-BR', 'errors', 'updateFailed', 'Falha ao atualizar dados'),
('pt-BR', 'errors', 'deleteFailed', 'Falha ao excluir item'),
('pt-BR', 'errors', 'saveFailed', 'Falha ao salvar dados'),
('pt-BR', 'errors', 'loadFailed', 'Falha ao carregar dados'),

-- Success texts
('pt-BR', 'success', 'saved', 'Dados salvos com sucesso'),
('pt-BR', 'success', 'updated', 'Dados atualizados com sucesso'),
('pt-BR', 'success', 'deleted', 'Item excluído com sucesso'),
('pt-BR', 'success', 'created', 'Item criado com sucesso')

ON CONFLICT (language, category, text_key) DO NOTHING;
