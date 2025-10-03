# 🔐 Correção: Problema na Mudança de Senha

## 🐛 **Problema Identificado**

Funcionários não conseguiam alterar suas próprias senhas na página de Perfil, mesmo digitando a senha atual correta. O erro era: **"Senha atual incorreta"**.

## 🔍 **Causa do Problema**

O sistema usa **múltiplos formatos de telefone** para login (para compatibilidade), mas a página de perfil estava testando apenas **um formato**:

### **Como o Login Funciona:**
- Tenta vários formatos: `+819012345678`, `819012345678`, `9012345678`, `09012345678`
- Se o usuário fez login com `09012345678`, mas o banco salvou como `+819012345678`
- A verificação de senha falhava porque testava apenas o formato salvo no banco

## ✅ **Solução Implementada**

### **Múltiplos Formatos na Verificação:**
Agora a página de perfil usa a **mesma lógica do login**:

```typescript
// Obter todos os formatos possíveis para o telefone do usuário
const phoneFormats = getPhoneFormatsForLogin(user?.phone || '');

// Tentar cada formato até encontrar um que funcione
for (const phoneFormat of phoneFormats) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    phone: phoneFormat,
    password: currentPassword
  });
  
  if (!signInError && signInData.user) {
    // Sucesso! Credenciais válidas
    signInSuccess = true;
    break;
  }
}
```

### **Logs Detalhados:**
Adicionados logs extensivos para debug:
- `📱 Formatos de telefone para testar: [...]`
- `🔄 Testando formato: +819012345678`
- `✅ Credenciais verificadas com formato: 09012345678`

## 🧪 **Como Testar**

### **Passo 1: Abrir Console**
1. Faça login como funcionário
2. Vá para **Perfil** (`/profile`)
3. Abra o **Console** (F12)

### **Passo 2: Tentar Alterar Senha**
1. Preencha:
   - **Senha Atual:** Sua senha real
   - **Nova Senha:** Uma senha nova (min. 6 caracteres)
   - **Confirmar:** Repita a nova senha
2. Clique em **"Alterar Senha"**

### **Passo 3: Verificar Logs**
Deve aparecer no console:
```
🔒 Alterando senha do usuário...
📱 Telefone do usuário: +819012345678
📱 Formatos de telefone para testar: ["+819012345678", "819012345678", "9012345678", "09012345678"]
🔄 Testando formato: +819012345678
✅ Credenciais verificadas com formato: +819012345678
🔄 Atualizando para nova senha...
✅ Senha alterada com sucesso!
```

### **Passo 4: Confirmar Mudança**
1. Faça **logout**
2. Tente fazer **login** com a **nova senha**
3. Deve funcionar normalmente

## 📋 **Arquivos Modificados**

### `src/pages/Profile.tsx`
- **Import adicionado:** `getPhoneFormatsForLogin`
- **Lógica alterada:** Testa múltiplos formatos de telefone
- **Logs melhorados:** Debug detalhado do processo

## 🛡️ **Segurança Mantida**

- ✅ Ainda valida a senha atual
- ✅ Usa a mesma lógica segura do login
- ✅ Não bypassa nenhuma validação
- ✅ Logs detalhados para auditoria

## 🎯 **Resultado**

Agora funcionários conseguem alterar suas senhas normalmente, independentemente do formato em que o telefone está salvo no banco de dados!