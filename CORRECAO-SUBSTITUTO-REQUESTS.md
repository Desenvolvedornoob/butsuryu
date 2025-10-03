# 🔧 Correção: Substitute_id para Requests da Tabela `requests`

## 🎯 **PROBLEMA IDENTIFICADO**

**Request ID**: `e3699386-b264-4fd5-85a4-1ae0622cb58b`
**Tipo**: `lateness`
**Causa**: `🔍 DEBUG: Request sem substituto tem substitute_id? undefined`

**A request está na tabela `requests` como `lateness`, mas o código só processava `substitute_id` para requests do tipo `time-off`.**

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **1. Coleta de substitute_id das Requests:**
```typescript
// Coletar IDs dos usuários e revisores
requestsData?.forEach(req => {
  allUserIds.add(req.user_id);
  if (req.approved_by) allUserIds.add(req.approved_by);
  if (req.rejected_by) allUserIds.add(req.rejected_by);
  if (req.substitute_id) allUserIds.add(req.substitute_id); // ✅ ADICIONADO
});
```

### **2. Processamento de substitute_id por Tipo:**
```typescript
// Buscar substitute_id da tabela específica
let substituteName = null;
if (req.type === 'time-off') {
  const timeOffRecord = timeOffRequests?.find(to => to.id === req.id);
  if (timeOffRecord?.substitute_id) {
    const substituteProfile = profileMap.get(timeOffRecord.substitute_id);
    substituteName = substituteProfile ? substituteProfile.first_name : null;
  }
} else if (req.type === 'early-departure') {
  const earlyRecord = earlyDepartureRequests?.find(ed => ed.id === req.id);
  if (earlyRecord?.substitute_id) {
    const substituteProfile = profileMap.get(earlyRecord.substitute_id);
    substituteName = substituteProfile ? substituteProfile.first_name : null;
  }
} else if (req.type === 'lateness') {
  const latenessRecord = latenessRequests?.find(l => l.id === req.id);
  if (latenessRecord?.substitute_id) {
    const substituteProfile = profileMap.get(latenessRecord.substitute_id);
    substituteName = substituteProfile ? substituteProfile.first_name : null;
  }
}
```

## 🧪 **Como Testar**

### **1. Teste de Request sem Substituto:**
1. **Vá para a página Requests**
2. **Verifique no console**:
   - `🔍 DEBUG: Requests carregadas da tabela requests: [array]`
   - `🔍 DEBUG: Request sem substituto tem substitute_id? [valor]`
   - Se o valor for `null` ou `undefined`, o problema está no banco de dados
   - Se o valor existir, o problema está no mapeamento

### **2. Teste de Mudança de Tipo:**
1. **Tente editar uma solicitação e mudar o tipo**
2. **Verifique no console**:
   - `🔍 DEBUG: Tipo solicitado: [tipo] Tipo atual: absence`
   - `🔍 DEBUG: Continua como absence, apenas atualizando time_off`
   - `✅ DEBUG: updateRequest concluído com sucesso`

## 🔍 **Análise da Correção**

### **Problema Original:**
- A request `e3699386-b264-4fd5-85a4-1ae0622cb58b` está na tabela `requests` como `lateness`
- O código só processava `substitute_id` para requests do tipo `time-off`
- Requests do tipo `lateness` e `early-departure` não tinham `substitute_id` processado

### **Solução Implementada:**
- Adicionado coleta de `substitute_id` das requests da tabela `requests`
- Adicionado processamento de `substitute_id` para todos os tipos de request
- Busca o `substitute_id` na tabela específica correspondente ao tipo

## 📋 **Próximos Passos**

1. **Execute o teste** e verifique os logs no console
2. **Compartilhe os logs** para análise:
   - `🔍 DEBUG: Request sem substituto tem substitute_id? [valor]`
   - `🔍 DEBUG: Requests carregadas da tabela requests: [array]`

3. **Identifique**:
   - Se a request sem substituto agora tem `substitute_id`
   - Se o `substituteName` está sendo exibido corretamente

## 🚀 **Status**

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando logs do usuário

---

**Nota**: A correção foi implementada para processar `substitute_id` para todos os tipos de request da tabela `requests`, incluindo `lateness` e `early-departure`.
