-- Script final para inserir os cards do dashboard
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, limpar textos existentes dos cards (opcional)
DELETE FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%';

-- Inserir os textos dos cards em japonês
INSERT INTO site_texts (language, category, text_key, text_value) VALUES
-- Cards do Dashboard em Japonês
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

-- Verificar se foram inseridos
SELECT 
    language,
    category,
    text_key,
    text_value
FROM site_texts 
WHERE language = 'jp' 
AND category = 'dashboard' 
AND text_key LIKE 'cards.%'
ORDER BY text_key;
