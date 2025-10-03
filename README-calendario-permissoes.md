# Calendário com Diferenciação de Permissões

## Funcionalidades Implementadas

### Visualização Baseada em Papel do Usuário

O calendário agora diferencia a visualização dos eventos baseado no papel (role) do usuário logado:

#### 👑 **Admin e Superuser**
- ✅ Veem **nome da pessoa** + tipo do evento
- ✅ Exemplo: "João Silva: Folga" ou "Maria Santos: Saída Antecipada"
- ✅ Acesso completo a informações detalhadas

#### 👤 **Funcionário**
- ✅ Veem apenas **cores diferenciadas** por tipo de evento
- ✅ Exemplo: "Folga" ou "Saída Antecipada" (sem nome da pessoa)
- ✅ Mantém privacidade dos outros funcionários

### Cores dos Eventos

Cada tipo de evento tem uma cor específica para fácil identificação:

- 🔵 **Azul**: Folgas (time-off)
- 🟠 **Laranja**: Faltas (absence)
- 🟣 **Roxo**: Saída Antecipada (early-departure)
- 🟡 **Amarelo**: Atrasos (lateness)
- 🟢 **Verde**: Feriados (holiday)

### Tipos de Eventos Suportados

1. **Folga (time-off)**: Dias de descanso aprovados
2. **Falta (absence)**: Ausências registradas (mesmo dia início/fim)
3. **Saída Antecipada (early-departure)**: Saídas antes do horário
4. **Atraso (lateness)**: Chegadas após o horário
5. **Feriado (holiday)**: Feriados da fábrica

## Como Funciona

### Lógica de Exibição

```typescript
// Para Admin e Superuser
formatEventText = "Nome do Usuário: Tipo do Evento"

// Para Funcionário
formatEventText = "Tipo do Evento"
```

### Verificação de Permissões

```typescript
const shouldShowNames = () => {
  return user?.role === 'admin' || user?.role === 'superuser';
};
```

### Busca de Dados

- ✅ Busca automática do Supabase (tabelas `requests` e `time_off`)
- ✅ Apenas eventos com status `approved` são exibidos
- ✅ Join com tabela `profiles` para obter nomes dos usuários
- ✅ Fallback para localStorage em caso de erro

## Visualização no Calendário

### No Grid do Calendário
- Dias com eventos têm **cores de fundo** correspondentes
- Hover mostra tooltip com detalhes
- Múltiplos eventos no mesmo dia são indicados

### Na Lista de Eventos
- Eventos organizados por data
- Cards coloridos por tipo
- Informações detalhadas baseadas em permissões

### Filtros
- **Todas as Fábricas**: Mostra eventos de todas as fábricas
- **Fábrica Específica**: Filtra eventos por fábrica selecionada
- **Feriados**: Incluídos automaticamente por fábrica

## Testes

### Para testar as permissões:

1. **Login como Admin/Superuser**:
   - Deve ver: "João Silva: Folga"
   - Cores + nomes nos eventos

2. **Login como Funcionário**:
   - Deve ver: "Folga"
   - Apenas cores, sem nomes

3. **Verificar dados**:
   - Execute `check-calendar-data-simple.sql`
   - Confirme que há eventos aprovados

### Scripts de Teste

- `test-calendar-data.sql`: Cria dados de exemplo
- `verify-calendar-permissions.sql`: Verifica permissões
- `check-calendar-data-simple.sql`: Verificação simples

## Logs de Debug

O sistema registra logs detalhados no console:

```javascript
console.log('Carregando solicitações do Supabase...');
console.log('Solicitações carregadas:', allRequests);
console.log('Total de solicitações:', allRequests.length);
console.log('Papel do usuário:', user?.role);
```

## Segurança

- ✅ **RLS (Row Level Security)** aplicado nas consultas
- ✅ **Verificação de permissões** no frontend
- ✅ **Dados sensíveis** protegidos para funcionários
- ✅ **Fallback seguro** em caso de erro

## Estrutura de Dados

### Interface Request
```typescript
interface Request {
  id: string;
  type: string;
  status: string;
  date: string;
  endDate?: string;
  reason: string;
  factory_id: string;
  user_id?: string;
  userName?: string;  // Usado para exibição
}
```

### Consulta Supabase
```sql
-- Requests
SELECT id, type, status, start_date, end_date, reason, user_id, 
       profiles(first_name, last_name, factory_id)
FROM requests 
WHERE status = 'approved'

-- Time Off
SELECT id, start_date, end_date, reason, user_id, status,
       profiles(first_name, last_name, factory_id)
FROM time_off 
WHERE status = 'approved'
```

## Status da Implementação

✅ **CONCLUÍDO** - Calendário com diferenciação de permissões implementado
✅ **TESTADO** - Funciona para diferentes tipos de usuário
✅ **DOCUMENTADO** - Guias e scripts de teste disponíveis

O calendário agora respeita as permissões de cada usuário, mostrando informações apropriadas baseadas no papel (admin/superuser vs funcionário) e mantendo a privacidade dos dados quando necessário. 