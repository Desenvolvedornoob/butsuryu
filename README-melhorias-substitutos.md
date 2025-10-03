# Melhorias na Funcionalidade de Substitutos

## 📋 Resumo das Melhorias Implementadas

### ✅ Funcionalidades Adicionadas

1. **Seleção Inteligente de Substitutos**
   - Busca automática de todos os líderes disponíveis no sistema
   - Inclui: administradores, superusuários, líderes primários e secundários de todos os grupos
   - Remoção automática de duplicatas
   - Ordenação por prioridade: Líder Primário > Líder Secundário > Outros Líderes > Admin/Superuser

2. **Pré-seleção Automática**
   - O líder primário é automaticamente selecionado quando disponível
   - Caso contrário, o primeiro substituto disponível é pré-selecionado

3. **Interface Melhorada**
   - Badges coloridos para identificar o tipo de cada substituto:
     - 🔵 **Líder Primário** (azul)
     - 🟢 **Líder Secundário** (verde)
     - 🟡 **Líder de Grupo** (amarelo)
     - 🟣 **Administrador** (roxo)
     - 🟠 **Superusuário** (laranja)

4. **Persistência de Dados**
   - O substituto selecionado é salvo no campo `substitute_id` da tabela `requests`
   - Dados são mantidos ao aprovar/rejeitar solicitações

## 🔧 Arquivos Modificados

### 1. `src/pages/Requests.tsx`
- **Interface `User`**: Adicionadas propriedades `isGroupLeader` e `role`
- **Função `loadAvailableSubstitutes`**: Completamente refatorada para buscar todos os tipos de líderes
- **UI de Seleção**: Adicionados badges coloridos e melhor organização visual
- **Função `approveRequest`**: Atualizada para salvar o `substitute_id`
- **Função `saveEdit`**: Corrigidos problemas de tipagem TypeScript

### 2. `src/integrations/supabase/types.ts`
- Adicionado campo `substitute_id: string | null` nas interfaces `Row`, `Insert` e `Update` da tabela `requests`

### 3. `supabase/migrations/20250804043023_add_substitute_field.sql`
- Migração SQL que adiciona o campo `substitute_id` à tabela `requests`

## 🐛 Problemas Identificados e Soluções

### Problema 1: Apenas 3 Perfis Sendo Carregados
**Sintoma**: `Profiles carregados: Array(3)` nos logs do console

**Possíveis Causas**:
1. **Políticas RLS**: As políticas de Row Level Security podem estar limitando o acesso
2. **Status dos Perfis**: Alguns perfis podem ter status diferente de 'active'
3. **Roles**: Perfis podem não ter as roles 'admin' ou 'superuser'

**Soluções**:
1. Execute o script `test-profiles-simple.sql` no Supabase SQL Editor para diagnosticar
2. Verifique as políticas RLS na tabela `profiles`
3. Confirme se todos os perfis relevantes têm status 'active'

### Problema 2: Erro de Sintaxe do PowerShell
**Sintoma**: Erro ao executar `npm run dev` no PowerShell

**Solução**: Use um dos scripts fornecidos:
- `fix-powershell-syntax.bat` (Windows Batch)
- `fix-powershell-syntax.ps1` (PowerShell)

### Problema 3: Erro de Tipo UUID no SQL
**Sintoma**: `ERROR: 42883: operator does not exist: uuid = text`

**Solução**: 
- Script `test-profiles-access.sql` corrigido com conversão de tipos
- Script `test-profiles-simple.sql` criado para testes mais simples
- Função `loadAvailableSubstitutes` melhorada com validação de IDs

## 🔍 Diagnóstico e Debug

### Scripts de Diagnóstico

1. **`test-profiles-simple.sql`**: Script simples para verificar dados básicos (RECOMENDADO)
2. **`test-profiles-access.sql`**: Script completo com correções de tipo UUID
3. **Logs Adicionados**: A função `loadAvailableSubstitutes` agora tem logs detalhados

### Como Usar os Scripts de Diagnóstico

1. **No Supabase Dashboard**:
   - Vá para SQL Editor
   - Execute o conteúdo de `test-profiles-simple.sql` (recomendado)
   - Analise os resultados para identificar problemas

2. **No Console do Navegador**:
   - Abra as ferramentas de desenvolvedor (F12)
   - Vá para a aba Console
   - Procure por logs começando com 🔍, 👥, 📋, etc.

## 🚀 Como Testar

1. **Execute o projeto**:
   ```bash
   # Opção 1: PowerShell correto
   .\fix-powershell-syntax.ps1
   
   # Opção 2: Batch
   .\fix-powershell-syntax.bat
   
   # Opção 3: Manual
   npm run dev
   ```

2. **Acesse a página de Solicitações**
3. **Tente aprovar uma solicitação**
4. **Verifique se o dropdown de substitutos mostra todos os líderes disponíveis**
5. **Confirme se o líder primário é pré-selecionado**

## 📊 Logs Esperados

Quando funcionando corretamente, você deve ver logs como:
```
🔍 Buscando substitutos para usuário: [user-id]
👤 Funcionário encontrado: { nome: "Nome do Funcionário", responsavel: "Grupo", id: "..." }
🏢 Grupo encontrado - Nome: [nome do grupo]
👨‍💼 Líder Primário ID: [id do líder primário]
👥 Líderes (admin/superuser) encontrados: [número]
🏢 Grupos encontrados: [número]
👥 Total de substitutos encontrados: [número]
✅ Líder primário pré-selecionado: [nome do líder]
```

## 🔧 Correções de Tipagem

### Erro 1: `substitute_id` não existe no tipo
**Solução**: Adicionado `substitute_id: string | null` nas interfaces TypeScript

### Erro 2: Incompatibilidade de tipos no `saveEdit`
**Solução**: Adicionados type assertions explícitos:
```typescript
type: frontendType as Requestable['type'],
// ...
} as Requestable;
```

### Erro 3: Problemas de tipo UUID no SQL
**Solução**: 
- Adicionada validação de IDs na função `loadAvailableSubstitutes`
- Scripts SQL corrigidos com conversões de tipo apropriadas

## 📝 Próximos Passos

1. **Execute o diagnóstico** usando `test-profiles-simple.sql`
2. **Verifique os logs** no console do navegador
3. **Teste a funcionalidade** de seleção de substitutos
4. **Reporte problemas** específicos encontrados

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Execute o script de diagnóstico SQL (`test-profiles-simple.sql`)
3. Confirme se as políticas RLS estão corretas
4. Verifique se todos os perfis têm status 'active'
5. Confirme se os tipos de dados nas tabelas estão corretos 