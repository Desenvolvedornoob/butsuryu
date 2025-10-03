-- Script para testar permissões do superuser
-- Execute este script logado como SUPERUSER no Supabase

-- 1. Testar SELECT (deve funcionar - superuser pode ver todas as solicitações)
SELECT 
  'TESTE_SELECT' as teste,
  COUNT(*) as total_time_off
FROM public.time_off;

SELECT 
  'TESTE_SELECT' as teste,
  COUNT(*) as total_requests
FROM public.requests;

-- 2. Testar INSERT (deve falhar - superuser não pode criar novas solicitações)
/*
INSERT INTO public.time_off (id, user_id, start_date, end_date, reason, status)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.profiles WHERE role = 'funcionario' LIMIT 1),
  '2025-01-30',
  '2025-01-31',
  'Teste INSERT superuser - deve falhar',
  'pending'
);
*/

-- 3. Testar UPDATE de status (deve funcionar - superuser pode aprovar/rejeitar)
-- Primeiro, vamos ver se há solicitações pendentes
SELECT 
  'SOLICITACOES_PENDENTES' as info,
  id,
  reason,
  status
FROM public.time_off 
WHERE status = 'pending'
LIMIT 3;

-- Para testar UPDATE, copie um ID de uma solicitação pendente e execute:
/*
UPDATE public.time_off 
SET 
  status = 'approved',
  updated_at = NOW()
WHERE id = 'COLE_UM_ID_AQUI';
*/

-- 4. Testar DELETE (deve falhar - superuser não pode excluir)
/*
DELETE FROM public.time_off 
WHERE reason LIKE '%teste%' 
LIMIT 1;
*/

-- 5. Verificar políticas aplicáveis ao usuário atual
SELECT 
  'POLITICAS_APLICAVEIS' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('time_off', 'requests')
ORDER BY tablename, cmd; 