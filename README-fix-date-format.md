# Correção do Formato de Datas - YYYY-MM-DD

## Problema Identificado
As datas estavam sendo exibidas no formato dd/mm/yyyy (formato brasileiro) em vez do formato yyyy-mm-dd desejado.

## Solução Implementada

### 1. Novo Componente FormattedDateInput
- ✅ Criado componente `FormattedDateInput` que força o formato yyyy-mm-dd
- ✅ Formatação automática enquanto o usuário digita
- ✅ Aceita apenas números e formata automaticamente
- ✅ Placeholder "YYYY-MM-DD" para orientar o usuário

### 2. Funcionalidades do Componente
- **Formatação automática**: Converte automaticamente para yyyy-mm-dd
- **Validação de entrada**: Aceita apenas números
- **Formatação em tempo real**: Adiciona hífens automaticamente
- **Fonte monospace**: Para melhor visualização do formato

### 3. Como Funciona
1. Usuário digita números: `20231225`
2. Componente formata automaticamente: `2023-12-25`
3. Formato final sempre: `YYYY-MM-DD`

## Campos Atualizados

### Modal de Edição:
- ✅ Data de Nascimento
- ✅ Data de Início na Empresa

### Modal de Criação:
- ✅ Data de Nascimento
- ✅ Data de Início na Empresa

## Exemplos de Uso

### Formato Correto:
- `2023-12-25` ✅
- `1990-05-15` ✅
- `2024-01-01` ✅

### Formato Incorreto (será convertido):
- `25/12/2023` → `2023-12-25` ✅
- `25-12-2023` → `2023-12-25` ✅
- `25122023` → `2023-12-25` ✅

## Benefícios

1. **Consistência**: Todas as datas no mesmo formato
2. **Usabilidade**: Formatação automática
3. **Validação**: Aceita apenas números válidos
4. **Visual**: Fonte monospace para melhor legibilidade

## Teste

1. Abra o modal de edição de funcionário
2. Clique nos campos de data
3. Digite números: `20231225`
4. Veja a formatação automática: `2023-12-25`
5. Salve e verifique se foi salvo corretamente

## Arquivos Modificados

- ✅ `src/components/ui/formatted-date-input.tsx` - Novo componente
- ✅ `src/pages/Employees.tsx` - Atualizado para usar o novo componente
- ✅ `src/components/ui/simple-date-input.tsx` - Melhorado

## Notas Importantes

- O componente força sempre o formato yyyy-mm-dd
- Não é possível digitar caracteres não numéricos
- A formatação acontece em tempo real
- O placeholder mostra o formato esperado 