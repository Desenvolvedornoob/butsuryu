# Correção do Problema de Edição de Funcionários

## Problema Identificado
Ao editar a ficha de funcionário, as alterações não estão sendo salvas no banco de dados, especialmente os campos de data.

## Causas Possíveis

### 1. Políticas RLS (Row Level Security)
O problema mais provável é que as políticas RLS não permitem a atualização de registros na tabela `profiles`.

### 2. Formato de Data
Os campos de data podem não estar sendo formatados corretamente antes de serem enviados para o banco.

### 3. Permissões de Usuário
O usuário logado pode não ter permissões suficientes para atualizar registros.

## Soluções Implementadas

### 1. Correção do Componente de Data
- ✅ Componente `SimpleDateInput` agora usa `type="date"` em vez de `type="text"`
- ✅ Formatação automática para yyyy-mm-dd
- ✅ Logs detalhados para debug

### 2. Melhorias no Código de Atualização
- ✅ Logs detalhados para identificar problemas
- ✅ Verificação dos dados antes da atualização
- ✅ Confirmação se a atualização foi realizada
- ✅ Tratamento robusto de erros

### 3. Scripts SQL para Correção
- ✅ `check-profiles-table-structure.sql` - Verificar estrutura da tabela
- ✅ `fix-update-permissions.sql` - Corrigir permissões de atualização

## Passos para Resolver

### Passo 1: Executar Scripts SQL
1. Acesse o painel do Supabase
2. Vá para "SQL Editor"
3. Execute primeiro: `check-profiles-table-structure.sql`
4. Execute depois: `fix-update-permissions.sql`

### Passo 2: Verificar Logs
1. Abra o console do navegador (F12)
2. Tente editar um funcionário
3. Verifique os logs para identificar problemas

### Passo 3: Testar Atualização
1. Edite um funcionário
2. Verifique se as datas aparecem no formato yyyy-mm-dd
3. Salve as alterações
4. Verifique se a mensagem de sucesso aparece

## Verificações Importantes

### 1. Políticas RLS
Execute no SQL Editor:
```sql
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE';
```

### 2. Estrutura da Tabela
Execute no SQL Editor:
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 3. Teste de Atualização
Execute no SQL Editor (substitua 'ID_DO_FUNCIONARIO' pelo ID real):
```sql
UPDATE profiles 
SET first_name = first_name 
WHERE id = 'ID_DO_FUNCIONARIO' 
RETURNING *;
```

## Logs para Debug

### No Console do Navegador:
- "Dados do funcionário antes de salvar"
- "Formatando data:"
- "Data formatada:"
- "Dados para atualização:"
- "Resultado da atualização:"

### Se houver erro:
- "Erro ao atualizar funcionário no Supabase:"

## Campos de Data

### Formato Esperado:
- **Data de Nascimento**: yyyy-mm-dd
- **Data de Início na Empresa**: yyyy-mm-dd

### Exemplos:
- 1990-05-15
- 2023-01-01

## Contato para Suporte

Se o problema persistir após seguir todos os passos:
1. Verifique os logs no console do navegador
2. Execute os scripts SQL e verifique os resultados
3. Teste com um funcionário específico
4. Documente os erros encontrados 