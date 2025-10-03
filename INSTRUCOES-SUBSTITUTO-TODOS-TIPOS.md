# Extensão do Campo Substituto para Todos os Tipos de Solicitação

## 📋 Resumo das Mudanças

Foi estendido o campo **Substituto** para **todos os tipos** de solicitação (folga, saída antecipada, atraso e falta), não apenas para folgas.

## 🗄️ Mudanças no Banco de Dados

### 1. Execute a Migração SQL

No **SQL Editor** do Supabase, execute o seguinte código:

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

## 🔧 Funcionalidades Implementadas

### 1. **Formulário de Solicitação**
- ✅ Campo **"Substituto (Opcional)"** agora aparece para **TODOS os tipos** de solicitação
- ✅ Visível apenas para **admins** e **superusers**
- ✅ Lista todos os funcionários ativos ordenados por prioridade (superuser → admin → funcionários)
- ✅ Campo é opcional para todos os tipos

### 2. **Salvamento no Banco**
- ✅ Campo `substitute_id` é salvo em **todas as tabelas**:
  - `time_off` (folgas e faltas)
  - `early_departures` (saídas antecipadas)
  - `lateness` (atrasos)
- ✅ Suporte completo nas funções de backend

### 3. **Página de Solicitações (Requests)**
- ✅ Coluna **"Substituto"** mostra o nome do substituto para **todos os tipos**
- ✅ Exibe nome normal (sem badge verde) ou "-" quando não há substituto
- ✅ Funcionalidade de edição permite alterar substituto para todos os tipos

### 4. **Exibição na Tabela**
- ✅ **Funcionário** (mudado de "Usuário")
- ✅ **Substituto** mostra nome para todos os tipos ou "-"

## 🎯 Como Usar

### Para **Admins** e **Superusers**:

1. **Criar Qualquer Solicitação:**
   - Acesse qualquer tipo de solicitação (Folga, Saída Antecipada, Atraso)
   - Preencha os dados normalmente
   - **Novo:** Selecione um substituto na lista (opcional, agora para todos os tipos)
   - Envie a solicitação

2. **Visualizar Substitutos:**
   - Acesse "Solicitações"
   - Veja a coluna "Substituto" para todos os tipos de solicitação
   - Nome do substituto aparece em texto normal

3. **Editar Substitutos:**
   - Clique em "Editar" em qualquer solicitação
   - Altere o substituto conforme necessário (agora para todos os tipos)

### Para **Funcionários Normais**:
- O campo substituto **não aparece** (apenas admins/superusers podem definir)
- Funcionalidade inalterada

## 🔍 Detalhes Técnicos

### Arquivos Modificados:
1. `src/components/RequestForm.tsx` - Campo de substituto para todos os tipos
2. `src/integrations/supabase/client.ts` - Suporte para salvar substituto em todas as tabelas
3. `src/lib/requests.ts` - Carregamento de substitutos de todas as tabelas
4. `src/pages/Requests.tsx` - Edição de substituto para todos os tipos
5. `supabase/migrations/20250113000001_add_substitute_field_to_early_departures_and_lateness.sql` - Nova migração

### Permissões:
- **Visualizar/Definir substituto**: Apenas `admin` e `superuser`
- **Funcionários comuns**: Campo não visível

### Banco de Dados:
- **Tabelas atualizadas**: `early_departures` e `lateness`
- **Campo**: `substitute_id` (UUID, opcional, referencia `profiles.id`)
- **Índices**: Para performance de consultas

## ✅ Status da Implementação

- [x] Migração SQL criada para early_departures e lateness
- [x] Formulário atualizado para todos os tipos
- [x] Backend atualizado para salvar em todas as tabelas
- [x] Carregamento de substitutos de todas as tabelas
- [x] Interface de edição para todos os tipos
- [x] Exibição na tabela para todos os tipos

## 🚀 Próximos Passos

1. **Execute a migração SQL** no Supabase
2. **Teste a funcionalidade**:
   - Faça login como admin/superuser
   - Crie solicitações de todos os tipos (folga, saída, atraso)
   - Verifique se o campo substituto aparece em todos
   - Teste salvamento e edição
   - Confirme que a coluna "Substituto" mostra nomes para todos os tipos

A funcionalidade está **100% implementada** para todos os tipos de solicitação! 🎉

## 📊 Resultado Final

### Tabela de Solicitações:
| Funcionário | Tipo | Motivo | **Substituto** | Data da Solicitação | Data Pedida | Status |
|-------------|------|--------|----------------|-------------------|-------------|--------|
| João Silva | Folga | Férias | Maria Santos | 13/01/2025 | 15/01/2025 | Aprovado |
| Pedro Lima | Saída Antecipada | Médico | José Admin | 13/01/2025 | 13/01/2025 | Pendente |
| Ana Costa | Atraso | Trânsito | Carlos Super | 12/01/2025 | 12/01/2025 | Aprovado |
| Luis Souza | Falta | Doença | - | 11/01/2025 | 11/01/2025 | Pendente |

**Todos os tipos** de solicitação agora suportam substitutos! 🚀
