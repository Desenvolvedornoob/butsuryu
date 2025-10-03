-- Configurar dados de teste corretos para o sistema de turnos

-- 1. Verificar configuração atual
SELECT 'CONFIGURAÇÃO ATUAL' as status;
SELECT * FROM morning_shift_setting;
SELECT * FROM factory_shift_config;
SELECT id, first_name, group_name, factory_id FROM profiles WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- 2. Configurar turno da manhã (Turno 1 = manhã)
INSERT INTO morning_shift_setting (id, morning_turno) 
VALUES ('current', 1) 
ON CONFLICT (id) DO UPDATE SET 
  morning_turno = EXCLUDED.morning_turno,
  updated_at = NOW();

-- 3. Configurar grupos para cada turno
-- Turno 1 (semana ímpar) - grupos que trabalham de manhã nas semanas ímpares
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo B', 'Grupo C', 'Grupo G', 'Grupo H']
WHERE turno = 1;

-- Turno 2 (semana par) - grupos que trabalham de manhã nas semanas pares
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo A', 'Grupo D', 'Grupo E', 'Grupo F']
WHERE turno = 2;

-- 4. Atualizar perfil do usuário para estar no grupo correto
UPDATE profiles 
SET 
  group_name = 'Grupo A',  -- Grupo A está no turno 2 (semana par)
  factory_id = (SELECT id FROM factories LIMIT 1)
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- 5. Verificar configuração final
SELECT 'CONFIGURAÇÃO FINAL' as status;
SELECT 
  'Turno da manhã configurado:' as info,
  morning_turno as valor
FROM morning_shift_setting
WHERE id = 'current'

UNION ALL

SELECT 
  'Semana atual:' as info,
  CASE WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN '2 (Par)' ELSE '1 (Ímpar)' END as valor

UNION ALL

SELECT 
  'Turno ativo esta semana:' as info,
  CASE 
    WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN '2 (Par) - Grupos A, D, E, F'
    ELSE '1 (Ímpar) - Grupos B, C, G, H'
  END as valor

UNION ALL

SELECT 
  'Grupo do usuário:' as info,
  group_name as valor
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112'

UNION ALL

SELECT 
  'Usuário pode solicitar folga:' as info,
  CASE 
    WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 AND group_name = 'Grupo A' THEN 'SIM (Grupo A está no turno 2 - semana par)'
    WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 1 AND group_name IN ('Grupo B', 'Grupo C', 'Grupo G', 'Grupo H') THEN 'SIM (Grupo está no turno 1 - semana ímpar)'
    ELSE 'NÃO (Grupo não está no turno ativo)'
  END as valor
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
