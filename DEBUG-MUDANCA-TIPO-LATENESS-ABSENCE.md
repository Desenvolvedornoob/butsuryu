# 🔍 Debug: Mudança de Tipo de "Atraso" para "Falta"

## 🎯 Problema Reportado
**Erro**: Não está mudando de "Atraso" (lateness) para "Falta" (absence).

## 🔧 Debug Implementado

### **Logs Adicionados:**
1. **Verificação de mudança de tipo**:
   ```typescript
   console.log('🔍 Verificando mudança de tipo:', {
     tipoOriginal: type,
     tipoExistente: existingRequest.type,
     mudou: type !== existingRequest.type
   });
   ```

2. **Processamento de mudança**:
   ```typescript
   console.log('🔄 Processando mudança de tipo para:', type);
   if (type === 'absence') {
     console.log('✅ Mudando para absence - removendo da tabela requests...');
   ```

3. **Atualização sem mudança**:
   ```typescript
   console.log('📝 Tipo não mudou, apenas atualizando dados...');
   ```

## 🧪 Como Testar

### **1. Teste de Mudança de Tipo**
1. Vá para a página Requests
2. Edite uma solicitação de "Atraso"
3. Mude o tipo para "Falta"
4. Salve a edição
5. **Verificar no console**:
   - `🔍 Verificando mudança de tipo:` - deve mostrar `mudou: true`
   - `🔄 Processando mudança de tipo para: absence`
   - `✅ Mudando para absence - removendo da tabela requests...`

### **2. Se Não Funcionar**
**Verificar no console**:
- Se aparece `📝 Tipo não mudou, apenas atualizando dados...` → problema na detecção
- Se não aparece nenhum log → problema na função
- Se aparece erro → problema na execução

## 🔍 Possíveis Causas

### **1. Problema na Detecção de Mudança**
- `type` não está sendo passado corretamente
- `existingRequest.type` não está sendo lido corretamente
- Comparação `type !== existingRequest.type` falhando

### **2. Problema na Lógica de Absence**
- Condição `if (type === 'absence')` não sendo atendida
- Erro na remoção da tabela `requests`
- Erro na atualização da tabela `time_off`

### **3. Problema nos Dados**
- `requestId` incorreto
- Dados de `updateData` incompletos
- Permissões RLS bloqueando operações

## 📋 Próximos Passos

1. **Execute o teste** e verifique os logs no console
2. **Compartilhe os logs** para análise
3. **Identifique** onde o processo está falhando
4. **Aplique correção** específica baseada nos logs

## 🚀 Status

🔍 **DEBUG IMPLEMENTADO** - Aguardando logs do usuário

---

**Nota**: Os logs foram adicionados para identificar exatamente onde o processo de mudança de tipo está falhando. Execute o teste e compartilhe os logs do console.
