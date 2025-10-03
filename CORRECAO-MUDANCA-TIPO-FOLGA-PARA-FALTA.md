# 🔧 Correção: Mudança de Tipo "Folga" para "Falta"

## 🎯 Problema Identificado
**Erro**: Ao editar uma solicitação de "Folga" (time-off) para "Falta" (absence), o tipo não estava sendo alterado corretamente.

**Sintomas**:
- Logs mostravam: "Atualizando solicitação com dados: {type: 'absence', ...}"
- Tipo permanecia como "Folga" na interface
- Mudança de tipo não persistia no banco de dados

## 🔍 Causa Raiz
O problema estava na função `updateRequest` no arquivo `src/integrations/supabase/client.ts`. 

**Problema específico**:
- A lógica não tratava corretamente a mudança de "time-off" para "absence"
- Quando uma solicitação estava na tabela `requests` como "time-off" e era alterada para "absence", o sistema não sabia como proceder
- "Absence" não existe na tabela `requests` - apenas na tabela `time_off` com `start_date = end_date`

## ✅ Solução Implementada

### **Correção na Mudança para "Absence"**
```typescript
// ANTES: Não havia tratamento específico para mudança para 'absence'

// DEPOIS: Adicionado caso especial para mudança para 'absence'
if (type === 'absence') {
  // Remover da tabela requests
  const { error: deleteError } = await supabase
    .from('requests')
    .delete()
    .eq('id', requestId);
  
  if (deleteError) throw deleteError;
  
  // Atualizar time_off para ser uma absence (start_date = end_date)
  const timeOffUpdateData: any = {
    user_id: data.user_id || existingRequest.user_id,
    start_date: data.start_date || existingRequest.start_date,
    end_date: data.start_date || existingRequest.start_date, // Para absence, start_date = end_date
    reason: data.reason || existingRequest.reason,
    status: data.status || existingRequest.status,
    updated_at: currentTime
  };
  
  // Adicionar substitute_id se fornecido
  if (data.substitute_id !== undefined) {
    timeOffUpdateData.substitute_id = data.substitute_id;
  }
  
  const { error: timeOffError } = await supabase
    .from('time_off')
    .update(timeOffUpdateData)
    .eq('id', requestId);
  
  if (timeOffError) throw timeOffError;
  
  return { success: true, data: { id: requestId, ...updateData } };
}
```

## 🎯 Lógica da Correção

### **Para mudança de "Folga" para "Falta":**
1. **Remover** da tabela `requests` (pois "absence" não existe lá)
2. **Atualizar** na tabela `time_off` com `start_date = end_date`
3. **Incluir** o `substitute_id` se fornecido
4. **Retornar** sucesso

### **Para mudança de "Falta" para "Folga":**
1. **Inserir** na tabela `requests` com tipo "time-off"
2. **Atualizar** na tabela `time_off` com `start_date ≠ end_date`
3. **Incluir** o `substitute_id` se fornecido

## 🎯 Resultado Esperado

Após a correção:
- ✅ **Mudança de "Folga" para "Falta"** funcionará corretamente
- ✅ **Mudança de "Falta" para "Folga"** funcionará corretamente
- ✅ **Campo substituto** será preservado em ambas as mudanças
- ✅ **Dados persistirão** corretamente no banco
- ✅ **Interface refletirá** as mudanças imediatamente

## 🧪 Como Testar

### **1. Teste de Mudança "Folga" → "Falta"**
1. Acesse a página "Solicitações" (Requests)
2. Encontre uma solicitação do tipo "Folga"
3. Clique em "Editar"
4. Mude o tipo para "Falta"
5. Clique em "Salvar Alterações"
6. **Verificar**: O tipo deve mudar para "Falta" na listagem

### **2. Teste de Mudança "Falta" → "Folga"**
1. Encontre uma solicitação do tipo "Falta"
2. Clique em "Editar"
3. Mude o tipo para "Folga"
4. Clique em "Salvar Alterações"
5. **Verificar**: O tipo deve mudar para "Folga" na listagem

### **3. Teste com Substituto**
1. Faça qualquer mudança de tipo
2. Altere também o substituto
3. **Verificar**: Ambos devem ser atualizados

## 📁 Arquivos Modificados

- **`src/integrations/supabase/client.ts`** - Função `updateRequest` corrigida
- **`CORRECAO-MUDANCA-TIPO-FOLGA-PARA-FALTA.md`** - Este arquivo de documentação

## 🚀 Status

✅ **CORREÇÃO IMPLEMENTADA** - Pronta para teste

---

**Nota**: Esta correção resolve especificamente o problema de mudança de tipo entre "Folga" e "Falta". As migrações do banco de dados ainda precisam ser executadas para que o campo `substitute_id` exista nas tabelas.
