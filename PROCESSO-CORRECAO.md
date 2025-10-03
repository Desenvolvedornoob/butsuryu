# Processo de Correção do Sistema - Otics Agenda

## Status Atual
✅ **Correções de Código Implementadas**
✅ **Scripts SQL Criados**
⏳ **Aguardando Aplicação dos Scripts no Banco**

## Correções Implementadas

### 1. Permissões de Usuário (AuthContext.tsx)
- ✅ Mantidas apenas as 3 roles principais: `admin`, `superuser` e `funcionario`
- ✅ Corrigidas permissões para incluir todos os níveis de acesso:
  - **Admin**: Acesso total ao sistema (gerenciar fábricas, usuários, etc.)
  - **Superuser**: Pode aprovar solicitações e gerenciar sistema
  - **Funcionário**: Pode criar solicitações e ver próprios dados

### 2. Tipos de Usuário (user.ts)
- ✅ Mantidas apenas as 3 roles: `admin`, `superuser` e `funcionario`
- ✅ Mantidas todas as permissões necessárias no interface `UserPermissions`

### 3. Scripts SQL Criados
- ✅ `complete-system-fix.sql` - Script principal com todas as correções
- ✅ `fix-all-rls-policies.sql` - Políticas RLS específicas
- ✅ Scripts de teste e verificação

## Próximos Passos

### 1. Aplicar Scripts SQL no Supabase
Execute os seguintes arquivos no SQL Editor do Supabase **nesta ordem**:

**1º - Script Principal:**
```sql
-- Execute: complete-system-fix.sql
-- O script irá:
-- 1. Corrigir políticas RLS para holidays (apenas admin pode gerenciar)
-- 2. Corrigir políticas RLS para shifts (apenas admin pode gerenciar)  
-- 3. Corrigir políticas RLS para time_off (incluir admin/superuser)
-- 4. Adicionar campos approved_by, rejected_by, reviewed_at se não existirem
-- 5. Habilitar RLS em todas as tabelas necessárias
-- 6. Gerar relatório de status
```

**2º - Script de Foreign Keys:**
```sql
-- Execute: fix-foreign-keys.sql
-- O script irá:
-- 1. Adicionar foreign key entre time_off.user_id e profiles.id
-- 2. Adicionar foreign keys para approved_by e rejected_by
-- 3. Corrigir relacionamentos entre tabelas
-- 4. Verificar todas as foreign keys criadas
```

### 2. Verificar Funcionamento
Após aplicar o script:

1. **Teste como Admin**: Deve conseguir adicionar feriados e turnos
2. **Teste como Superuser**: Deve conseguir ver e aprovar solicitações
3. **Teste como Funcionário**: Deve conseguir criar solicitações

### 3. Criar Usuários de Teste (se necessário)
Se não existirem usuários com as roles necessárias, crie-os:

```sql
-- Exemplo de criação de usuário superuser
UPDATE public.profiles 
SET role = 'superuser' 
WHERE id = 'ID_DO_USUARIO';

-- Exemplo de criação de usuário admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'ID_DO_USUARIO';
```

## Problemas Resolvidos

### ❌ Erro Original
```
new row violates row-level security policy for table "holidays"
HTTP 403 Forbidden
```

### ✅ Solução Aplicada
- Políticas RLS configuradas corretamente
- Apenas admins podem gerenciar feriados e turnos
- Superuser pode aprovar solicitações
- Funcionários podem criar solicitações próprias

## Arquivos Modificados

### Código da Aplicação
- `src/contexts/AuthContext.tsx` - Permissões corrigidas
- `src/types/user.ts` - Tipos de usuário atualizados
- `src/utils/supabase-fix.ts` - Utilitário de correção RLS

### Scripts SQL
- `complete-system-fix.sql` - **1º SCRIPT** - Políticas RLS e campos
- `fix-foreign-keys.sql` - **2º SCRIPT** - Foreign keys entre tabelas
- `fix-all-rls-policies.sql` - Políticas específicas (backup)
- `verify-superuser-setup.sql` - Verificação de configuração
- `test-superuser-permissions.sql` - Teste de permissões
- `final-verification.sql` - Verificação final

## Hierarquia de Permissões Final

| Role | Dashboard | Criar Solicitações | Aprovar Solicitações | Gerenciar Fábricas | Gerenciar Usuários |
|------|-----------|-------------------|---------------------|-------------------|-------------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Superuser** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Funcionário** | ✅ | ✅ | ❌ | ❌ | ❌ |

## Comandos para Testar

### Iniciar o Sistema
```bash
npm run dev
```

### Verificar Logs
Abra o console do navegador para ver logs de permissões:
```
[hasPermission] Verificando permissão X para role Y
[hasPermission] Resultado para role/permissão: true/false
```

---

**Última Atualização**: $(date)
**Status**: Aguardando aplicação do script SQL no banco de dados 