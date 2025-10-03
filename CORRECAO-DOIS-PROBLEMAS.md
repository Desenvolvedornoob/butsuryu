# 🔧 Correção: Dois Problemas Identificados

## 🎯 **PROBLEMAS IDENTIFICADOS**

### **✅ Análise dos Logs:**

**Dois problemas distintos foram identificados:**

1. **Solicitação que sumiu**: `requests.ts:98 ❌ DEBUG: SOLICITAÇÃO PROBLEMÁTICA NÃO ENCONTRADA NOS DADOS!`

2. **Solicitação que não consegue mudar de "falta" para "folga"**:
```
client.ts:838 🔍 DEBUG: Tipo solicitado: time-off Tipo atual: absence
client.ts:887 🔍 DEBUG: Mudando de absence para outro tipo: time-off
client.ts:888 🔄 Mudando de absence para: time-off
client.ts:920 📝 Atualizando registro existente na tabela requests...
```

## 🔧 **PROBLEMA 1: Solicitação que sumiu**

### **Causa Raiz:**
**A solicitação `e3699386-b264-4fd5-85a4-1ae0622cb58b` não está sendo encontrada nos dados carregados, indicando que a inserção na tabela `time_off` pode ter falhado.**

### **Correção Implementada:**
**Adicionados logs detalhados para rastrear a inserção:**

```typescript
console.log('🔧 DEBUG: Inserindo na tabela time_off:', timeOffInsertData);
const { error: timeOffError } = await supabase
  .from('time_off')
  .insert(timeOffInsertData);

if (timeOffError) {
  console.error('❌ Erro ao inserir na tabela time_off:', timeOffError);
  throw timeOffError;
}
console.log('✅ Inserção na tabela time_off bem-sucedida!');
```

## 🔧 **PROBLEMA 2: Solicitação que não consegue mudar de "falta" para "folga"**

### **Causa Raiz:**
**Quando o usuário quer mudar de "absence" para "time-off", o sistema não está alterando o `end_date` para ser diferente do `start_date`. O problema está na linha 902:**

```typescript
end_date: dbType === 'time-off' ? (data.end_date || existingTimeOff.end_date) : null,
```

**Se o usuário não fornecer um `end_date` diferente, o sistema usa `existingTimeOff.end_date` que é igual ao `start_date` (porque era uma "absence").**

### **Correção Implementada:**
**Lógica corrigida para garantir que quando muda de "absence" para "time-off", o `end_date` seja diferente do `start_date`:**

```typescript
end_date: dbType === 'time-off' ? (data.end_date || (existingTimeOff.start_date === existingTimeOff.end_date ? new Date(new Date(existingTimeOff.start_date).getTime() + 24 * 60 * 60 * 1000).toISOString() : existingTimeOff.end_date)) : null,
```

**Esta lógica:**
1. **Se o usuário forneceu `end_date`**: Usa o valor fornecido
2. **Se não forneceu e era "absence"**: Adiciona 1 dia ao `start_date`
3. **Se não forneceu e não era "absence"**: Usa o `end_date` existente

## 🧪 **TESTE DAS CORREÇÕES**

### **Cenário 1 - Solicitação que sumiu:**
1. **Usuário edita** solicitação para "falta" (absence)
2. **Sistema remove** da tabela `requests`
3. **Sistema insere** na tabela `time_off`
4. **Logs mostram** se a inserção foi bem-sucedida
5. **Interface mostra** solicitação como "falta"

### **Cenário 2 - Mudança de "falta" para "folga":**
1. **Usuário edita** solicitação de "falta" para "folga"
2. **Sistema detecta** mudança de tipo
3. **Sistema altera** `end_date` para ser diferente do `start_date`
4. **Interface mostra** solicitação como "folga" com período correto

### **Logs Esperados:**

**Para Problema 1:**
```
🔧 DEBUG: Inserindo na tabela time_off: {id: 'e3699386-b264-4fd5-85a4-1ae0622cb58b', ...}
✅ Inserção na tabela time_off bem-sucedida!
🔍 DEBUG: SOLICITAÇÃO PROBLEMÁTICA ENCONTRADA NOS DADOS!
```

**Para Problema 2:**
```
🔍 DEBUG: Mudando de absence para outro tipo: time-off
🔄 Mudando de absence para: time-off
📝 Atualizando registro existente na tabela requests...
```

## 🚀 **STATUS**

✅ **CORREÇÕES IMPLEMENTADAS** - Aguardando teste

---

**Nota**: As correções abordam tanto o problema de inserção na tabela `time_off` quanto a lógica de mudança de "absence" para "time-off", garantindo que o `end_date` seja corretamente ajustado para representar um período de folga.
