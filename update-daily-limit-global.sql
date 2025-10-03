-- Atualizar sistema para limite global de folgas por dia

-- 1. Deletar tabela atual
DROP TABLE IF EXISTS daily_leave_limits;

-- 2. Criar nova tabela com configuração global
CREATE TABLE daily_leave_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  max_leaves_per_day INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir configuração padrão (apenas um registro)
INSERT INTO daily_leave_limits (id, max_leaves_per_day) 
VALUES ('00000000-0000-0000-0000-000000000001', 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar políticas RLS
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
