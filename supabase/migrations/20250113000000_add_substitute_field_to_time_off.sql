-- Adicionar campo substitute_id à tabela time_off
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação de folga for aprovada

ALTER TABLE time_off ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN time_off.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação de folga for aprovada';

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_time_off_substitute_id ON time_off(substitute_id);
