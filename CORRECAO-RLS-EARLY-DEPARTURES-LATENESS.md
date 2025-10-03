# 🔧 Correção: Problema RLS nas Tabelas early_departures e lateness

## 🎯 Problema Identificado
**Erro**: Ao tentar editar solicitações de "Saída Antecipada" e "Atraso", ocorre erro 403 (Forbidden).

**Logs observados**:
```
xuywsfscrzypuppzaiks.supabase.co/rest/v1/early_departures:1 Failed to load resource: the server responded with a status of 403 ()
xuywsfscrzypuppzaiks.supabase.co/rest/v1/lateness:1 Failed to load resource: the server responded with a status of 403 ()
```

## 🔍 Causa Raiz
O problema está nas **políticas RLS (Row Level Security)** das tabelas `early_departures` e `lateness`. O usuário admin não tem permissão para acessar essas tabelas.

## ✅ Solução Implementada

### **1. Função de Verificação de Permissões**
Adicionei uma função `checkTablePermissions` que:
- ✅ Verifica permissões de leitura nas tabelas
- ✅ Testa permissões de escrita para admins
- ✅ Identifica problemas de RLS específicos
- ✅ Fornece logs detalhados para debug

### **2. Integração com checkAndFixRLS**
A função agora verifica automaticamente:
- ✅ Tabela `time_off` (já funcionando)
- ✅ Tabela `early_departures` (novo)
- ✅ Tabela `lateness` (novo)

## 🗄️ Solução no Supabase

### **Execute as seguintes políticas RLS no SQL Editor:**

#### **1. Política para early_departures**
```sql
-- Habilitar RLS na tabela early_departures
ALTER TABLE early_departures ENABLE ROW LEVEL SECURITY;

-- Política para admins e superusers
CREATE POLICY "Admins can manage early_departures" ON early_departures
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Política para usuários verem suas próprias solicitações
CREATE POLICY "Users can view own early_departures" ON early_departures
FOR SELECT USING (user_id = auth.uid());

-- Política para usuários criarem suas próprias solicitações
CREATE POLICY "Users can create own early_departures" ON early_departures
FOR INSERT WITH CHECK (user_id = auth.uid());
```

#### **2. Política para lateness**
```sql
-- Habilitar RLS na tabela lateness
ALTER TABLE lateness ENABLE ROW LEVEL SECURITY;

-- Política para admins e superusers
CREATE POLICY "Admins can manage lateness" ON lateness
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superuser')
  )
);

-- Política para usuários verem suas próprias solicitações
CREATE POLICY "Users can view own lateness" ON lateness
FOR SELECT USING (user_id = auth.uid());

-- Política para usuários criarem suas próprias solicitações
CREATE POLICY "Users can create own lateness" ON lateness
FOR INSERT WITH CHECK (user_id = auth.uid());
```

#### **3. Verificar políticas existentes (se necessário)**
```sql
-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('early_departures', 'lateness');

-- Remover políticas conflitantes (se existirem)
DROP POLICY IF EXISTS "old_policy_name" ON early_departures;
DROP POLICY IF EXISTS "old_policy_name" ON lateness;
```

## 🎯 Resultado Esperado

Após executar as políticas RLS:
- ✅ **Admins e superusers** poderão editar todas as solicitações
- ✅ **Usuários comuns** poderão ver e criar suas próprias solicitações
- ✅ **Erro 403** será resolvido
- ✅ **Edição de saída antecipada** funcionará
- ✅ **Edição de atraso** funcionará

## 🧪 Como Testar

### **1. Execute as políticas SQL**
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute as políticas acima

### **2. Teste a edição**
1. Acesse a página "Solicitações" (Requests)
2. Tente editar uma solicitação de "Saída Antecipada"
3. Tente editar uma solicitação de "Atraso"
4. **Verificar**: Não deve mais aparecer erro 403

### **3. Logs esperados**
```
Verificando permissões para early_departures...
Permissões para early_departures estão OK
Verificando permissões para lateness...
Permissões para lateness estão OK
```

## 📁 Arquivos Modificados

- **`src/utils/supabase-fix.ts`** - Função de verificação de permissões adicionada
- **`CORRECAO-RLS-EARLY-DEPARTURES-LATENESS.md`** - Este arquivo de documentação

## 🚀 Status

🔧 **CORREÇÃO IMPLEMENTADA** - Aguardando execução das políticas RLS

---

**Próximo passo**: Execute as políticas SQL no Supabase Dashboard para resolver o erro 403.
