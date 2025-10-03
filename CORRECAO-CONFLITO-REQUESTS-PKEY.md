# 🔧 Correção: Conflito de Chave Primária na Tabela Requests

## 🎯 Problema Identificado
**Erro**: "duplicate key value violates unique constraint "requests_pkey"" ao tentar mudar de "Falta" para "Atraso".

**Causa**: O código estava tentando inserir um novo registro na tabela `requests` com um ID que já existia, causando violação da constraint de chave primária.

## 🔍 Análise do Problema

### **Código Anterior (❌ INCORRETO):**
```typescript
// Sempre tentava inserir, mesmo se já existisse
const { error: insertError } = await supabase
  .from('requests')
  .insert({
    id: requestId, // ❌ ID pode já existir
    type: dbType,
    // ... outros campos
  });
```

**Problemas:**
1. **Inserção forçada**: Sempre tentava `INSERT`, mesmo se o registro já existisse
2. **Conflito de chave**: Violação da constraint `requests_pkey`
3. **Erro 409**: Conflict devido à duplicação de ID

## ✅ Solução Implementada

### **1. Verificação de Existência**
```typescript
// Verificar se já existe na tabela requests
const { data: existingRequestCheck } = await supabase
  .from('requests')
  .select('id')
  .eq('id', requestId)
  .maybeSingle();
```

### **2. Lógica Condicional (INSERT vs UPDATE)**
```typescript
if (existingRequestCheck) {
  // Atualizar se já existe
  console.log('📝 Atualizando registro existente na tabela requests...');
  const { error: updateError } = await supabase
    .from('requests')
    .update(requestsData)
    .eq('id', requestId);
} else {
  // Inserir se não existe
  console.log('➕ Inserindo novo registro na tabela requests...');
  const { error: insertError } = await supabase
    .from('requests')
    .insert(requestsData);
}
```

### **3. Dados Corretos para Cada Tipo**
```typescript
const requestsData = {
  id: requestId,
  type: dbType as 'time-off' | 'early-departure' | 'lateness',
  user_id: data.user_id || existingTimeOff.user_id,
  start_date: data.start_date || existingTimeOff.start_date,
  end_date: dbType === 'time-off' ? (data.end_date || existingTimeOff.end_date) : null,
  reason: data.reason || existingTimeOff.reason,
  status: data.status || existingTimeOff.status,
  time: dbType === 'early-departure' ? (data.time || '00:00') : null,
  arrival_time: dbType === 'lateness' ? (data.arrival_time || '00:00') : null,
  created_at: existingTimeOff.created_at,
  updated_at: currentTime
};
```

### **4. Preservação de Substituto**
```typescript
// Adicionar substitute_id se fornecido
if (data.substitute_id !== undefined) {
  requestsData.substitute_id = data.substitute_id === 'none' ? null : data.substitute_id;
} else if (existingTimeOff.substitute_id) {
  requestsData.substitute_id = existingTimeOff.substitute_id;
}
```

## 🎯 Correções Aplicadas

### **1. Verificação de Existência**
- ✅ **Consulta prévia**: Verifica se o ID já existe na tabela `requests`
- ✅ **Lógica condicional**: Decide entre `INSERT` e `UPDATE`
- ✅ **Evita conflitos**: Não tenta inserir ID duplicado

### **2. Tratamento de Campos por Tipo**
- ✅ **time-off**: Inclui `end_date`, remove `time` e `arrival_time`
- ✅ **early-departure**: Inclui `time`, remove `end_date` e `arrival_time`
- ✅ **lateness**: Inclui `arrival_time`, remove `end_date` e `time`

### **3. Preservação de Dados**
- ✅ **Substituto**: Mantém `substitute_id` existente ou usa novo valor
- ✅ **Timestamps**: Preserva `created_at`, atualiza `updated_at`
- ✅ **Dados do usuário**: Mantém `user_id`, `reason`, `status`

### **4. Logs de Debug**
- ✅ **Mudança de tipo**: `🔄 Mudando de absence para: [tipo]`
- ✅ **Operação**: `📝 Atualizando registro existente` ou `➕ Inserindo novo registro`

## 🎯 Resultado Esperado

Após a correção:
- ✅ **Mudança de "Falta" para "Atraso"** funcionará
- ✅ **Mudança de "Falta" para "Saída Antecipada"** funcionará
- ✅ **Mudança de "Falta" para "Folga"** funcionará
- ✅ **Sem conflitos de chave primária**
- ✅ **Substituto preservado** durante mudança

## 🧪 Como Testar

### **1. Teste de Mudança de Tipo**
1. Crie uma solicitação de "Falta"
2. Edite e mude o tipo para "Atraso"
3. Salve a edição
4. **Verificar no console**:
   - `🔍 Solicitação encontrada na tabela: time_off`
   - `🔄 Mudando de absence para: lateness`
   - `📝 Atualizando registro existente na tabela requests...` ou `➕ Inserindo novo registro na tabela requests...`

### **2. Teste de Preservação de Substituto**
1. Crie uma solicitação de "Falta" com substituto
2. Mude o tipo para "Atraso"
3. **Verificar**: Substituto deve ser preservado

### **3. Teste de Diferentes Tipos**
1. Teste mudança de "Falta" para:
   - "Atraso" (lateness)
   - "Saída Antecipada" (early-departure)
   - "Folga" (time-off)
2. **Verificar**: Todos devem funcionar sem erro 409

## 📁 Arquivos Modificados

- **`src/integrations/supabase/client.ts`** - Função `updateRequest` corrigida
- **`CORRECAO-CONFLITO-REQUESTS-PKEY.md`** - Este arquivo de documentação

## 🚀 Status

✅ **CORREÇÃO IMPLEMENTADA** - Pronta para teste

---

**Nota**: Esta correção resolve o problema de conflito de chave primária ao mudar de "Falta" para outros tipos. Agora a função verifica se o registro já existe antes de tentar inserir, evitando o erro 409.
