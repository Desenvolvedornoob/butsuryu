-- Testar a correção final (+2 em vez de +1)
-- Simular exatamente o que o JavaScript deve calcular agora

WITH test_dates AS (
  SELECT '2025-09-23'::date as test_date, 'Data 1' as description
  UNION ALL
  SELECT '2025-09-29'::date as test_date, 'Data 2' as description
  UNION ALL
  SELECT '2025-09-30'::date as test_date, 'Data 3' as description
  UNION ALL
  SELECT '2025-10-06'::date as test_date, 'Data 4' as description
),
ultimate_javascript_simulation AS (
  SELECT 
    td.test_date,
    td.description,
    EXTRACT(YEAR FROM td.test_date) as year,
    DATE_TRUNC('year', td.test_date) as start_of_year,
    td.test_date - DATE_TRUNC('year', td.test_date) as days_since_start,
    FLOOR(EXTRACT(EPOCH FROM (td.test_date - DATE_TRUNC('year', td.test_date))) / (7 * 24 * 60 * 60)) + 2 as week_number_js_ultimate,
    EXTRACT(WEEK FROM td.test_date) as week_number_postgres,
    CASE 
      WHEN (FLOOR(EXTRACT(EPOCH FROM (td.test_date - DATE_TRUNC('year', td.test_date))) / (7 * 24 * 60 * 60)) + 2) % 2 = 0 THEN 2 
      ELSE 1 
    END as js_result_ultimate,
    CASE 
      WHEN (EXTRACT(WEEK FROM td.test_date) % 2) = 0 THEN 2 
      ELSE 1 
    END as postgres_result
  FROM test_dates td
)
SELECT 
  test_date,
  description,
  days_since_start,
  week_number_js_ultimate as js_week_ultimate,
  week_number_postgres as postgres_week,
  js_result_ultimate,
  postgres_result,
  CASE 
    WHEN js_result_ultimate = postgres_result THEN '✅ CORRETO'
    ELSE '❌ DIFERENTE'
  END as status,
  CASE 
    WHEN js_result_ultimate = 2 THEN 'Par - Turno 2 (Grupo A PODE solicitar)'
    ELSE 'Ímpar - Turno 1 (Grupo A BLOQUEADO)'
  END as resultado_grupo_a
FROM ultimate_javascript_simulation
ORDER BY test_date;
