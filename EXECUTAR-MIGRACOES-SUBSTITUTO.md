# 🚨 URGENTE: Executar Migrações para Campo Substituto

## Problema Identificado
O erro 406 (Not Acceptable) está ocorrendo porque a coluna `substitute_id` não existe nas tabelas do banco de dados. As migrações precisam ser executadas.

## Migrações que Precisam ser Executadas

### 1. Adicionar substitute_id à tabela time_off
```sql
-- Adicionar campo substitute_id à tabela time_off
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação de folga for aprovada

ALTER TABLE time_off ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN time_off.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação de folga for aprovada';

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_time_off_substitute_id ON time_off(substitute_id);
```

### 2. Adicionar substitute_id às tabelas early_departures e lateness
```sql
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
```

### 3. Adicionar substitute_id à tabela requests
```sql
-- Adicionar campo substitute_id à tabela requests
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação for aprovada

ALTER TABLE requests ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN requests.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação for aprovada';
```

## Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"

3. **Execute as Migrações**
   - Cole e execute cada bloco SQL acima
   - Execute na ordem: 1, 2, 3

4. **Verifique se Funcionou**
   - Após executar as migrações, teste novamente a edição de solicitações
   - O erro 406 deve desaparecer

## ⚠️ Importante
- Execute as migrações na ordem correta
- Use `IF NOT EXISTS` para evitar erros se as colunas já existirem
- Após executar, teste a funcionalidade de edição de solicitações

## Resultado Esperado
Após executar as migrações:
- ✅ Campo substitute_id será adicionado às tabelas
- ✅ Erro 406 será resolvido
- ✅ Edição de solicitações funcionará corretamente
- ✅ Campo substituto será salvo e exibido
