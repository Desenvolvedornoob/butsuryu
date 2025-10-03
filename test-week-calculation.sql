-- Testar cálculo de semana para diferentes datas
-- Simular a lógica do JavaScript

WITH test_dates AS (
  SELECT 
    '2025-09-23'::date as test_date,
    'Data 1' as description
  UNION ALL
  SELECT 
    '2025-09-29'::date as test_date,
    'Data 2' as description
  UNION ALL
  SELECT 
    '2025-09-30'::date as test_date,
    'Data 3' as description
  UNION ALL
  SELECT 
    '2025-10-06'::date as test_date,
    'Data 4' as description
),
week_calculations AS (
  SELECT 
    td.test_date,
    td.description,
    EXTRACT(YEAR FROM td.test_date) as year,
    DATE_TRUNC('year', td.test_date) as start_of_year,
    td.test_date - DATE_TRUNC('year', td.test_date) as days_since_start,
    EXTRACT(WEEK FROM td.test_date) as iso_week,
    CASE 
      WHEN (EXTRACT(WEEK FROM td.test_date) % 2) = 0 THEN 2 
      ELSE 1 
    END as week_parity
  FROM test_dates td
)
SELECT 
  test_date,
  description,
  year,
  days_since_start,
  iso_week,
  week_parity,
  CASE 
    WHEN week_parity = 1 THEN 'Ímpar - Turno 1 (manhã)'
    ELSE 'Par - Turno 2 (manhã)'
  END as turno_ativo
FROM week_calculations
ORDER BY test_date;
