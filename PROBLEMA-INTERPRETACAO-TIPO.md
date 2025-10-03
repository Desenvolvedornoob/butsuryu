# 🤔 Problema: Interpretação de Tipo

## 🚨 **PROBLEMA IDENTIFICADO**

### **❌ Análise dos Logs:**
```
🔍 DEBUG: Tipo atual na tabela requests: time-off
🔍 DEBUG: Tipo solicitado (original): absence
🔍 DEBUG: Tipo esperado na tabela requests: time-off
🔍 DEBUG: Precisa mudar tipo? false
🔍 DEBUG: Tipo já está correto na tabela requests, apenas atualizando time_off
```

## 🔍 **PROBLEMA DE INTERPRETAÇÃO**

### **Situação Atual:**
1. **Tabela `requests`**: `type: 'time-off'` (representa "folga")
2. **Tabela `time_off`**: existe como `absence` (start_date = end_date)
3. **Você seleciona**: `absence` (falta)
4. **Sistema interpreta**: `absence` → `time-off` (para tabela requests)
5. **Comparação**: `'time-off'` === `'time-off'` → **não muda!**

### **🤔 PERGUNTA CRÍTICA:**

**O que você realmente quer fazer?**

#### **Cenário A: Mudar de "Folga" para "Falta"**
- **Atual**: Request marcada como "folga" (`time-off`) na tabela `requests`
- **Desejado**: Mudar para "falta" (`absence`)
- **Problema**: Sistema detecta que já é `absence` na tabela `time_off`
- **Resultado**: Não faz mudança

#### **Cenário B: Mudar de "Falta" para "Folga"**
- **Atual**: Request marcada como "falta" (`absence`) na tabela `time_off`
- **Desejado**: Mudar para "folga" (`time-off`)
- **Problema**: Sistema não detecta essa mudança
- **Resultado**: Não faz mudança

#### **Cenário C: Apenas Atualizar Dados**
- **Atual**: Request já está no tipo correto
- **Desejado**: Apenas atualizar outros campos (substituto, motivo, etc.)
- **Problema**: Sistema não atualiza o tipo
- **Resultado**: Funciona parcialmente

## 🔧 **POSSÍVEIS SOLUÇÕES**

### **Solução 1: Forçar Mudança de Tipo**
```typescript
// Sempre atualizar o tipo na tabela requests quando solicitado
if (type === 'absence' && currentRequestType !== 'time-off') {
  // Forçar mudança para time-off
}
```

### **Solução 2: Detectar Mudança Real**
```typescript
// Verificar se há mudança real baseada no contexto
const isRealChange = (currentRequestType === 'time-off' && type === 'absence') ||
                    (currentRequestType === 'early-departure' && type === 'absence') ||
                    (currentRequestType === 'lateness' && type === 'absence');
```

### **Solução 3: Interface Mais Clara**
- Mostrar o tipo atual na interface
- Permitir mudança explícita
- Confirmar a mudança

## 🧪 **PRÓXIMOS PASSOS**

### **1. Esclarecimento Necessário:**
- **Qual é o tipo atual** que aparece na interface?
- **Qual tipo você seleciona** na edição?
- **O que você espera** que aconteça?

### **2. Teste com Logs Adicionais:**
- Execute novamente e verifique os novos logs
- Identifique o cenário exato
- Confirme o comportamento esperado

## 🚀 **STATUS**

🤔 **AGUARDANDO ESCLARECIMENTO** - Necessário entender o cenário exato

---

**Nota**: O problema parece ser de interpretação do que o usuário quer fazer. É necessário esclarecer se o usuário quer mudar de "folga" para "falta" ou se há outro cenário em mente.
