# Módulo de Dados e Gráficos

## Visão Geral

Este módulo adiciona funcionalidades avançadas de visualização de dados e relatórios ao sistema OTICS Agenda. Foram criadas duas páginas principais:

1. **Dados** (`/data`) - Para administradores e superusuários
2. **Meus Dados** (`/my-data`) - Para funcionários

## Funcionalidades

### Para Administradores e Superusuários

#### Página de Dados (`/data`)
- **Acesso**: Usuários com permissão `canApproveLeaves` (admin e superuser)
- **Funcionalidades**:
  - Visualização completa de todos os dados do sistema
  - Filtros avançados por ano, mês, funcionário, fábrica, tipo e status
  - Múltiplos tipos de gráficos
  - Métricas rápidas no topo da página
  - Exportação de dados (em desenvolvimento)

#### Tipos de Gráficos Disponíveis
1. **Visão Geral**:
   - Gráfico de pizza por tipo de solicitação
   - Gráfico de barras por tipo de solicitação

2. **Evolução Mensal**:
   - Gráfico de linhas mostrando evolução temporal
   - Dados separados por tipo (folgas, saídas, atrasos, faltas)

3. **Por Fábrica**:
   - Gráfico de barras empilhadas por fábrica
   - Divisão por status (aprovado, pendente, rejeitado)

4. **Por Funcionário**:
   - Top 10 funcionários com mais solicitações
   - Gráfico de barras empilhadas por tipo

5. **Por Status**:
   - Gráfico de pizza por status de aprovação
   - Distribuição de aprovações/rejeições

### Para Funcionários

#### Página Meus Dados (`/my-data`)
- **Acesso**: Usuários com permissão `canViewOwnLeaves` (todos os funcionários)
- **Funcionalidades**:
  - Visualização apenas dos próprios dados
  - Filtros simples por ano e mês
  - Gráficos personalizados dos dados pessoais
  - Estatísticas pessoais de aprovação

#### Tipos de Gráficos Pessoais
1. **Visão Geral**:
   - Gráfico de pizza das próprias solicitações por tipo
   - Gráfico de barras das próprias solicitações

2. **Evolução Mensal**:
   - Linha do tempo pessoal de solicitações
   - Evolução dos próprios dados mensalmente

3. **Por Status**:
   - Gráfico de pizza dos próprios status
   - Detalhes dos status com taxa de aprovação pessoal

## Estrutura Técnica

### Arquivos Criados

1. **`src/lib/data-service.ts`**
   - Serviço principal para buscar dados do Supabase
   - Funções de agregação e processamento
   - Filtros avançados
   - Geração de dados para gráficos

2. **`src/pages/Data.tsx`**
   - Página principal de dados para admin/superuser
   - Interface completa com filtros avançados
   - Múltiplas abas de visualização

3. **`src/pages/MyData.tsx`**
   - Página de dados pessoais para funcionários
   - Interface simplificada
   - Foco nos dados do usuário logado

### Modificações em Arquivos Existentes

1. **`src/App.tsx`**
   - Adicionadas rotas `/data` e `/my-data`
   - Configuração de permissões

2. **`src/components/Navbar.tsx`**
   - Adicionados itens de menu "Dados" e "Meus Dados"
   - Configuração de permissões por item

3. **`src/pages/Dashboard.tsx`**
   - Adicionados cards de acesso rápido
   - Botões para navegar às páginas de dados

### Dependências Adicionadas

- **recharts**: Biblioteca para gráficos React
  ```bash
  npm install recharts
  ```

## Tipos de Dados Suportados

### Tipos de Solicitação
- `time-off`: Folgas
- `early-departure`: Saídas antecipadas
- `lateness`: Atrasos
- `absence`: Faltas

### Status de Solicitação
- `approved`: Aprovado
- `pending`: Pendente
- `rejected`: Rejeitado

### Filtros Disponíveis
- **Ano**: Filtrar por ano específico
- **Mês**: Filtrar por mês específico
- **Funcionário**: Filtrar por funcionário específico (admin/superuser)
- **Fábrica**: Filtrar por fábrica específica
- **Tipo**: Filtrar por tipo de solicitação
- **Status**: Filtrar por status de aprovação

## Cores dos Gráficos

- **Azul** (`#3B82F6`): Folgas (time-off)
- **Roxo** (`#8B5CF6`): Saídas antecipadas (early-departure)
- **Amarelo** (`#EAB308`): Atrasos (lateness)
- **Laranja** (`#F97316`): Faltas (absence)
- **Verde** (`#10B981`): Aprovados
- **Vermelho** (`#EF4444`): Rejeitados

## Permissões

### Administradores
- Acesso total a `/data`
- Podem ver dados de todos os funcionários
- Podem filtrar por qualquer critério
- Podem exportar dados

### Superusuários
- Acesso total a `/data`
- Podem ver dados de todos os funcionários
- Podem filtrar por qualquer critério
- Podem exportar dados

### Funcionários
- Acesso apenas a `/my-data`
- Podem ver apenas seus próprios dados
- Filtros limitados a ano e mês
- Podem exportar apenas seus dados pessoais

## Como Usar

### Para Administradores/Superusuários

1. **Acessar Dados Gerais**:
   - Navegar para `/data` ou clicar em "Dados" no menu
   - Usar filtros para refinar a visualização
   - Alternar entre abas para diferentes tipos de gráficos

2. **Aplicar Filtros**:
   - Selecionar ano, mês, funcionário, fábrica, tipo ou status
   - Filtros são aplicados automaticamente
   - Usar "Limpar Filtros" para resetar

3. **Exportar Dados**:
   - Clicar em "Exportar" (funcionalidade em desenvolvimento)

### Para Funcionários

1. **Acessar Dados Pessoais**:
   - Navegar para `/my-data` ou clicar em "Meus Dados" no menu
   - Visualizar apenas dados pessoais

2. **Filtrar por Período**:
   - Selecionar ano e mês desejados
   - Dados são atualizados automaticamente

3. **Visualizar Estatísticas**:
   - Cards no topo mostram resumo pessoal
   - Gráficos mostram evolução pessoal
   - Aba "Por Status" mostra taxa de aprovação pessoal

## Troubleshooting

### Problemas Comuns

1. **Gráficos não carregam**:
   - Verificar se o usuário tem permissões adequadas
   - Verificar se existem dados no período filtrado
   - Verificar conexão com o banco de dados

2. **Filtros não funcionam**:
   - Verificar se os dados existem para os filtros aplicados
   - Limpar filtros e tentar novamente
   - Verificar permissões do usuário

3. **Dados não aparecem**:
   - Verificar políticas RLS no Supabase
   - Verificar se o usuário tem acesso aos dados
   - Verificar se existem registros no banco

### Logs de Debug

O sistema produz logs detalhados no console:
- Início de carregamento de dados
- Aplicação de filtros
- Erros de permissão
- Dados processados

## Próximas Melhorias

1. **Exportação de Dados**:
   - Implementar exportação para Excel/CSV
   - Opções de formatação personalizadas

2. **Gráficos Adicionais**:
   - Gráficos de área
   - Gráficos de dispersão
   - Mapas de calor

3. **Filtros Avançados**:
   - Filtros por intervalo de datas
   - Filtros por departamento
   - Filtros combinados

4. **Alertas e Notificações**:
   - Alertas para tendências anômalas
   - Notificações de picos de solicitações

## Conclusão

O módulo de dados e gráficos fornece uma visão completa e detalhada das informações do sistema, permitindo tanto a análise geral pelos administradores quanto o acompanhamento pessoal pelos funcionários. A implementação utiliza as melhores práticas de segurança com verificação de permissões e políticas RLS adequadas. 