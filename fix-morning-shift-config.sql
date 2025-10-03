-- Corrigir configuração para que Turno 2 seja sempre manhã
-- Isso fará com que apenas grupos do Turno 2 possam solicitar folgas

-- 1. Configurar Turno 2 como manhã
UPDATE morning_shift_setting 
SET 
  morning_turno = 2,
  updated_at = NOW()
WHERE id = 'current';

-- 2. Verificar configuração
SELECT 
  'Configuração atualizada' as status,
  morning_turno as turno_da_manha,
  'Apenas grupos do Turno 2 podem solicitar folgas' as explicacao
FROM morning_shift_setting 
WHERE id = 'current';

-- 3. Verificar grupos do Turno 2
SELECT 
  'Grupos que podem solicitar folgas' as status,
  fsc.groups,
  f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
WHERE fsc.turno = 2;

-- 4. Verificar perfil do usuário
SELECT 
  'Perfil do usuário' as status,
  group_name,
  CASE 
    WHEN group_name IN (SELECT unnest(groups) FROM factory_shift_config WHERE turno = 2) 
    THEN 'PODE solicitar folgas (está no Turno 2)'
    ELSE 'NÃO pode solicitar folgas (não está no Turno 2)'
  END as status_folga
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
