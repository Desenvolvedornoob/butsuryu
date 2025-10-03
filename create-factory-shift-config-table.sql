-- Criar tabela para configurações de turnos por fábrica
CREATE TABLE IF NOT EXISTS factory_shift_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  turno INTEGER NOT NULL CHECK (turno IN (1, 2)),
  groups TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(factory_id, turno)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_factory_shift_config_factory_id ON factory_shift_config(factory_id);
CREATE INDEX IF NOT EXISTS idx_factory_shift_config_turno ON factory_shift_config(turno);

-- Habilitar RLS
ALTER TABLE factory_shift_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factory_shift_config' 
        AND policyname = 'Permitir leitura para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura para usuários autenticados" ON factory_shift_config
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Política para permitir inserção/atualização para admins e superusers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'factory_shift_config' 
        AND policyname = 'Permitir inserção/atualização para admins e superusers'
    ) THEN
        CREATE POLICY "Permitir inserção/atualização para admins e superusers" ON factory_shift_config
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('admin', 'superuser')
            )
          );
    END IF;
END $$;

-- Comentários na tabela
COMMENT ON TABLE factory_shift_config IS 'Configurações de turnos por fábrica (1 e 2)';
COMMENT ON COLUMN factory_shift_config.factory_id IS 'ID da fábrica';
COMMENT ON COLUMN factory_shift_config.turno IS 'Número do turno (1 ou 2)';
COMMENT ON COLUMN factory_shift_config.groups IS 'Array com nomes dos grupos que trabalham neste turno';
