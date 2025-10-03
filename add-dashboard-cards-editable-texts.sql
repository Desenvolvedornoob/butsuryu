-- Adicionar textos dos cards do dashboard para edição
-- Primeiro em português, depois você pode editar para japonês

-- Inserir textos dos cards do dashboard em português (para edição posterior)
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
-- Cards do Dashboard - Português
('pt-BR', 'dashboard', 'cards.approval.title', 'Aprovação de Solicitações'),
('pt-BR', 'dashboard', 'cards.approval.description', 'Aprove ou rejeite solicitações de folga'),
('pt-BR', 'dashboard', 'cards.approval.button', 'Gerenciar Aprovações'),

('pt-BR', 'dashboard', 'cards.employees.title', 'Gestão de Funcionários'),
('pt-BR', 'dashboard', 'cards.employees.description', 'Gerencie funcionários e suas informações'),
('pt-BR', 'dashboard', 'cards.employees.button', 'Gerenciar Funcionários'),

('pt-BR', 'dashboard', 'cards.factories.title', 'Fábricas'),
('pt-BR', 'dashboard', 'cards.factories.description', 'Gerencie as fábricas e suas configurações'),
('pt-BR', 'dashboard', 'cards.factories.button', 'Gerenciar Fábricas'),

('pt-BR', 'dashboard', 'cards.groups.title', 'Grupos'),
('pt-BR', 'dashboard', 'cards.groups.description', 'Gerencie os grupos de trabalho e turnos'),
('pt-BR', 'dashboard', 'cards.groups.button', 'Gerenciar Grupos'),

('pt-BR', 'dashboard', 'cards.absence.title', 'Registro de Faltas'),
('pt-BR', 'dashboard', 'cards.absence.description', 'Registre faltas dos funcionários'),
('pt-BR', 'dashboard', 'cards.absence.button', 'Registrar Faltas'),

('pt-BR', 'dashboard', 'cards.data.title', 'Dados e Relatórios'),
('pt-BR', 'dashboard', 'cards.data.description', 'Visualize gráficos e relatórios completos'),
('pt-BR', 'dashboard', 'cards.data.button', 'Ver Dados'),

('pt-BR', 'dashboard', 'cards.monitoring.title', 'Monitoramento'),
('pt-BR', 'dashboard', 'cards.monitoring.description', 'Acompanhe eventos de hoje e próximos'),
('pt-BR', 'dashboard', 'cards.monitoring.button', 'Ver Monitoramento'),

('pt-BR', 'dashboard', 'cards.dismissals.title', 'Desligamentos'),
('pt-BR', 'dashboard', 'cards.dismissals.description', 'Análise de desligamentos de funcionários'),
('pt-BR', 'dashboard', 'cards.dismissals.button', 'Ver Desligamentos'),

('pt-BR', 'dashboard', 'cards.myData.title', 'Meus Dados'),
('pt-BR', 'dashboard', 'cards.myData.description', 'Visualize suas estatísticas pessoais'),
('pt-BR', 'dashboard', 'cards.myData.button', 'Ver Meus Dados'),

-- Cards do Dashboard - Japonês (placeholder para você editar)
('jp', 'dashboard', 'cards.approval.title', 'Aprovação de Solicitações'),
('jp', 'dashboard', 'cards.approval.description', 'Aprove ou rejeite solicitações de folga'),
('jp', 'dashboard', 'cards.approval.button', 'Gerenciar Aprovações'),

('jp', 'dashboard', 'cards.employees.title', 'Gestão de Funcionários'),
('jp', 'dashboard', 'cards.employees.description', 'Gerencie funcionários e suas informações'),
('jp', 'dashboard', 'cards.employees.button', 'Gerenciar Funcionários'),

('jp', 'dashboard', 'cards.factories.title', 'Fábricas'),
('jp', 'dashboard', 'cards.factories.description', 'Gerencie as fábricas e suas configurações'),
('jp', 'dashboard', 'cards.factories.button', 'Gerenciar Fábricas'),

('jp', 'dashboard', 'cards.groups.title', 'Grupos'),
('jp', 'dashboard', 'cards.groups.description', 'Gerencie os grupos de trabalho e turnos'),
('jp', 'dashboard', 'cards.groups.button', 'Gerenciar Grupos'),

('jp', 'dashboard', 'cards.absence.title', 'Registro de Faltas'),
('jp', 'dashboard', 'cards.absence.description', 'Registre faltas dos funcionários'),
('jp', 'dashboard', 'cards.absence.button', 'Registrar Faltas'),

('jp', 'dashboard', 'cards.data.title', 'Dados e Relatórios'),
('jp', 'dashboard', 'cards.data.description', 'Visualize gráficos e relatórios completos'),
('jp', 'dashboard', 'cards.data.button', 'Ver Dados'),

('jp', 'dashboard', 'cards.monitoring.title', 'Monitoramento'),
('jp', 'dashboard', 'cards.monitoring.description', 'Acompanhe eventos de hoje e próximos'),
('jp', 'dashboard', 'cards.monitoring.button', 'Ver Monitoramento'),

('jp', 'dashboard', 'cards.dismissals.title', 'Desligamentos'),
('jp', 'dashboard', 'cards.dismissals.description', 'Análise de desligamentos de funcionários'),
('jp', 'dashboard', 'cards.dismissals.button', 'Ver Desligamentos'),

('jp', 'dashboard', 'cards.myData.title', 'Meus Dados'),
('jp', 'dashboard', 'cards.myData.description', 'Visualize suas estatísticas pessoais'),
('jp', 'dashboard', 'cards.myData.button', 'Ver Meus Dados')

ON CONFLICT (language, category, text_key) 
DO UPDATE SET 
    text_value = EXCLUDED.text_value,
    updated_at = NOW();
