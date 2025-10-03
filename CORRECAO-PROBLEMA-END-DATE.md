# 🔧 Correção: Problema com end_date

## 🚨 **PROBLEMA IDENTIFICADO**

### **❌ Análise dos Logs:**
```
client.ts:826 🔍 DEBUG: existingTimeOff: {id: 'e3699386-b264-4fd5-85a4-1ae0622cb58b', user_id: '238683f9-709f-4646-b801-f569029ec971', start_date: '2025-04-06T00:00:00+00:00', end_date: '2025-09-04T04:29:20.307+00:00', status: 'approved', …}
```

### **🔍 Problema Identificado:**

**A solicitação tem `end_date` diferente de `start_date`!**

- **`start_date`**: `2025-04-06T00:00:00+00:00`
- **`end_date`**: `2025-09-04T04:29:20.307+00:00` (data futura!)

**Isso significa que:**
1. ✅ **Dados carregados**: A solicitação existe na tabela `time_off`
2. ❌ **Dados inconsistentes**: `end_date` não é igual a `start_date`
3. ❌ **Não é "falta"**: É uma "folga" (time-off) porque `start_date !== end_date`

## 🔧 **CAUSA RAIZ IDENTIFICADA**

### **Problema na Lógica de Atualização:**

**Localização**: `src/integrations/supabase/client.ts` linha 1019

**Código problemático:**
```typescript
const updateData = {
  user_id: data.user_id || existingTimeOff.user_id,
  start_date: data.start_date || existingTimeOff.start_date,
  end_date: data.start_date || existingTimeOff.start_date, // ❌ PROBLEMA AQUI
  reason: data.reason || existingTimeOff.reason,
  status: data.status || existingTimeOff.status,
  updated_at: currentTime
};
```

### **❌ Problema Identificado:**

**A lógica estava incorreta:**
1. **`data.start_date`** pode ser `undefined` se não foi fornecido
2. **`existingTimeOff.start_date`** é usado como fallback
3. **Mas `existingTimeOff.end_date`** pode ser diferente de `start_date`
4. **Resultado**: `end_date` não é igual a `start_date` para "absence"

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **Nova Lógica Corrigida:**

**Localização**: `src/integrations/supabase/client.ts` linha 1016-1027

**Código corrigido:**
```typescript
// Para absence, garantir que end_date = start_date
const startDate = data.start_date || existingTimeOff.start_date;
const endDate = type === 'absence' ? startDate : (data.end_date || existingTimeOff.end_date);

const updateData = {
  user_id: data.user_id || existingTimeOff.user_id,
  start_date: startDate,
  end_date: endDate,
  reason: data.reason || existingTimeOff.reason,
  status: data.status || existingTimeOff.status,
  updated_at: currentTime
};
```

### **✅ Melhorias Implementadas:**

1. **Lógica clara**: `startDate` e `endDate` são calculados separadamente
2. **Garantia de consistência**: Para `type === 'absence'`, `endDate = startDate`
3. **Preservação de dados**: Para outros tipos, mantém `end_date` original se não fornecido
4. **Flexibilidade**: Permite `data.end_date` personalizado para outros tipos

## 🧪 **TESTE DA CORREÇÃO**

### **Cenário de Teste:**
1. **Usuário edita** solicitação para "falta" (absence)
2. **Sistema detecta** que `type === 'absence'`
3. **Sistema define** `endDate = startDate`
4. **Sistema atualiza** dados na tabela `time_off`
5. **Interface recarrega** e mostra "falta" corretamente

### **Logs Esperados:**
```
🔧 DEBUG: Dados para atualizar na tabela time_off: {user_id: '...', start_date: '2025-04-06T00:00:00.000Z', end_date: '2025-04-06T00:00:00.000Z', reason: '...', status: 'approved', …}
🔧 DEBUG: start_date === end_date? true
```

## 🚀 **STATUS**

✅ **CORREÇÃO IMPLEMENTADA** - Aguardando teste

---

**Nota**: A correção garante que quando o usuário seleciona "falta" (absence), o `end_date` seja sempre igual ao `start_date`, resolvendo o problema de inconsistência de dados e permitindo que a interface mostre o tipo correto.
