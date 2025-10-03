# 📝 Instruções para Editar Textos dos Cards do Dashboard

## ✅ **Sistema Configurado com Sucesso!**

Os textos dos cards do dashboard agora estão disponíveis para edição através da interface administrativa do sistema.

## 🎯 **Como Editar os Textos:**

### **1. Acesse a Interface de Edição:**
- Vá para **Configurações** no menu lateral
- Clique na aba **"Editor de Textos"**
- Selecione o idioma desejado (Português ou Japonês)

### **2. Localize os Cards do Dashboard:**
- Expanda a categoria **"dashboard"**
- Expanda a subcategoria **"cards"**
- Você verá todos os 9 cards disponíveis para edição

### **3. Cards Disponíveis para Edição:**
- **approval** - Aprovação de Solicitações
- **employees** - Gestão de Funcionários  
- **factories** - Fábricas
- **groups** - Grupos
- **absence** - Registro de Faltas
- **data** - Dados e Relatórios
- **monitoring** - Monitoramento
- **dismissals** - Desligamentos
- **myData** - Meus Dados

### **4. Para Cada Card, Você Pode Editar:**
- **title** - Título do card
- **description** - Descrição do card
- **button** - Texto do botão

## 🔧 **Scripts SQL Criados:**

### **Para Adicionar Textos no Banco:**
```sql
-- Execute este script no Supabase
add-dashboard-cards-editable-texts.sql
```

### **Para Verificar se os Textos Estão no Banco:**
```sql
-- Execute para verificar
check-dashboard-texts.sql
```

## 🌐 **Idiomas Suportados:**
- **Português (pt-BR)** - Textos originais
- **Japonês (jp)** - Textos para tradução

## 💡 **Dicas:**
1. **Salve as alterações** após editar cada texto
2. **Teste no dashboard** para ver as mudanças em tempo real
3. **Use fallbacks** - se um texto não carregar, o sistema mostra o texto em português
4. **Edite diretamente** na interface - não precisa mexer no código

## 🎌 **Exemplo de Tradução para Japonês:**
```
Português: "Aprovação de Solicitações"
Japonês: "申請承認"

Português: "Aprove ou rejeite solicitações de folga"  
Japonês: "休暇申請の承認・却下を行います"
```

## ✅ **Próximos Passos:**
1. Execute o script SQL no Supabase
2. Acesse a interface de edição
3. Traduza os textos para japonês
4. Teste no dashboard

**Agora você pode editar todos os textos dos cards diretamente pela interface!** 🎉
