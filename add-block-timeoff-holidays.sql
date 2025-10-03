-- Script para adicionar funcionalidade de bloqueio de solicitações de folga em feriados
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo blocks_time_off na tabela holidays
ALTER TABLE public.holidays 
ADD COLUMN IF NOT EXISTS blocks_time_off BOOLEAN DEFAULT false;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN public.holidays.blocks_time_off IS 'Indica se este feriado/evento bloqueia solicitações de folga nesta data';

-- Criar índice para otimizar consultas por factory_id e blocks_time_off
CREATE INDEX IF NOT EXISTS idx_holidays_factory_blocks 
ON public.holidays (factory_id, blocks_time_off) 
WHERE blocks_time_off = true;

-- Verificar a estrutura da tabela após a alteração
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'holidays' 
AND table_schema = 'public'
ORDER BY ordinal_position;
