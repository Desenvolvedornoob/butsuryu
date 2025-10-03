# 🔧 Correção: Substituto Apagado na Mudança para Saída/Atraso

## 🎯 Problema Identificado
**Erro**: Ao mudar o tipo de uma solicitação para "Saída Antecipada" ou "Atraso", o substituto estava sendo apagado.

**Causa**: A lógica de preservação do `substitute_id` não estava tratando corretamente os casos onde:
- O usuário não seleciona um novo substituto
- O valor é `'none'` ou `null`
- É necessário preservar o substituto existente

## 🔍 Análise do Problema

### **Código Anterior (❌ INCORRETO):**
```typescript
// Adicionar substitute_id se fornecido
if (data.substitute_id !== undefined) {
  earlyInsertData.substitute_id = data.substitute_id;
}
```

**Problemas:**
1. **Não tratava `'none'`**: Quando usuário seleciona "Nenhum substituto", o valor `'none'` era salvo literalmente
2. **Não preservava existente**: Se não fosse fornecido um novo valor, o substituto existente era perdido
3. **Lógica incompleta**: Não considerava todos os cenários possíveis

## ✅ Solução Implementada

### **Código Corrigido (✅ CORRETO):**
```typescript
// Adicionar substitute_id se fornecido
if (data.substitute_id !== undefined) {
  earlyInsertData.substitute_id = data.substitute_id === 'none' ? null : data.substitute_id;
} else if (existingRequest.substitute_id) {
  // Preservar substituto existente se não foi fornecido um novo
  earlyInsertData.substitute_id = existingRequest.substitute_id;
}
```

### **Lógica Implementada:**
1. **Se novo valor fornecido**:
   - Se for `'none'` → salva como `null`
   - Se for um ID válido → salva o ID
2. **Se nenhum novo valor**:
   - Preserva o substituto existente da solicitação original
3. **Cobertura completa**:
   - Mudança de tipo (inserção)
   - Atualização sem mudança de tipo
   - Todos os tipos: early-departure, lateness, time-off

## 🎯 Correções Aplicadas

### **1. Mudança para "early-departure"**
- ✅ Tratamento de `'none'` → `null`
- ✅ Preservação de substituto existente
- ✅ Lógica aplicada na inserção

### **2. Mudança para "lateness"**
- ✅ Tratamento de `'none'` → `null`
- ✅ Preservação de substituto existente
- ✅ Lógica aplicada na inserção

### **3. Atualização sem mudança de tipo**
- ✅ Tratamento de `'none'` → `null`
- ✅ Preservação de substituto existente
- ✅ Lógica aplicada na atualização

## 🎯 Resultado Esperado

Após a correção:
- ✅ **Substituto preservado** ao mudar para "Saída Antecipada"
- ✅ **Substituto preservado** ao mudar para "Atraso"
- ✅ **"Nenhum substituto"** salvo corretamente como `null`
- ✅ **Novo substituto** salvo corretamente
- ✅ **Substituto existente** mantido quando não alterado

## 🧪 Como Testar

### **1. Teste de Preservação**
1. Crie uma solicitação com substituto
2. Mude o tipo para "Saída Antecipada"
3. **Verificar**: Substituto deve ser preservado

### **2. Teste de Remoção**
1. Crie uma solicitação com substituto
2. Mude o tipo para "Atraso"
3. Altere o substituto para "Nenhum substituto"
4. **Verificar**: Substituto deve ser removido

### **3. Teste de Alteração**
1. Crie uma solicitação com substituto
2. Mude o tipo para "Saída Antecipada"
3. Altere o substituto para outro funcionário
4. **Verificar**: Novo substituto deve ser salvo

## 📁 Arquivos Modificados

- **`src/integrations/supabase/client.ts`** - Lógica de preservação de substituto corrigida
- **`CORRECAO-SUBSTITUTO-SAIDA-ATRASO.md`** - Este arquivo de documentação

## 🚀 Status

✅ **CORREÇÃO IMPLEMENTADA** - Pronta para teste

---

**Nota**: Esta correção resolve o problema de perda do substituto ao mudar o tipo de solicitação. As migrações do banco de dados ainda precisam ser executadas para que o campo `substitute_id` exista nas tabelas.
