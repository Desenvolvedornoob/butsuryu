# Sistema de Desligamento de Funcionários

## Resumo das Mudanças

Este documento descreve as modificações implementadas para adicionar a funcionalidade de desligamento de funcionários com motivo específico.

## Funcionalidades Adicionadas

### 1. Novo Status: "Desligamento"
- Adicionado o status `desligamento` às opções disponíveis para funcionários
- Funcionários com status "desligamento" são exibidos com badge cinza na interface

### 2. Campo de Motivo do Desligamento
- Novo campo `dismissal_reason` na tabela `profiles`
- Campo aparece automaticamente quando o status é alterado para "desligamento"
- Opções de motivo disponíveis:
  - Sem hora extra
  - Salário baixo
  - Corrido
  - Pesado
  - Desentendimento
  - Doença
  - Retorno ao país
  - Não respeita regras
  - Não deu certo
  - Falta
  - Família
  - Estressado
  - Outro (com campo de texto personalizado)
- **Motivo Personalizado**: Quando "Outro" é selecionado, aparece um campo de texto para especificar o motivo

### 3. Campo de Cidade
- Novo campo `city` na tabela `profiles`
- Permite registrar a cidade onde o funcionário mora
- Campo opcional disponível na criação e edição de funcionários
- Exibido na tabela de funcionários

### 4. Interface Atualizada

#### Página de Funcionários (Employees.tsx)
- **Status na tabela**: Agora exibe "Desligamento" com badge cinza
- **Dropdown de ações**: 
  - Para funcionários ativos: opções "Desativar" e "Desligar"
  - Para funcionários inativos: opção "Ativar"
  - Para funcionários desligados: opção "Reativar"
- **Modal de edição**: Campo de motivo aparece quando status é "desligamento"
- **Sistema de Filtros**: 
  - Filtro por Status (Ativo, Inativo, Desligamento)
  - Filtro por Função (Funcionário, Líder, Administrador)
  - Filtro por Departamento (dinâmico baseado nos dados)
  - Filtro por Fábrica (baseado nas fábricas cadastradas)
  - Indicador visual de filtros ativos
  - Botão para limpar todos os filtros

## Arquivos Modificados

### 1. Tipos (src/types/user.ts)
```typescript
export type UserStatus = 'active' | 'inactive' | 'desligamento';

export interface User {
  // ... outros campos
  dismissal_reason?: string;
}
```

### 2. Página de Funcionários (src/pages/Employees.tsx)
- Adicionados estados para controle do desligamento
- Atualizada interface de edição com campo de motivo
- Atualizado dropdown de ações
- Atualizada exibição do status na tabela

### 3. Tipos do Supabase (src/integrations/supabase/types.ts)
- Adicionado campo `dismissal_reason` à definição da tabela `profiles`

## Migração do Banco de Dados

### Script SQL Principal (add-dismissal-reason-field.sql)
```sql
-- Adicionar campo dismissal_reason à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dismissal_reason TEXT;

-- Adicionar valor 'desligamento' ao enum user_status
ALTER TYPE user_status ADD VALUE 'desligamento';
```

### Script de Correção do Enum (fix-user-status-enum.sql)
Se você encontrar o erro `invalid input value for enum user_status: "desligamento"`, execute este script:

```sql
-- Script para corrigir o enum user_status
-- Verifica e adiciona o valor 'desligamento' ao enum user_status
```

### Script para Campo Cidade (add-city-field.sql)
```sql
-- Adicionar campo city à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;
```

**Ordem de execução:**
1. Execute primeiro `fix-user-status-enum.sql` para corrigir o enum
2. Execute depois `add-dismissal-reason-field.sql` para adicionar o campo de motivo
3. Execute por último `add-city-field.sql` para adicionar o campo cidade

## Como Usar

### 1. Desligar um Funcionário
1. Acesse a página de Funcionários
2. Clique no menu de ações (três pontos) do funcionário
3. Selecione "Desligar"
4. O status será alterado para "Desligamento"

### 2. Editar Motivo do Desligamento
1. Clique em "Editar" no funcionário desligado
2. O campo "Motivo do Desligamento" aparecerá automaticamente
3. Selecione o motivo apropriado
4. Salve as alterações

### 3. Reativar Funcionário Desligado
1. Clique no menu de ações do funcionário desligado
2. Selecione "Reativar"
3. O status voltará para "Ativo" e o motivo será limpo

## Validações

- O campo de motivo só aparece quando o status é "desligamento"
- O motivo é limpo automaticamente quando o status muda para outro valor
- O campo é salvo no banco de dados apenas quando o status é "desligamento"

## Compatibilidade

- Todas as mudanças são retrocompatíveis
- Funcionários existentes não são afetados
- O campo `dismissal_reason` é opcional e pode ser nulo

## Próximos Passos

1. Executar o script SQL no banco de dados
2. Testar a funcionalidade com funcionários de teste
3. Verificar se as permissões RLS estão funcionando corretamente
4. Atualizar a documentação da API se necessário 