# 🔧 Correção: Lógica de end_date

## 🎯 **PROBLEMA IDENTIFICADO**

### **✅ Análise dos Logs:**

**EXCELENTE! Agora vejo exatamente o que está acontecendo:**

```
client.ts:946 🔧 DEBUG: Atualizando time_off com dados: {start_date: '2025-04-03T15:00:00.000Z', end_date: '2025-04-03T15:00:00.000Z', reason: 'Particular', status: 'approved', updated_at: '2025-09-04T05:26:58.029Z', …}
client.ts:953 ✅ Tabela time_off atualizada com sucesso!
```

**🎉 SUCESSO! A atualização está funcionando!**

**MAS o problema é:**
```
client.ts:946 🔧 DEBUG: Atualizando time_off com dados: {start_date: '2025-04-03T15:00:00.000Z', end_date: '2025-04-03T15:00:00.000Z', ...}
```

## 🔧 **CAUSA RAIZ IDENTIFICADA**

### **Problema na Lógica de end_date:**

**A lógica de atualização está funcionando, mas o `end_date` ainda está sendo definido como igual ao `start_date`!**

**Isso significa que:**
1. ✅ **Atualização está funcionando** corretamente
2. ❌ **Lógica de `end_date`** não está funcionando
3. ❌ **`end_date` ainda é igual** ao `start_date`

### **Problema Específico:**

**O problema é que o usuário está enviando `end_date: '2025-04-03T15:00:00.000Z'` que é igual ao `start_date`!**

**A lógica deveria ignorar o `end_date` fornecido pelo usuário quando ele é igual ao `start_date` e usar a lógica automática.**

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **Nova Lógica de end_date:**

**Localização**: `src/integrations/supabase/client.ts` linha 933

**Código corrigido:**
```typescript
end_date: (data.end_date && data.end_date !== data.start_date) ? data.end_date : (existingTimeOff.start_date === existingTimeOff.end_date ? new Date(new Date(existingTimeOff.start_date).getTime() + 24 * 60 * 60 * 1000).toISOString() : existingTimeOff.end_date),
```

### **✅ Melhorias Implementadas:**

1. **Verificação de igualdade**: Verifica se `data.end_date !== data.start_date`
2. **Lógica condicional**: Só usa `data.end_date` se for diferente do `start_date`
3. **Fallback automático**: Se `end_date` for igual ao `start_date`, usa a lógica automática
4. **Preservação de dados**: Mantém a lógica original para casos normais

## 🧪 **TESTE DA CORREÇÃO**

### **Cenário de Teste:**
1. **Usuário edita** solicitação de "falta" para "folga"
2. **Sistema detecta** mudança de tipo
3. **Sistema verifica** se `end_date` é igual ao `start_date`
4. **Sistema ignora** `end_date` fornecido pelo usuário
5. **Sistema usa** lógica automática para definir `end_date`
6. **Interface mostra** solicitação como "folga" com período correto

### **Logs Esperados:**
```
🔍 DEBUG: Mudando de absence para outro tipo: time-off
🔄 Mudando de absence para: time-off
📝 Atualizando registro existente na tabela requests...
📝 Atualizando tabela time_off para time-off...
🔧 DEBUG: Atualizando time_off com dados: {start_date: '2025-04-03T15:00:00.000Z', end_date: '2025-04-04T15:00:00.000Z', ...}
✅ Tabela time_off atualizada com sucesso!
```

### **Resultado na Interface:**
- **Tipo**: "Folga" (em vez de "Falta")
- **Período**: "03/04/2025 - 04/04/2025" (em vez de "03/04/2025")
- **Substituto**: Mantido corretamente

## 🚀 **STATUS**

✅ **CORREÇÃO IMPLEMENTADA** - Aguardando teste

---

**Nota**: Esta correção garante que quando o usuário fornece um `end_date` igual ao `start_date`, o sistema ignora esse valor e usa a lógica automática para definir um `end_date` diferente, garantindo que a solicitação seja exibida como "folga" em vez de "falta".
