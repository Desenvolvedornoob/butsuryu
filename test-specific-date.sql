-- Testar com uma data específica que deveria funcionar
-- Vamos usar uma data que deveria ser semana par

WITH test_date AS (
  SELECT '2025-09-30'::date as test_date
),
week_calculation AS (
  SELECT 
    test_date,
    EXTRACT(WEEK FROM test_date) as iso_week,
    CASE 
      WHEN (EXTRACT(WEEK FROM test_date) % 2) = 0 THEN 2 
      ELSE 1 
    END as week_parity
  FROM test_date
),
user_profile AS (
  SELECT 
    '6fae5e52-6914-46ac-85e5-fe22b034e112' as user_id,
    'Grupo A' as group_name,
    '4d2276d1-9e76-4724-b9f6-47f2984e8bf2' as factory_id
),
morning_setting AS (
  SELECT 1 as morning_turno
),
active_turno AS (
  SELECT 
    ms.morning_turno,
    wc.week_parity,
    CASE 
      WHEN wc.week_parity = ms.morning_turno THEN ms.morning_turno
      ELSE CASE WHEN ms.morning_turno = 1 THEN 2 ELSE 1 END
    END as active_turno
  FROM morning_setting ms, week_calculation wc
),
shift_config AS (
  SELECT 
    fsc.turno,
    fsc.groups
  FROM user_profile up
  JOIN factory_shift_config fsc ON up.factory_id = fsc.factory_id
  JOIN active_turno at ON fsc.turno = at.active_turno
),
final_result AS (
  SELECT 
    wc.test_date,
    wc.iso_week,
    wc.week_parity,
    ms.morning_turno,
    at.active_turno,
    sc.groups as active_groups,
    up.group_name,
    CASE WHEN sc.groups @> ARRAY[up.group_name] THEN true ELSE false END as can_request
  FROM week_calculation wc
  CROSS JOIN morning_setting ms
  CROSS JOIN active_turno at
  CROSS JOIN user_profile up
  LEFT JOIN shift_config sc ON true
)
SELECT 
  '=== TESTE DE DATA ESPECÍFICA ===' as debug,
  test_date,
  iso_week,
  week_parity,
  morning_turno,
  active_turno,
  active_groups,
  group_name,
  can_request
FROM final_result;
