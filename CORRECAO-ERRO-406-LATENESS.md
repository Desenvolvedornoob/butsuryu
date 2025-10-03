# 🔧 Correção: Erro 406 na Tabela `lateness`

## 🚨 **ERRO IDENTIFICADO**

**Erro 406 (Not Acceptable)** ao tentar buscar `substitute_id` da tabela `lateness`:
```
GET https://xuywsfscrzypuppzaiks.supabase.co/rest/v1/lateness?select=substitute_id&id=eq.e3699386-b264-4fd5-85a4-1ae0622cb58b 406 (Not Acceptable)
```

## 🔍 **CAUSA DO PROBLEMA**

**Localização**: `src/pages/Requests.tsx` linha 718-721

**Problema**: A query estava tentando buscar apenas `substitute_id` da tabela `lateness`:
```typescript
const { data: latenessData, error } = await supabase
  .from('lateness')
  .select('substitute_id')  // ❌ PROBLEMA: select específico
  .eq('id', request.id)
  .single();
```

**Causa**: O erro 406 indica que:
1. A coluna `substitute_id` pode não existir na tabela `lateness`
2. Há problemas de RLS (Row Level Security) com select específico
3. A query específica não é permitida

## 🔧 **CORREÇÃO IMPLEMENTADA**

**Solução**: Alterar o select para buscar todas as colunas (`*`):
```typescript
const { data: latenessData, error } = await supabase
  .from('lateness')
  .select('*')  // ✅ CORREÇÃO: select todas as colunas
  .eq('id', request.id)
  .single();
```

## 🧪 **Como Testar**

### **1. Teste de Edição:**
1. **Vá para a página Requests**
2. **Clique em editar uma solicitação do tipo `lateness`**
3. **Verifique se não há mais erro 406 no console**
4. **Verifique se a tela de edição abre normalmente**

### **2. Teste de Substituto:**
1. **Na tela de edição, verifique se o substituto aparece corretamente**
2. **Tente alterar o substituto**
3. **Salve as alterações**

## 🔍 **Análise da Correção**

### **Problema Original:**
- Query específica `select('substitute_id')` causava erro 406
- RLS ou estrutura da tabela não permitia select específico
- Erro impedia a abertura da tela de edição

### **Solução Implementada:**
- ✅ Alterado para `select('*')` para buscar todas as colunas
- ✅ Mantida a lógica de verificação `latenessData?.substitute_id`
- ✅ Preservada a funcionalidade de edição

## 📋 **Próximos Passos**

1. **Execute o teste** e verifique se o erro 406 foi resolvido
2. **Teste a edição** de solicitações do tipo `lateness`
3. **Verifique se o substituto** aparece corretamente na tela de edição

## 🚀 **Status**

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando teste do usuário

---

**Nota**: A correção foi implementada para resolver o erro 406 ao tentar editar solicitações do tipo `lateness`. A query agora busca todas as colunas em vez de apenas `substitute_id`.
