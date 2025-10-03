-- Adicionar campo substitute_id à tabela requests
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação for aprovada

ALTER TABLE requests ADD COLUMN substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN requests.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação for aprovada';
