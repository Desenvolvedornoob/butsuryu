# 🔑 Correção: Chave de Serviço do Supabase

## 🐛 **Problema Atual**

Admin consegue alterar dados de funcionários, mas **não consegue alterar senhas** devido ao erro:
```
Status 401: Failed to load resource
```

## 🔍 **Causa do Problema**

A **chave de serviço** (`SUPABASE_SERVICE_KEY`) no arquivo `src/integrations/supabase/client.ts` está **incorreta ou inválida**.

Para operações administrativas como alterar senhas, é necessário usar a `service_role` key, não a `anon` key.

## ✅ **Como Obter a Chave Correta**

### **1. Acesse o Painel do Supabase**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **xuywsfscrzypuppzaiks**

### **2. Obtenha a Service Role Key**
1. No painel lateral, clique em **Settings** (Configurações)
2. Clique em **API**
3. Role para baixo até encontrar **Project API keys**
4. Copie a chave **`service_role`** (NÃO a `anon` key)

### **3. Atualize o Código**
No arquivo `src/integrations/supabase/client.ts`, linha 9, substitua:

```typescript
// ANTES (chave incorreta)
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eXdzZnNjcnp5cHVwcHphaWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgyMDc4MCwiZXhwIjoyMDU4Mzk2NzgwfQ.p7Y7AKSJfGGWLcXxkU1WTpQA8iN9FGKjQD1P3RbFGHQ';

// DEPOIS (cole a chave correta aqui)
const SUPABASE_SERVICE_KEY = 'SUA_CHAVE_SERVICE_ROLE_AQUI';
```

## 🔒 **Exemplo de Chave Service Role**

A chave `service_role` geralmente:
- É **mais longa** que a `anon` key
- Contém `"role":"service_role"` quando decodificada
- Começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...`

## 🧪 **Teste Após a Correção**

1. **Substitua a chave** no código
2. **Reinicie o servidor** (`npm run dev`)
3. **Login como admin**
4. **Edite funcionário** e tente alterar senha
5. **Verifique o console** - deve mostrar:
   ```
   🔑 Tentando com cliente admin (service_role)...
   ✅ Senha atualizada com sucesso
   ```

## ⚠️ **Importante**

- **NUNCA** compartilhe a `service_role` key publicamente
- Ela tem **acesso total** ao banco de dados
- Use apenas no código do servidor/admin

## 🎯 **Status Atual**

- ✅ **Dados de funcionários**: Salvando corretamente  
- ❌ **Senhas**: Erro 401 - aguardando chave correta
- ✅ **Console**: Logs otimizados e limpos

Após atualizar a chave, a mudança de senhas funcionará perfeitamente! 🎉