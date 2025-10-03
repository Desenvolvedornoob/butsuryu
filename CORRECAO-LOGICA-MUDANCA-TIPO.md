# 🔧 Correção: Lógica de Mudança de Tipo

## 🚨 **PROBLEMA IDENTIFICADO**

### **❌ Análise dos Logs:**
```
🔍 DEBUG: Tipo solicitado: absence Tipo atual: absence
🔍 DEBUG: Comparação: type !== absence? false
🔍 DEBUG: Continua como absence, apenas atualizando time_off
🔍 DEBUG: Tipo solicitado: absence é igual a absence, então não muda o tipo
```

### **🔍 Causa do Problema:**

**Você está tentando mudar PARA `absence`, mas o sistema detecta que já é `absence` e não faz a mudança!**

**Situação:**
- **Tabela `requests`**: `type: 'time-off'` (que representa "folga")
- **Tabela `time_off`**: existe como `absence` (start_date = end_date)
- **Você quer**: Mudar de "folga" para "falta" (`absence`)

**Problema na lógica:**
- Sistema só verifica se `type !== 'absence'`
- Não verifica se o tipo na tabela `requests` é diferente do solicitado
- Resultado: não faz mudança quando deveria

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **1. Detecção de Mudança de Tipo**
**Localização**: `src/integrations/supabase/client.ts` linha 861-867

**Adicionado:**
```typescript
// Verificar se há mudança de tipo baseada na tabela requests
const currentRequestType = existingRequest?.type;
const needsTypeChange = currentRequestType !== dbType;

console.log('🔍 DEBUG: Tipo atual na tabela requests:', currentRequestType);
console.log('🔍 DEBUG: Tipo solicitado (dbType):', dbType);
console.log('🔍 DEBUG: Precisa mudar tipo?', needsTypeChange);
```

### **2. Lógica de Atualização de Tipo**
**Localização**: `src/integrations/supabase/client.ts` linha 976-997

**Adicionado:**
```typescript
// Se o tipo na tabela requests é diferente de 'time-off', precisa atualizar
if (needsTypeChange) {
  console.log('🔧 Atualizando tipo na tabela requests de', currentRequestType, 'para', dbType);
  
  const { error: updateTypeError } = await supabase
    .from('requests')
    .update({ type: dbType })
    .eq('id', requestId);
  
  if (updateTypeError) {
    console.error('❌ Erro ao atualizar tipo na tabela requests:', updateTypeError);
  } else {
    console.log('✅ Tipo atualizado na tabela requests:', dbType);
  }
} else {
  console.log('🔍 DEBUG: Tipo já está correto na tabela requests, apenas atualizando time_off');
}
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
   - `🔍 DEBUG: Tipo atual na tabela requests:`
   - `🔍 DEBUG: Tipo solicitado (dbType):`
   - `🔍 DEBUG: Precisa mudar tipo?`
2. **Confirme se a mudança é aplicada**:
   - `🔧 Atualizando tipo na tabela requests de X para Y`
   - `✅ Tipo atualizado na tabela requests: Y`

## 🔍 **Análise da Correção**

### **Problema Original:**
- Lógica só verificava se `type !== 'absence'`
- Não detectava mudanças de "folga" para "falta"
- Tipo não era atualizado na tabela `requests`

### **Solução Implementada:**
- ✅ Detecção de mudança baseada na tabela `requests`
- ✅ Comparação entre tipo atual e tipo solicitado
- ✅ Atualização do tipo na tabela `requests` quando necessário
- ✅ Logs informativos sobre o processo

## 📋 **Próximos Passos**

1. **Execute o teste** de mudança de tipo
2. **Verifique os logs** para confirmar o funcionamento
3. **Confirme se o tipo** persiste após a edição
4. **Teste outros tipos** de mudança se necessário

## 🚀 **Status**

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando teste do usuário

---

**Nota**: A correção implementa detecção inteligente de mudanças de tipo, comparando o tipo atual na tabela `requests` com o tipo solicitado, permitindo mudanças de "folga" para "falta" e vice-versa.
