# Correção - Dashboard não mostra dados nos filtros e distribuição

## Problema Identificado

A dashboard do funcionário não está mostrando dados nos filtros e na distribuição. Após investigação, foram identificados os seguintes problemas:

## Problemas Encontrados

### 1. Políticas RLS Incompletas
- As tabelas `early_departures` e `lateness` não possuem políticas RLS completas
- Apenas políticas de DELETE existem, faltam SELECT, INSERT e UPDATE

### 2. Erro na Função loadRequests
- A função `loadRequests` estava tentando acessar `req.start_date` nas tabelas `early_departures` e `lateness`
- Essas tabelas usam o campo `date` em vez de `start_date`

## Correções Implementadas

### 1. Arquivo: `fix-early-departures-lateness-rls.sql`
- Criado script SQL para adicionar políticas RLS completas para as tabelas `early_departures` e `lateness`
- Inclui políticas para SELECT, INSERT, UPDATE e DELETE
- Habilita RLS nas tabelas

### 2. Arquivo: `src/integrations/supabase/client.ts`
- Corrigido erro na função `loadRequests` (linhas 508 e 527)
- Alterado `req.start_date` para `req.date` nas tabelas `early_departures` e `lateness`
- Corrigido `req.end_date` para `req.date` (essas tabelas não têm end_date)

### 3. Arquivo: `check-dashboard-data.sql`
- Criado script para verificar dados nas tabelas
- Inclui verificação de políticas RLS
- Testa queries similares às da dashboard

### 4. Arquivo: `test-dashboard-functions.js`
- Criado script de teste para verificar as funções da dashboard
- Testa loadRequests, loadAllRequests e consultas diretas
- Verifica políticas RLS

## Instruções para Correção

### Passo 1: Executar Scripts SQL
Execute os seguintes scripts no SQL Editor do Supabase:

1. `fix-early-departures-lateness-rls.sql` - Corrigir políticas RLS
2. `check-dashboard-data.sql` - Verificar dados e políticas

### Passo 2: Testar no Navegador
1. Abra a dashboard no navegador
2. Abra o console do navegador (F12)
3. Cole e execute o conteúdo de `test-dashboard-functions.js`
4. Verifique os logs para identificar problemas

### Passo 3: Verificar Resultados
- Os filtros devem mostrar dados corretamente
- A distribuição deve exibir estatísticas
- Os pedidos recentes devem aparecer

## Arquivos Modificados

- `src/integrations/supabase/client.ts` - Corrigido erro de campos
- `fix-early-departures-lateness-rls.sql` - Novo arquivo
- `check-dashboard-data.sql` - Novo arquivo  
- `test-dashboard-functions.js` - Novo arquivo

## Status

✅ Políticas RLS identificadas e script criado
✅ Erro na função loadRequests corrigido
⏳ Aguardando execução dos scripts SQL
⏳ Aguardando teste no navegador
