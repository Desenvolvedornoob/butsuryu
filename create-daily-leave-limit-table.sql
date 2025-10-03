-- Criar tabela para configuração de limite de folgas por dia
CREATE TABLE IF NOT EXISTS daily_leave_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id UUID NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  max_leaves_per_day INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(factory_id)
);

-- Criar políticas RLS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_leave_limits' 
    AND policyname = 'Permitir leitura para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir leitura para usuários autenticados" ON daily_leave_limits
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_leave_limits' 
    AND policyname = 'Permitir inserção para admins'
  ) THEN
    CREATE POLICY "Permitir inserção para admins" ON daily_leave_limits
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superuser')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_leave_limits' 
    AND policyname = 'Permitir atualização para admins'
  ) THEN
    CREATE POLICY "Permitir atualização para admins" ON daily_leave_limits
      FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'superuser')
        )
      );
  END IF;
END $$;

-- Inserir configurações padrão para todas as fábricas existentes
INSERT INTO daily_leave_limits (factory_id, max_leaves_per_day)
SELECT id, 2
FROM factories
WHERE id NOT IN (SELECT factory_id FROM daily_leave_limits)
ON CONFLICT (factory_id) DO NOTHING;
