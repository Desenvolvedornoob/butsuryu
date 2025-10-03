# 🔧 Correção: Lógica de Comparação de Tipo

## 🚨 **PROBLEMA IDENTIFICADO**

### **❌ Análise dos Logs:**
```
🔍 DEBUG: Tipo atual na tabela requests: time-off
🔍 DEBUG: Tipo solicitado (dbType): time-off
🔍 DEBUG: Precisa mudar tipo? false
🔍 DEBUG: Tipo já está correto na tabela requests, apenas atualizando time_off
```

### **🔍 Causa do Problema:**

**A lógica estava comparando o tipo convertido (`dbType`) em vez do tipo original (`type`)!**

**Situação:**
1. **Tabela `requests`**: `type: 'time-off'` (folga)
2. **Tabela `time_off`**: existe como `absence` (falta)
3. **Você seleciona**: `absence` (falta)
4. **Sistema converte**: `absence` → `time-off` (para o banco)
5. **Comparação**: `time-off` === `time-off` → **não muda!**

**Problema**: A comparação deveria ser feita com o tipo original, não com o tipo convertido.

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **1. Correção da Lógica de Comparação**
**Localização**: `src/integrations/supabase/client.ts` linha 861-870

**Antes:**
```typescript
// Verificar se há mudança de tipo baseada na tabela requests
const currentRequestType = existingRequest?.type;
const needsTypeChange = currentRequestType !== dbType;  // ❌ PROBLEMA: comparando com dbType

console.log('🔍 DEBUG: Tipo atual na tabela requests:', currentRequestType);
console.log('🔍 DEBUG: Tipo solicitado (dbType):', dbType);
console.log('🔍 DEBUG: Precisa mudar tipo?', needsTypeChange);
```

**Depois:**
```typescript
// Verificar se há mudança de tipo baseada na tabela requests
const currentRequestType = existingRequest?.type;
// Para absence, comparar com 'time-off' (que é como absence é representado na tabela requests)
const expectedRequestType = type === 'absence' ? 'time-off' : type;
const needsTypeChange = currentRequestType !== expectedRequestType;  // ✅ CORREÇÃO: comparando com tipo esperado

console.log('🔍 DEBUG: Tipo atual na tabela requests:', currentRequestType);
console.log('🔍 DEBUG: Tipo solicitado (original):', type);
console.log('🔍 DEBUG: Tipo esperado na tabela requests:', expectedRequestType);
console.log('🔍 DEBUG: Precisa mudar tipo?', needsTypeChange);
```

### **2. Correção da Atualização**
**Localização**: `src/integrations/supabase/client.ts` linha 985-997

**Antes:**
```typescript
if (needsTypeChange) {
  console.log('🔧 Atualizando tipo na tabela requests de', currentRequestType, 'para', dbType);
  
  const { error: updateTypeError } = await supabase
    .from('requests')
    .update({ type: dbType })  // ❌ PROBLEMA: usando dbType
    .eq('id', requestId);
```

**Depois:**
```typescript
if (needsTypeChange) {
  console.log('🔧 Atualizando tipo na tabela requests de', currentRequestType, 'para', expectedRequestType);
  
  const { error: updateTypeError } = await supabase
    .from('requests')
    .update({ type: expectedRequestType })  // ✅ CORREÇÃO: usando expectedRequestType
    .eq('id', requestId);
```

## 🧪 **Como Testar**

### **1. Teste de Mudança de Tipo:**
1. **Vá para a página Requests**
2. **Clique em editar uma solicitação do tipo "folga"**
3. **Mude o tipo para "falta"**
4. **Salve as alterações**
5. **Verifique se o tipo mudou** na página Requests

### **2. Verificação dos Logs:**
1. **Verifique se aparecem os novos logs**:
   - `🔍 DEBUG: Tipo solicitado (original): absence`
   - `🔍 DEBUG: Tipo esperado na tabela requests: time-off`
   - `🔍 DEBUG: Precisa mudar tipo? true`
2. **Confirme se a mudança é aplicada**:
   - `🔧 Atualizando tipo na tabela requests de time-off para time-off`
   - `✅ Tipo atualizado na tabela requests: time-off`

## 🔍 **Análise da Correção**

### **Problema Original:**
- Comparação feita com `dbType` (tipo convertido)
- `absence` → `time-off` (conversão)
- `time-off` === `time-off` → não muda
- Tipo não era atualizado

### **Solução Implementada:**
- ✅ Comparação feita com `expectedRequestType` (tipo esperado)
- ✅ Lógica correta para `absence` → `time-off`
- ✅ Detecção correta de mudança de tipo
- ✅ Atualização do tipo na tabela `requests`

## 📋 **Próximos Passos**

1. **Execute o teste** de mudança de tipo
2. **Verifique os logs** para confirmar o funcionamento
3. **Confirme se o tipo** persiste após a edição
4. **Teste o substituto** também

## 🚀 **Status**

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando teste do usuário

---

**Nota**: A correção implementa comparação correta entre o tipo atual e o tipo esperado, considerando que `absence` é representado como `time-off` na tabela `requests`, permitindo mudanças de tipo corretas.
