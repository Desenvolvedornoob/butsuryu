# 🔧 Correção: Enum `request_type` Inválido

## 🚨 **PROBLEMA IDENTIFICADO**

### **❌ Erro 400 (Bad Request):**
```
PATCH https://xuywsfscrzypuppzaiks.supabase.co/rest/v1/requests?id=eq.e3699386-b264-4fd5-85a4-1ae0622cb58b 400 (Bad Request)
```

**Erro específico:**
```
❌ Erro ao corrigir inconsistência: {code: '22P02', details: null, hint: null, message: 'invalid input value for enum request_type: "absence"'}
```

### **🔍 Causa do Problema:**

**O valor `"absence"` não é válido** para o enum `request_type` na tabela `requests`!

**Valores válidos do enum `request_type`:**
- ✅ `'time-off'`
- ✅ `'early-departure'`
- ✅ `'lateness'`
- ❌ `'absence'` (NÃO é válido)

### **🔍 Análise do Código:**

**Lógica do sistema:**
1. **`'absence'`** é um tipo lógico usado na interface
2. **Na tabela `requests`**, `'absence'` é representado como `'time-off'`
3. **A detecção de `'absence'`** é feita pela lógica: `start_date === end_date`

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **1. Correção do Valor do Enum**
**Localização**: `src/integrations/supabase/client.ts` linha 842-857

**Antes:**
```typescript
// Verificar se há inconsistência entre requests e time_off
if (existingRequest && existingRequest.type !== 'absence') {
  console.log('⚠️ INCONSISTÊNCIA DETECTADA: Request marcada como', existingRequest.type, 'mas existe como absence em time_off');
  console.log('🔧 Corrigindo inconsistência: atualizando tipo na tabela requests para absence');
  
  // Corrigir a inconsistência atualizando o tipo na tabela requests
  const { error: fixError } = await supabase
    .from('requests')
    .update({ type: 'absence' })  // ❌ ERRO: 'absence' não é válido no enum
    .eq('id', requestId);
```

**Depois:**
```typescript
// Verificar se há inconsistência entre requests e time_off
if (existingRequest && existingRequest.type !== 'time-off') {
  console.log('⚠️ INCONSISTÊNCIA DETECTADA: Request marcada como', existingRequest.type, 'mas existe como absence em time_off');
  console.log('🔧 Corrigindo inconsistência: atualizando tipo na tabela requests para time-off');
  
  // Corrigir a inconsistência atualizando o tipo na tabela requests
  // 'absence' é representado como 'time-off' na tabela requests
  const { error: fixError } = await supabase
    .from('requests')
    .update({ type: 'time-off' })  // ✅ CORREÇÃO: 'time-off' é válido no enum
    .eq('id', requestId);
```

### **2. Comentário Explicativo**
**Adicionado:**
```typescript
// 'absence' é representado como 'time-off' na tabela requests
```

## 🧪 **Como Testar**

### **1. Teste de Correção de Inconsistência:**
1. **Vá para a página Requests**
2. **Clique em editar a solicitação problemática**
3. **Verifique se aparecem logs** sobre inconsistência detectada
4. **Confirme se a inconsistência foi corrigida** sem erro 400

### **2. Teste de Mudança de Tipo:**
1. **Tente mudar o tipo** da solicitação
2. **Verifique se a mudança** é aplicada corretamente
3. **Confirme se o substituto** aparece na página Requests

### **3. Teste de Substituto:**
1. **Na tela de edição, defina um substituto**
2. **Salve as alterações**
3. **Verifique se o substituto aparece** na página Requests

## 🔍 **Análise da Correção**

### **Problema Original:**
- Tentativa de usar `'absence'` no enum `request_type`
- Enum só aceita: `'time-off'`, `'early-departure'`, `'lateness'`
- Erro 400 ao tentar corrigir inconsistência

### **Solução Implementada:**
- ✅ Uso do valor correto `'time-off'` para representar `'absence'`
- ✅ Comentário explicativo sobre a lógica
- ✅ Preservação da funcionalidade existente
- ✅ Correção da inconsistência de dados

## 📋 **Próximos Passos**

1. **Execute o teste** e verifique se não há mais erro 400
2. **Confirme se a inconsistência** é corrigida com sucesso
3. **Teste a mudança de tipo** após a correção
4. **Verifique se o substituto** aparece corretamente

## 🚀 **Status**

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando teste do usuário

---

**Nota**: A correção usa o valor correto do enum `request_type` (`'time-off'`) para representar solicitações do tipo `'absence'`, resolvendo o erro 400 e permitindo a correção da inconsistência de dados.
