# Correção do Calendário - Eventos não aparecendo

## Problema
O calendário não está mostrando os eventos salvos para todos os usuários.

## Causa
O calendário estava buscando dados apenas do `localStorage` em vez do banco de dados Supabase.

## Correções Implementadas

### 1. Atualização da busca de dados
- ✅ Modificada a função `loadRequests` na página `Calendar.tsx` para buscar do Supabase
- ✅ Adicionado suporte para mostrar nome dos usuários nos eventos
- ✅ Implementado fallback para localStorage em caso de erro

### 2. Melhorias na consulta
- ✅ Alterado `INNER JOIN` para `LEFT JOIN` para evitar perder registros
- ✅ Adicionado tratamento para casos onde o perfil do usuário não existe
- ✅ Incluído factory_id padrão para registros sem perfil

### 3. Scripts de verificação criados
- ✅ `verify-calendar-permissions.sql` - Verifica permissões e dados
- ✅ `test-calendar-data.sql` - Cria dados de teste se necessário

## Como testar a correção

### Passo 1: Verificar dados existentes
Execute o script `verify-calendar-permissions.sql` no SQL Editor do Supabase para verificar:
- Se existem solicitações aprovadas
- Se as políticas RLS estão corretas
- Se há dados para mostrar no calendário

### Passo 2: Criar dados de teste (se necessário)
Se não houver dados para teste, execute `test-calendar-data.sql` para criar:
- Solicitações de folga aprovadas
- Solicitações de saída antecipada
- Faltas registradas
- Solicitações de atraso

### Passo 3: Verificar no frontend
1. Abra o calendário no sistema
2. Abra o console do navegador (F12)
3. Verifique os logs:
   - "Carregando solicitações do Supabase..."
   - "Solicitações carregadas: [array]"
   - "Total de solicitações: X"

### Passo 4: Testar funcionalidades
- ✅ Eventos devem aparecer no calendário
- ✅ Tooltips devem mostrar detalhes dos eventos
- ✅ Filtro por fábrica deve funcionar
- ✅ Opção "Todas as Fábricas" deve mostrar todos os eventos
- ✅ Nomes dos usuários devem aparecer nos eventos

## Estrutura dos dados no calendário

### Tipos de eventos suportados:
- `time-off` - Folgas (múltiplos dias)
- `absence` - Faltas (mesmo dia)
- `early-departure` - Saída antecipada
- `lateness` - Atraso
- `holiday` - Feriados

### Cores dos eventos:
- 🔵 Azul: Folgas
- 🟠 Laranja: Faltas
- 🟣 Roxo: Saída antecipada
- 🟡 Amarelo: Atraso
- 🟢 Verde: Feriados

## Possíveis problemas e soluções

### Se ainda não aparecer eventos:

1. **Verificar permissões RLS:**
   ```sql
   -- Execute no SQL Editor
   SELECT * FROM pg_policies WHERE tablename IN ('requests', 'time_off');
   ```

2. **Verificar se há dados aprovados:**
   ```sql
   SELECT COUNT(*) FROM requests WHERE status = 'approved';
   SELECT COUNT(*) FROM time_off WHERE status = 'approved';
   ```

3. **Verificar logs do console:**
   - Abra F12 no navegador
   - Vá para a aba Console
   - Procure por erros de RLS (código 42501)

4. **Forçar atualização:**
   - Recarregue a página (Ctrl+F5)
   - Limpe o cache do navegador
   - Verifique se está logado como usuário com permissões

### Se aparecer "Usuário não encontrado":
Isso indica que há solicitações no banco mas sem perfil associado. Execute:
```sql
-- Verificar registros órfãos
SELECT * FROM requests WHERE user_id NOT IN (SELECT id FROM profiles);
SELECT * FROM time_off WHERE user_id NOT IN (SELECT id FROM profiles);
```

## Logs de debug adicionados

O sistema agora mostra logs detalhados no console:
- Início do carregamento
- Dados recebidos do Supabase
- Número total de solicitações processadas
- Erros de permissão ou consulta

## Status da correção
✅ **IMPLEMENTADO** - O calendário agora busca dados do Supabase e mostra eventos de todos os usuários com as devidas permissões. 