-- Script para limpar dados inconsistentes e inserir textos dos cards corretamente
-- Execute este SQL no Supabase SQL Editor

-- 1. Limpar todos os textos existentes dos cards
DELETE FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%';

-- 2. Limpar também textos em português dos cards (para garantir consistência)
DELETE FROM site_texts 
WHERE language = 'pt-BR' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%';

-- 3. Inserir textos dos cards em português
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
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
('pt-BR', 'dashboard', 'cards.myData.button', 'Ver Meus Dados');

-- 4. Inserir textos dos cards em japonês
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
('jp', 'dashboard', 'cards.approval.title', '申請承認'),
('jp', 'dashboard', 'cards.approval.description', '休暇申請の承認・却下を行います'),
('jp', 'dashboard', 'cards.approval.button', '承認管理'),

('jp', 'dashboard', 'cards.employees.title', '従業員管理'),
('jp', 'dashboard', 'cards.employees.description', '従業員情報の管理を行います'),
('jp', 'dashboard', 'cards.employees.button', '従業員管理'),

('jp', 'dashboard', 'cards.factories.title', '工場管理'),
('jp', 'dashboard', 'cards.factories.description', '工場とその設定を管理します'),
('jp', 'dashboard', 'cards.factories.button', '工場管理'),

('jp', 'dashboard', 'cards.groups.title', 'グループ管理'),
('jp', 'dashboard', 'cards.groups.description', '作業グループとシフトを管理します'),
('jp', 'dashboard', 'cards.groups.button', 'グループ管理'),

('jp', 'dashboard', 'cards.absence.title', '欠勤登録'),
('jp', 'dashboard', 'cards.absence.description', '従業員の欠勤を登録します'),
('jp', 'dashboard', 'cards.absence.button', '欠勤登録'),

('jp', 'dashboard', 'cards.data.title', 'データ・レポート'),
('jp', 'dashboard', 'cards.data.description', 'グラフとレポートを表示します'),
('jp', 'dashboard', 'cards.data.button', 'データ表示'),

('jp', 'dashboard', 'cards.monitoring.title', 'モニタリング'),
('jp', 'dashboard', 'cards.monitoring.description', '今日と今後のイベントを確認します'),
('jp', 'dashboard', 'cards.monitoring.button', 'モニタリング'),

('jp', 'dashboard', 'cards.dismissals.title', '退職管理'),
('jp', 'dashboard', 'cards.dismissals.description', '従業員の退職を分析します'),
('jp', 'dashboard', 'cards.dismissals.button', '退職管理'),

('jp', 'dashboard', 'cards.myData.title', 'マイデータ'),
('jp', 'dashboard', 'cards.myData.description', '個人の統計データを表示します'),
('jp', 'dashboard', 'cards.myData.button', 'マイデータ');

-- 5. Verificar se foram inseridos corretamente
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
WHERE category = 'dashboard' 
AND text_key LIKE 'cards.%'
ORDER BY language, text_key;
