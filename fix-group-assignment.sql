-- Corrigir atribuição de grupos para teste
-- Primeiro, vamos ver a configuração atual
SELECT 
  fsc.factory_id,
  fsc.turno,
  fsc.groups,
  f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.factory_id, fsc.turno;

-- Atualizar configuração para incluir Grupo A no turno 2 (semana par)
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo A', 'Grupo D', 'Grupo E', 'Grupo F']
WHERE turno = 2;

-- Atualizar configuração para incluir outros grupos no turno 1 (semana ímpar)
UPDATE factory_shift_config 
SET groups = ARRAY['Grupo B', 'Grupo C', 'Grupo G', 'Grupo H']
WHERE turno = 1;

-- Verificar a configuração atualizada
SELECT 
  fsc.factory_id,
  fsc.turno,
  fsc.groups,
  f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.factory_id, fsc.turno;

-- Verificar perfil do usuário
SELECT 
  id,
  first_name,
  group_name,
  factory_id
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
