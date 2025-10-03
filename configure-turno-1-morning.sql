-- Configurar Turno 1 como manhã (semanas ímpares)
-- Isso fará com que grupos do Turno 1 trabalhem de manhã nas semanas ímpares
-- e grupos do Turno 2 trabalhem de manhã nas semanas pares

-- 1. Configurar Turno 1 como manhã
UPDATE morning_shift_setting 
SET 
  morning_turno = 1,
  updated_at = NOW()
WHERE id = 'current';

-- 2. Verificar configuração
SELECT 
  'Configuração atualizada' as status,
  morning_turno as turno_da_manha,
  'Turno 1 = manhã (semanas ímpares), Turno 2 = manhã (semanas pares)' as explicacao
FROM morning_shift_setting 
WHERE id = 'current';

-- 3. Verificar grupos de cada turno
SELECT 
  'Configuração de turnos' as status,
  fsc.turno,
  fsc.groups,
  f.name as factory_name
FROM factory_shift_config fsc
JOIN factories f ON fsc.factory_id = f.id
ORDER BY fsc.turno;

-- 4. Teste de exemplo
SELECT 
  'Exemplo de funcionamento' as status,
  'Semana ímpar (1, 3, 5...)' as semana,
  'Grupos B, C, G, H podem solicitar folgas' as grupos_manha
UNION ALL
SELECT 
  'Exemplo de funcionamento' as status,
  'Semana par (2, 4, 6...)' as semana,
  'Grupos A, D, E, F podem solicitar folgas' as grupos_manha;
