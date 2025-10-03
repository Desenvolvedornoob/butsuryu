# Correção do Problema de Exclusão de Funcionários

## Problema Identificado
Quando o usuário clica em "Excluir funcionário" e confirma a ação, a mensagem de sucesso aparece, mas ao atualizar a página, o funcionário ainda está listado.

## Causas Possíveis

### 1. Políticas RLS (Row Level Security)
O problema mais provável é que as políticas RLS não permitem a exclusão de registros na tabela `profiles`.

### 2. Permissões de Autenticação
O usuário logado pode não ter permissões suficientes para excluir registros.

### 3. Erro Silencioso
O erro pode estar ocorrendo silenciosamente sem ser exibido ao usuário.

## Soluções Implementadas

### 1. Melhorias no Código de Exclusão
- ✅ Adicionado logs detalhados para debug
- ✅ Verificação se o funcionário existe antes da exclusão
- ✅ Verificação se a exclusão foi realmente realizada
- ✅ Atualização das listas local e filtrada
- ✅ Recarga da lista após exclusão
- ✅ Tratamento de erros mais robusto

### 2. Script SQL para Correção de Permissões
Execute o arquivo `fix-delete-permissions-clean.sql` no seu banco de dados Supabase para:
- Verificar políticas RLS existentes
- Criar política de exclusão para administradores
- Verificar se RLS está habilitado

### 3. Script Alternativo (se necessário)
Se o problema persistir, use `disable-rls-temporarily.sql` para testar sem RLS (APENAS PARA TESTES!)

## Como Aplicar a Correção

### Passo 1: Executar o Script SQL
1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute o conteúdo do arquivo `fix-delete-permissions-clean.sql` (NÃO execute o README.md!)

### Passo 2: Verificar Logs
1. Abra o console do navegador (F12)
2. Tente excluir um funcionário
3. Verifique os logs para identificar possíveis erros

### Passo 3: Testar a Funcionalidade
1. Tente excluir um funcionário
2. Verifique se a mensagem de sucesso aparece
3. Atualize a página para confirmar que o funcionário foi removido

## Estrutura da Política RLS

A política criada permite que usuários com role 'admin' excluam qualquer perfil:

```sql
CREATE POLICY admin_delete_profiles ON profiles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);
```

## Logs de Debug

O código agora inclui logs detalhados:
- `Iniciando exclusão do funcionário: [ID]`
- `Funcionário encontrado: [Nome]`
- `Resultado da exclusão: [Dados]`
- `Perfil excluído com sucesso`
- `Funcionário removido das listas locais`

## Verificação Manual

Se o problema persistir, execute esta query no SQL Editor do Supabase:

```sql
-- Verificar se o funcionário ainda existe
SELECT * FROM profiles WHERE id = 'ID_DO_FUNCIONARIO';

-- Verificar políticas de exclusão
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'DELETE';
```

## Contato

Se o problema persistir após aplicar estas correções, verifique:
1. Se você está logado como administrador
2. Se as políticas RLS foram aplicadas corretamente
3. Se há erros no console do navegador 