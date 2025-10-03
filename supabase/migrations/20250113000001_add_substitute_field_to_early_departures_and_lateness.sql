-- Adicionar campo substitute_id às tabelas early_departures e lateness
-- Este campo armazenará o ID do funcionário que será o substituto

-- Adicionar substitute_id à tabela early_departures
ALTER TABLE early_departures ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);
COMMENT ON COLUMN early_departures.substitute_id IS 'ID do funcionário que será o substituto durante a saída antecipada';
CREATE INDEX IF NOT EXISTS idx_early_departures_substitute_id ON early_departures(substitute_id);

-- Adicionar substitute_id à tabela lateness
ALTER TABLE lateness ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);
COMMENT ON COLUMN lateness.substitute_id IS 'ID do funcionário que será o substituto durante o atraso';
CREATE INDEX IF NOT EXISTS idx_lateness_substitute_id ON lateness(substitute_id);
