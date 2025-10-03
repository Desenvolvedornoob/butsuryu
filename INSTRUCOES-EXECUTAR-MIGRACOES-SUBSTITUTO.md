# 🚨 INSTRUÇÕES: Executar Migrações para Campo Substituto

## Problema Identificado
A página de ausências não tem a opção de selecionar substituto porque as migrações do banco de dados ainda não foram executadas.

## ✅ Solução Implementada
- Campo de seleção de substituto adicionado ao `AbsenceForm`
- Funcionalidade disponível apenas para admins e superusers
- Interface com badges coloridos para identificar tipos de usuários

## 🗄️ Migrações que Precisam ser Executadas

### 1. Acesse o Supabase Dashboard
- Vá para https://supabase.com/dashboard
- Selecione seu projeto
- Clique em "SQL Editor" no menu lateral

### 2. Execute a Primeira Migração
```sql
-- Adicionar campo substitute_id à tabela time_off
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação de folga for aprovada

ALTER TABLE time_off ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN time_off.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação de folga for aprovada';

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_time_off_substitute_id ON time_off(substitute_id);
```

### 3. Execute a Segunda Migração
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

### 4. Execute a Terceira Migração (se necessário)
```sql
-- Adicionar campo substitute_id à tabela requests
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação for aprovada

ALTER TABLE requests ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN requests.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação for aprovada';
```

## 🎯 Como Testar

### 1. **Acesse a Página de Ausências**
- Faça login como admin ou superuser
- Vá para a página "Ausências" (Absence)

### 2. **Verifique o Campo Substituto**
- O campo "Substituto (Opcional)" deve aparecer no formulário
- Deve mostrar todos os funcionários ativos
- Deve ter badges coloridos para admins e superusers

### 3. **Teste a Funcionalidade**
- Selecione um funcionário
- Selecione uma data
- Escolha um motivo
- **Selecione um substituto** (novo campo)
- Clique em "Registrar Falta"

## ✅ Resultado Esperado
Após executar as migrações:
- ✅ Campo substitute_id será adicionado às tabelas
- ✅ Campo de seleção de substituto aparecerá na página de ausências
- ✅ Funcionalidade funcionará corretamente
- ✅ Dados do substituto serão salvos no banco

## ⚠️ Importante
- Execute as migrações na ordem correta (1, 2, 3)
- Use `IF NOT EXISTS` para evitar erros se as colunas já existirem
- Teste a funcionalidade após executar cada migração
- Apenas admins e superusers verão o campo de substituto

## 🔧 Funcionalidades Implementadas

### **Campo de Substituto**
- ✅ Aparece apenas para admins e superusers
- ✅ Lista todos os funcionários ativos
- ✅ Ordenação por prioridade: Superuser → Admin → Funcionários
- ✅ Badges coloridos para identificar tipos de usuários
- ✅ Campo opcional (pode ficar vazio)

### **Salvamento no Banco**
- ✅ Campo `substitute_id` é salvo na tabela `time_off`
- ✅ Funciona para faltas registradas
- ✅ Suporte completo nas funções de backend
