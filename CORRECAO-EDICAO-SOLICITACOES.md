# 🔧 Correção: Problema na Edição de Solicitações

## 🎯 Problema Identificado
**Erro**: Ao editar solicitações na página Requests, o tipo e o substituto não estavam sendo atualizados corretamente.

**Sintomas**:
- Tipo da solicitação não mudava ao editar
- Campo substituto não era salvo/atualizado
- Logs mostravam: "Atualizando solicitação com dados: {type: 'absence', ...}" mas não persistia

## 🔍 Causa Raiz
O problema estava na função `updateRequest` no arquivo `src/integrations/supabase/client.ts`. 

**Problemas encontrados**:
1. **Campo `substitute_id` não incluído** na atualização da tabela `requests` quando o tipo não mudava
2. **Campo `substitute_id` não incluído** na atualização da tabela `requests` quando o tipo mudava
3. Apenas as tabelas específicas (`time_off`, `early_departures`, `lateness`) recebiam o `substitute_id`

## ✅ Solução Implementada

### **1. Correção na Atualização sem Mudança de Tipo**
```typescript
// ANTES (linha ~954-966)
const { error: updateError } = await supabase
  .from('requests')
  .update({
    user_id: data.user_id || existingRequest.user_id,
    // ... outros campos
    updated_at: currentTime
  })
  .eq('id', requestId);

// DEPOIS
const requestsUpdateData: any = {
  user_id: data.user_id || existingRequest.user_id,
  // ... outros campos
  updated_at: currentTime
};

// Adicionar substitute_id se fornecido
if (data.substitute_id !== undefined) {
  requestsUpdateData.substitute_id = data.substitute_id;
}

const { error: updateError } = await supabase
  .from('requests')
  .update(requestsUpdateData)
  .eq('id', requestId);
```

### **2. Correção na Atualização com Mudança de Tipo**
```typescript
// ANTES (linha ~843-856)
const { error: updateError } = await supabase
  .from('requests')
  .update({
    type: dbType as 'time-off' | 'early-departure' | 'lateness',
    // ... outros campos
    updated_at: currentTime
  })
  .eq('id', requestId);

// DEPOIS
const requestsUpdateData: any = {
  type: dbType as 'time-off' | 'early-departure' | 'lateness',
  // ... outros campos
  updated_at: currentTime
};

// Adicionar substitute_id se fornecido
if (data.substitute_id !== undefined) {
  requestsUpdateData.substitute_id = data.substitute_id;
}

const { error: updateError } = await supabase
  .from('requests')
  .update(requestsUpdateData)
  .eq('id', requestId);
```

## 🎯 Resultado Esperado

Após a correção:
- ✅ **Tipo da solicitação** será atualizado corretamente
- ✅ **Campo substituto** será salvo na tabela `requests`
- ✅ **Dados persistirão** corretamente no banco
- ✅ **Edição funcionará** para todos os tipos de solicitação

## 🧪 Como Testar

### **1. Teste de Mudança de Tipo**
1. Acesse a página "Solicitações" (Requests)
2. Clique em "Editar" em uma solicitação
3. Mude o tipo (ex: de "Folga" para "Saída Antecipada")
4. Clique em "Salvar Alterações"
5. **Verificar**: O tipo deve mudar na listagem

### **2. Teste de Mudança de Substituto**
1. Edite uma solicitação
2. Mude o substituto selecionado
3. Clique em "Salvar Alterações"
4. **Verificar**: O substituto deve aparecer na coluna "Substituto"

### **3. Teste de Mudança de Ambos**
1. Edite uma solicitação
2. Mude tanto o tipo quanto o substituto
3. Clique em "Salvar Alterações"
4. **Verificar**: Ambos devem ser atualizados

## 📁 Arquivos Modificados

- **`src/integrations/supabase/client.ts`** - Função `updateRequest` corrigida
- **`CORRECAO-EDICAO-SOLICITACOES.md`** - Este arquivo de documentação

## 🚀 Status

✅ **CORREÇÃO IMPLEMENTADA** - Pronta para teste

---

**Nota**: Esta correção resolve o problema de edição de solicitações, mas as migrações do banco de dados ainda precisam ser executadas para que o campo `substitute_id` exista nas tabelas.
