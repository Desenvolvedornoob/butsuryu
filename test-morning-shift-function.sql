-- Testar a função isUserInMorningShift
-- Primeiro, vamos verificar se temos dados necessários

-- 1. Verificar se existe configuração de turno da manhã
SELECT * FROM morning_shift_setting;

-- 2. Verificar se existem configurações de turnos das fábricas
SELECT * FROM factory_shift_config;

-- 3. Verificar perfis com group_name e factory_id
SELECT id, first_name, group_name, factory_id 
FROM profiles 
WHERE group_name IS NOT NULL 
AND factory_id IS NOT NULL
LIMIT 5;

-- 4. Testar a lógica de semana atual
-- Simular a função getCurrentWeekNumber
SELECT 
  EXTRACT(WEEK FROM NOW()) as week_number,
  CASE WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN 2 ELSE 1 END as current_week;

-- 5. Verificar se há dados de teste para testar
SELECT 
  p.id,
  p.first_name,
  p.group_name,
  p.factory_id,
  fsc.turno,
  fsc.groups,
  CASE WHEN fsc.groups @> ARRAY[p.group_name] THEN 'SIM' ELSE 'NÃO' END as grupo_esta_no_turno
FROM profiles p
LEFT JOIN factory_shift_config fsc ON p.factory_id = fsc.factory_id
WHERE p.group_name IS NOT NULL 
AND p.factory_id IS NOT NULL
LIMIT 10;
