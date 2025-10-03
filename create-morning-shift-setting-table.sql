-- Criar tabela para definir qual turno está de manhã
CREATE TABLE IF NOT EXISTS morning_shift_setting (
  id TEXT PRIMARY KEY DEFAULT 'current',
  morning_turno INTEGER NOT NULL CHECK (morning_turno IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão (Turno 1 = manhã)
INSERT INTO morning_shift_setting (id, morning_turno) 
VALUES ('current', 1) 
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE morning_shift_setting ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'morning_shift_setting' 
        AND policyname = 'Permitir leitura para usuários autenticados'
    ) THEN
        CREATE POLICY "Permitir leitura para usuários autenticados" ON morning_shift_setting
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Política para permitir inserção/atualização para admins e superusers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'morning_shift_setting' 
        AND policyname = 'Permitir inserção/atualização para admins e superusers'
    ) THEN
        CREATE POLICY "Permitir inserção/atualização para admins e superusers" ON morning_shift_setting
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
COMMENT ON TABLE morning_shift_setting IS 'Define qual turno (1 ou 2) está de manhã';
COMMENT ON COLUMN morning_shift_setting.morning_turno IS 'Turno que está de manhã (1 ou 2)';
