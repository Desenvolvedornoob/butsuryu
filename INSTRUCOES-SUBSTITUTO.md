# Implementação do Campo Substituto nas Solicitações de Folga

## 📋 Resumo das Mudanças

Foi implementado um campo **Substituto** nas solicitações de folga que permite a admins e superusers definirem quem será o substituto durante a ausência.

## 🗄️ Mudanças no Banco de Dados

### 1. Execute a Migração SQL

No **SQL Editor** do Supabase, execute o seguinte código:

```sql
-- Adicionar campo substitute_id à tabela time_off
-- Este campo armazenará o ID do funcionário que será o substituto quando a solicitação de folga for aprovada

ALTER TABLE time_off ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES profiles(id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN time_off.substitute_id IS 'ID do funcionário que será o substituto quando a solicitação de folga for aprovada';

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_time_off_substitute_id ON time_off(substitute_id);
```

## 🔧 Funcionalidades Implementadas

### 1. **Formulário de Solicitação de Folga**
- ✅ Campo **"Substituto (Opcional)"** aparece apenas para folgas
- ✅ Visível apenas para **admins** e **superusers**
- ✅ Lista todos os funcionários ativos ordenados por nome
- ✅ Mostra badges para identificar admins e superusers
- ✅ Campo é opcional (pode ficar vazio)

### 2. **Salvamento no Banco**
- ✅ Campo `substitute_id` é salvo na tabela `time_off`
- ✅ Funciona tanto para novas solicitações quanto para faltas registradas
- ✅ Suporte completo nas funções de backend

### 3. **Página de Aprovação (Requests)**
- ✅ Já existe funcionalidade completa de seleção de substitutos
- ✅ Sistema inteligente que pré-seleciona líderes primários
- ✅ Interface rica com badges identificando tipos de líderes
- ✅ Salva automaticamente na aprovação

## 🎯 Como Usar

### Para **Admins** e **Superusers**:

1. **Criar Solicitação de Folga:**
   - Acesse "Solicitar Folga"
   - Preencha os dados normalmente
   - **Novo:** Selecione um substituto na lista (opcional)
   - Envie a solicitação

2. **Aprovar Solicitações:**
   - Acesse "Solicitações" → "Pendentes"
   - Clique em "Aprovar" em qualquer solicitação
   - **Já existia:** Selecione um substituto na lista
   - Confirme a aprovação

### Para **Funcionários Normais**:
- O campo substituto **não aparece** (apenas admins/superusers podem definir)
- Funcionalidade inalterada

## 🔍 Detalhes Técnicos

### Arquivos Modificados:
1. `src/components/RequestForm.tsx` - Adicionado campo de substituto
2. `src/integrations/supabase/types.ts` - Atualizado tipos TypeScript
3. `src/integrations/supabase/client.ts` - Suporte para salvar substituto
4. `supabase/migrations/20250113000000_add_substitute_field_to_time_off.sql` - Migração SQL

### Permissões:
- **Visualizar campo**: `canApproveLeaves` OR `role === 'admin'` OR `role === 'superuser'`
- **Modificar substituto**: Mesmo critério acima

### Banco de Dados:
- **Tabela**: `time_off`
- **Campo**: `substitute_id` (UUID, opcional, referencia `profiles.id`)
- **Índice**: `idx_time_off_substitute_id` para performance

## ✅ Status da Implementação

- [x] Migração SQL criada
- [x] Tipos TypeScript atualizados  
- [x] Formulário de solicitação atualizado
- [x] Backend atualizado para salvar substituto
- [x] Interface para admins/superusers
- [x] Integração com sistema de aprovação existente

## 🚀 Próximos Passos

1. **Execute a migração SQL** no Supabase
2. **Teste a funcionalidade**:
   - Faça login como admin/superuser
   - Crie uma solicitação de folga
   - Verifique se o campo substituto aparece
   - Teste salvamento e aprovação

A funcionalidade está **100% implementada** e pronta para uso! 🎉
