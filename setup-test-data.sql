-- Configurar dados de teste para o sistema de turnos

-- 1. Inserir configuração de turno da manhã (se não existir)
INSERT INTO morning_shift_setting (id, morning_turno) 
VALUES ('current', 1) 
ON CONFLICT (id) DO UPDATE SET 
  morning_turno = EXCLUDED.morning_turno,
  updated_at = NOW();

-- 2. Verificar se existem fábricas
SELECT id, name FROM factories LIMIT 5;

-- 3. Atualizar perfis com dados de teste (substitua os IDs pelos reais)
-- Primeiro, vamos ver quais perfis existem
SELECT id, first_name, group_name, factory_id 
FROM profiles 
LIMIT 10;

-- 4. Inserir configurações de turnos para as fábricas existentes
-- (Substitua os factory_id pelos IDs reais das suas fábricas)
INSERT INTO factory_shift_config (factory_id, turno, groups)
SELECT 
  f.id,
  1,
  ARRAY['Grupo A', 'Grupo B', 'Grupo C']
FROM factories f
WHERE NOT EXISTS (
  SELECT 1 FROM factory_shift_config fsc 
  WHERE fsc.factory_id = f.id AND fsc.turno = 1
);

INSERT INTO factory_shift_config (factory_id, turno, groups)
SELECT 
  f.id,
  2,
  ARRAY['Grupo D', 'Grupo E', 'Grupo F']
FROM factories f
WHERE NOT EXISTS (
  SELECT 1 FROM factory_shift_config fsc 
  WHERE fsc.factory_id = f.id AND fsc.turno = 2
);

-- 5. Atualizar um perfil de teste com group_name e factory_id
-- (Substitua o ID do usuário pelo ID real)
UPDATE profiles 
SET 
  group_name = 'Grupo A',
  factory_id = (SELECT id FROM factories LIMIT 1)
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- 6. Verificar se tudo foi configurado corretamente
SELECT 
  'Configuração de turno da manhã' as tipo,
  morning_turno as valor
FROM morning_shift_setting
WHERE id = 'current'

UNION ALL

SELECT 
  'Configurações de turnos das fábricas' as tipo,
  COUNT(*)::text as valor
FROM factory_shift_config

UNION ALL

SELECT 
  'Perfis com group_name e factory_id' as tipo,
  COUNT(*)::text as valor
FROM profiles 
WHERE group_name IS NOT NULL 
AND factory_id IS NOT NULL;
