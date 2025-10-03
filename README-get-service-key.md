# 🔑 Como Obter a Chave Service Role Correta

## 🔍 **Status Atual**

O log mostra que a chave `service_role` ainda não está funcionando:
```
[Service Key Test] ❌ Chave service_role INVÁLIDA: ...
🔑 Tentando com cliente admin (service_role)...
❌ Erro de rede/catch com cliente admin: ...
```

## ✅ **Métodos para Obter a Chave Correta**

### **Método 1: Painel Web do Supabase** (Recomendado)

1. **Acesse**: https://supabase.com/dashboard/projects
2. **Login** na sua conta Supabase
3. **Selecione o projeto**: `xuywsfscrzypuppzaiks`
4. **Settings** (ícone de engrenagem) → **API**
5. **Project API keys** → **service_role** → **Reveal**
6. **Copie** a chave completa (geralmente ~200+ caracteres)

### **Método 2: CLI do Supabase** (Alternativo)

```bash
# Instalar CLI do Supabase (se não tiver)
npm install -g supabase

# Login na conta
supabase login

# Listar projetos
supabase projects list

# Obter chaves do projeto (substitua PROJECT_ID)
supabase projects api-keys --project-id xuywsfscrzypuppzaiks
```

### **Método 3: Variáveis de Ambiente** (Produção)

Se você tem as chaves em `.env` ou configuração:
```bash
# Verificar se existe arquivo de env
cat .env
cat .env.local
```

## 🔧 **Como Aplicar a Chave**

1. **Copie** a chave `service_role` (deve começar com `eyJhbGciOiJIUzI1NiIs...`)
2. **Edite** `src/integrations/supabase/client.ts`
3. **Substitua** a linha 9:

```typescript
// ANTES
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eXdzZnNjcnp5cHVwcHphaWtzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgyMDc4MCwiZXhwIjoyMDU4Mzk2NzgwfQ.CMfKHfwTycizD7A2X_YcQrcqEWd9zPzttIbX2-XSCeQ';

// DEPOIS (cole a chave REAL aqui)
const SUPABASE_SERVICE_KEY = 'SUA_CHAVE_SERVICE_ROLE_REAL_AQUI';
```

## 🧪 **Verificação do Sucesso**

Após atualizar a chave, o console mostrará:

### ✅ **Sucesso:**
```
[Service Key Test] ✅ Chave service_role VÁLIDA - usuários encontrados: 6
✅ Sistema administrativo funcionando (na tela)
🔑 Tentando com cliente admin (service_role)...
✅ Senha atualizada com sucesso
```

### ❌ **Ainda com erro:**
```
[Service Key Test] ❌ Chave service_role INVÁLIDA: ...
⚠️ Mudança de senhas indisponível (na tela)
```

## 🔒 **Diferenças Entre as Chaves**

| Chave | Papel | Permissões |
|-------|--------|------------|
| `anon` | Usuários públicos | Limitadas por RLS |
| `service_role` | Administração | **Bypass RLS, acesso total** |

## ⚠️ **Importante**

- A `service_role` key tem **acesso total** ao banco
- **NUNCA** exponha publicamente (só no código do servidor)
- Use apenas para operações administrativas
- Mantenha segura em variáveis de ambiente em produção

## 🎯 **Solução Temporária**

Se não conseguir obter a chave, há um fallback no código que tenta usar o cliente normal, mas com limitações.

**A mudança de senhas só funcionará 100% com a chave `service_role` correta!** 🔑