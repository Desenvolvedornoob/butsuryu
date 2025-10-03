-- Debug completo da lógica de turno da manhã
WITH user_profile AS (
  SELECT 
    id,
    group_name,
    factory_id
  FROM profiles 
  WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112'
),
current_week AS (
  -- Calcular semana atual (1 = ímpar, 2 = par)
  SELECT 
    CASE WHEN (EXTRACT(WEEK FROM NOW()) % 2) = 0 THEN 2 ELSE 1 END as week_number
),
morning_setting AS (
  -- Buscar configuração de qual turno está de manhã
  SELECT morning_turno
  FROM morning_shift_setting
  WHERE id = 'current'
),
active_turno AS (
  -- Determinar qual turno está ativo de manhã nesta semana
  SELECT 
    ms.morning_turno,
    cw.week_number,
    CASE 
      WHEN cw.week_number = ms.morning_turno THEN ms.morning_turno
      ELSE CASE WHEN ms.morning_turno = 1 THEN 2 ELSE 1 END
    END as active_turno
  FROM morning_setting ms, current_week cw
),
shift_config AS (
  -- Buscar configuração de turnos da fábrica
  SELECT 
    fsc.turno,
    fsc.groups
  FROM user_profile up
  JOIN factory_shift_config fsc ON up.factory_id = fsc.factory_id
  JOIN active_turno at ON fsc.turno = at.active_turno
),
final_result AS (
  -- Verificar se o grupo do usuário está no turno ativo
  SELECT 
    up.id,
    up.group_name,
    up.factory_id,
    cw.week_number,
    ms.morning_turno as configured_morning_turno,
    at.active_turno,
    sc.groups as active_groups,
    CASE WHEN sc.groups @> ARRAY[up.group_name] THEN true ELSE false END as user_in_morning_shift,
    CASE 
      WHEN cw.week_number = ms.morning_turno THEN 'Turno da manhã ativo'
      ELSE 'Turno da noite ativo'
    END as shift_status
  FROM user_profile up
  CROSS JOIN current_week cw
  CROSS JOIN morning_setting ms
  CROSS JOIN active_turno at
  LEFT JOIN shift_config sc ON true
)
SELECT 
  '=== DEBUG COMPLETO ===' as debug,
  id,
  group_name,
  factory_id,
  week_number as semana_atual,
  configured_morning_turno as turno_configurado_manha,
  active_turno as turno_ativo_semana,
  active_groups as grupos_ativos,
  user_in_morning_shift as usuario_pode_solicitar_folga,
  shift_status as status_do_turno
FROM final_result;

-- Verificar todas as configurações
SELECT '=== CONFIGURAÇÕES ===' as info;
SELECT 'morning_shift_setting' as tabela, morning_turno as valor FROM morning_shift_setting WHERE id = 'current'
UNION ALL
SELECT 'factory_shift_config' as tabela, turno::text as valor FROM factory_shift_config ORDER BY turno
UNION ALL
SELECT 'profiles' as tabela, group_name as valor FROM profiles WHERE id = '6fae5e52-6914-46ac-85e5-fe22b034e112';
