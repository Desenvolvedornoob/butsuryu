# 🔧 Correção: Busca de Solicitações em Tabelas Específicas

## 🎯 Problema Identificado
**Erro**: "Solicitação com ID não encontrada em nenhuma tabela" ao tentar mudar de "Atraso" para "Falta".

**Causa**: A função `updateRequest` estava buscando solicitações apenas na tabela `requests`, mas solicitações de "lateness" e "early-departure" estão armazenadas nas tabelas específicas (`lateness`, `early_departures`) e não necessariamente na tabela `requests`.

## 🔍 Análise do Problema

### **Código Anterior (❌ INCORRETO):**
```typescript
// Buscava apenas na tabela requests
const { data: existingRequest } = await supabase
  .from('requests')
  .select('*')
  .eq('id', requestId)
  .maybeSingle();

// Se não encontrasse, buscava apenas em time_off
if (!existingRequest) {
  const { data: existingTimeOff } = await supabase
    .from('time_off')
    .select('*')
    .eq('id', requestId)
    .single();
}
```

**Problemas:**
1. **Busca incompleta**: Não verificava tabelas `lateness` e `early_departures`
2. **Erro 406**: Tentativa de buscar em `time_off` com ID de `lateness`
3. **Lógica falha**: Não detectava solicitações em tabelas específicas

## ✅ Solução Implementada

### **1. Busca Completa em Todas as Tabelas**
```typescript
// Buscar a solicitação em todas as tabelas possíveis
let existingRequest = null;
let existingTimeOff = null;
let existingEarlyDeparture = null;
let existingLateness = null;
let currentTable = null;

// Buscar na tabela requests
const { data: requestData } = await supabase
  .from('requests')
  .select('*')
  .eq('id', requestId)
  .maybeSingle();

// Buscar na tabela time_off
const { data: timeOffData } = await supabase
  .from('time_off')
  .select('*')
  .eq('id', requestId)
  .maybeSingle();

// Buscar na tabela early_departures
const { data: earlyData } = await supabase
  .from('early_departures')
  .select('*')
  .eq('id', requestId)
  .maybeSingle();

// Buscar na tabela lateness
const { data: latenessData } = await supabase
  .from('lateness')
  .select('*')
  .eq('id', requestId)
  .maybeSingle();
```

### **2. Lógica para Tabelas Específicas**
```typescript
// Se encontrou em tabelas específicas (lateness, early_departures)
if (existingLateness || existingEarlyDeparture) {
  const currentType = existingLateness ? 'lateness' : 'early-departure';
  const currentData = existingLateness || existingEarlyDeparture;
  
  // Se o tipo mudou
  if (type !== currentType) {
    // Caso especial: mudança para 'absence'
    if (type === 'absence') {
      // Remover da tabela específica
      if (existingLateness) {
        await supabase.from('lateness').delete().eq('id', requestId);
      }
      
      // Inserir em time_off como absence
      const absenceData = {
        id: requestId,
        user_id: data.user_id || currentData.user_id,
        start_date: data.start_date || currentData.date,
        end_date: data.start_date || currentData.date, // Para absence, start_date = end_date
        reason: data.reason || currentData.reason,
        status: data.status || currentData.status,
        substitute_id: data.substitute_id === 'none' ? null : data.substitute_id
      };
      
      await supabase.from('time_off').insert(absenceData);
    }
  }
}
```

### **3. Logs de Debug**
```typescript
console.log('🔍 Solicitação encontrada na tabela:', currentTable);
console.log('🔄 Processando solicitação de tabela específica...');
console.log('🔍 Verificando mudança de tipo:', {
  tipoOriginal: type,
  tipoExistente: currentType,
  mudou: type !== currentType
});
```

## 🎯 Correções Aplicadas

### **1. Busca Completa**
- ✅ **Tabela requests**: Para solicitações normais
- ✅ **Tabela time_off**: Para faltas (absence)
- ✅ **Tabela early_departures**: Para saídas antecipadas
- ✅ **Tabela lateness**: Para atrasos

### **2. Lógica de Mudança de Tipo**
- ✅ **lateness → absence**: Remove de `lateness`, insere em `time_off`
- ✅ **early-departure → absence**: Remove de `early_departures`, insere em `time_off`
- ✅ **Preservação de substituto**: Mantém `substitute_id` durante mudança
- ✅ **Tratamento de 'none'**: Converte `'none'` para `null`

### **3. Atualização sem Mudança**
- ✅ **lateness**: Atualiza diretamente na tabela `lateness`
- ✅ **early-departure**: Atualiza diretamente na tabela `early_departures`
- ✅ **Preservação de dados**: Mantém dados existentes quando não alterados

## 🎯 Resultado Esperado

Após a correção:
- ✅ **Mudança de "Atraso" para "Falta"** funcionará
- ✅ **Mudança de "Saída Antecipada" para "Falta"** funcionará
- ✅ **Substituto preservado** durante mudança de tipo
- ✅ **Logs detalhados** para debug
- ✅ **Busca completa** em todas as tabelas

## 🧪 Como Testar

### **1. Teste de Mudança de Tipo**
1. Crie uma solicitação de "Atraso"
2. Edite e mude o tipo para "Falta"
3. Salve a edição
4. **Verificar no console**:
   - `🔍 Solicitação encontrada na tabela: lateness`
   - `🔄 Processando solicitação de tabela específica...`
   - `✅ Mudando para absence - removendo da tabela específica...`

### **2. Teste de Preservação de Substituto**
1. Crie uma solicitação de "Atraso" com substituto
2. Mude o tipo para "Falta"
3. **Verificar**: Substituto deve ser preservado

### **3. Teste de Atualização sem Mudança**
1. Edite uma solicitação de "Atraso" sem mudar o tipo
2. **Verificar no console**:
   - `📝 Tipo não mudou, apenas atualizando dados na tabela específica...`

## 📁 Arquivos Modificados

- **`src/integrations/supabase/client.ts`** - Função `updateRequest` corrigida
- **`CORRECAO-BUSCA-SOLICITACOES-TABELAS-ESPECIFICAS.md`** - Este arquivo de documentação

## 🚀 Status

✅ **CORREÇÃO IMPLEMENTADA** - Pronta para teste

---

**Nota**: Esta correção resolve o problema de busca de solicitações em tabelas específicas. Agora a função `updateRequest` busca em todas as tabelas possíveis e trata corretamente as mudanças de tipo entre diferentes tabelas.
