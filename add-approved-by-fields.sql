-- ===============================================
-- ADICIONAR CAMPOS APPROVED_BY E REJECTED_BY
-- ===============================================

-- Adicionar campos approved_by e rejected_by na tabela requests
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campos approved_by e rejected_by na tabela time_off
ALTER TABLE public.time_off 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campos approved_by e rejected_by na tabela early_departures
ALTER TABLE public.early_departures 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campos approved_by e rejected_by na tabela lateness
ALTER TABLE public.lateness 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Criar comentários para documentar os campos
COMMENT ON COLUMN public.requests.approved_by IS 'ID do usuário que aprovou a solicitação';
COMMENT ON COLUMN public.requests.rejected_by IS 'ID do usuário que rejeitou a solicitação';
COMMENT ON COLUMN public.requests.reviewed_at IS 'Data e hora da aprovação/rejeição';

COMMENT ON COLUMN public.time_off.approved_by IS 'ID do usuário que aprovou a solicitação';
COMMENT ON COLUMN public.time_off.rejected_by IS 'ID do usuário que rejeitou a solicitação';
COMMENT ON COLUMN public.time_off.reviewed_at IS 'Data e hora da aprovação/rejeição';

COMMENT ON COLUMN public.early_departures.approved_by IS 'ID do usuário que aprovou a solicitação';
COMMENT ON COLUMN public.early_departures.rejected_by IS 'ID do usuário que rejeitou a solicitação';
COMMENT ON COLUMN public.early_departures.reviewed_at IS 'Data e hora da aprovação/rejeição';

COMMENT ON COLUMN public.lateness.approved_by IS 'ID do usuário que aprovou a solicitação';
COMMENT ON COLUMN public.lateness.rejected_by IS 'ID do usuário que rejeitou a solicitação';
COMMENT ON COLUMN public.lateness.reviewed_at IS 'Data e hora da aprovação/rejeição';

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_requests_approved_by ON public.requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_requests_rejected_by ON public.requests(rejected_by);
CREATE INDEX IF NOT EXISTS idx_requests_reviewed_at ON public.requests(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_time_off_approved_by ON public.time_off(approved_by);
CREATE INDEX IF NOT EXISTS idx_time_off_rejected_by ON public.time_off(rejected_by);
CREATE INDEX IF NOT EXISTS idx_time_off_reviewed_at ON public.time_off(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_early_departures_approved_by ON public.early_departures(approved_by);
CREATE INDEX IF NOT EXISTS idx_early_departures_rejected_by ON public.early_departures(rejected_by);
CREATE INDEX IF NOT EXISTS idx_early_departures_reviewed_at ON public.early_departures(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_lateness_approved_by ON public.lateness(approved_by);
CREATE INDEX IF NOT EXISTS idx_lateness_rejected_by ON public.lateness(rejected_by);
CREATE INDEX IF NOT EXISTS idx_lateness_reviewed_at ON public.lateness(reviewed_at);

-- Verificar os campos adicionados
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('requests', 'time_off', 'early_departures', 'lateness')
AND column_name IN ('approved_by', 'rejected_by', 'reviewed_at')
ORDER BY table_name, column_name; 