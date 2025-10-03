-- Testar a lógica diretamente no Supabase
-- Simular exatamente o que o JavaScript deve fazer

WITH test_scenarios AS (
  SELECT 
    '2025-09-23'::date as request_date,
    'Grupo A' as user_group,
    '4d2276d1-9e76-4724-b9f6-47f2984e8bf2'::uuid as factory_id,
    'Cenário 1: Data ímpar, Grupo A' as description
  UNION ALL
  SELECT 
    '2025-09-29'::date as request_date,
    'Grupo A' as user_group,
    '4d2276d1-9e76-4724-b9f6-47f2984e8bf2'::uuid as factory_id,
    'Cenário 2: Data par, Grupo A' as description
  UNION ALL
  SELECT 
    '2025-09-30'::date as request_date,
    'Grupo A' as user_group,
    '4d2276d1-9e76-4724-b9f6-47f2984e8bf2'::uuid as factory_id,
    'Cenário 3: Data par, Grupo A' as description
  UNION ALL
  SELECT 
    '2025-10-06'::date as request_date,
    'Grupo A' as user_group,
    '4d2276d1-9e76-4724-b9f6-47f2984e8bf2'::uuid as factory_id,
    'Cenário 4: Data ímpar, Grupo A' as description
),
week_calculations AS (
  SELECT 
    ts.*,
    FLOOR(EXTRACT(EPOCH FROM (ts.request_date - DATE_TRUNC('year', ts.request_date))) / (7 * 24 * 60 * 60)) + 2 as week_number,
    CASE 
      WHEN (FLOOR(EXTRACT(EPOCH FROM (ts.request_date - DATE_TRUNC('year', ts.request_date))) / (7 * 24 * 60 * 60)) + 2) % 2 = 0 THEN 2 
      ELSE 1 
    END as week_parity
  FROM test_scenarios ts
),
morning_config AS (
  SELECT 1 as morning_turno
),
active_turno AS (
  SELECT 
    wc.*,
    mc.morning_turno,
    CASE 
      WHEN wc.week_parity = mc.morning_turno THEN mc.morning_turno
      ELSE CASE WHEN mc.morning_turno = 1 THEN 2 ELSE 1 END
    END as active_turno
  FROM week_calculations wc
  CROSS JOIN morning_config mc
),
shift_groups AS (
  SELECT 
    at.*,
    fsc.groups as active_groups
  FROM active_turno at
  JOIN factory_shift_config fsc ON at.factory_id = fsc.factory_id AND fsc.turno = at.active_turno
),
final_result AS (
  SELECT 
    sr.*,
    CASE WHEN sr.active_groups @> ARRAY[sr.user_group] THEN true ELSE false END as can_request
  FROM shift_groups sr
)
SELECT 
  request_date,
  user_group,
  week_number,
  week_parity,
  morning_turno,
  active_turno,
  active_groups,
  can_request,
  CASE 
    WHEN can_request THEN '✅ PODE solicitar folga'
    ELSE '❌ NÃO PODE solicitar folga'
  END as resultado
FROM final_result
ORDER BY request_date;
