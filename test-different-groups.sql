-- Testar validação com diferentes grupos
-- Primeiro, vamos ver a configuração atual
SELECT '=== CONFIGURAÇÃO ATUAL ===' as info;
SELECT 
  fsc.turno,
  fsc.groups,
  f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.turno;

-- Testar com Grupo A (deve funcionar na semana par)
UPDATE profiles 
SET group_name = 'Grupo A'
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Verificar resultado
SELECT 
  'Grupo A (semana par)' as teste,
  group_name,
  CASE WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN 'DEVE funcionar' ELSE 'NÃO deve funcionar' END as resultado_esperado
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Testar com Grupo B (deve funcionar na semana ímpar)
UPDATE profiles 
SET group_name = 'Grupo B'
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Verificar resultado
SELECT 
  'Grupo B (semana par)' as teste,
  group_name,
  CASE WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN 'NÃO deve funcionar' ELSE 'DEVE funcionar' END as resultado_esperado
FROM profiles 
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';

-- Voltar para Grupo A
UPDATE profiles 
SET group_name = 'Grupo A'
WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
