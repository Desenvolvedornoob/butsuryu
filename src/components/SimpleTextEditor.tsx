import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Globe, 
  FileText, 
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { siteTextsService } from '@/services/siteTextsService';
import { useCustomTexts } from '@/hooks/useCustomTexts';

interface TextItem {
  key: string;
  value: string;
  category: string;
  id?: string; // ID único para o React
  placeholder?: string;
  original?: string;
}

interface SimpleTextEditorProps {
  onTextsChange?: (texts: Record<string, any>) => void;
  className?: string;
}

const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({ 
  onTextsChange,
  className = '' 
}) => {
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithValue, setShowOnlyWithValue] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const [hasChanges, setHasChanges] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const { customTexts, reloadTexts } = useCustomTexts();


  // Textos padrão do sistema
  const defaultTexts = {
    'pt-BR': {
      common: {
        email: "E-mail",
        password: "Senha",
        login: "Entrar",
        logout: "Sair",
        loading: "Carregando...",
        save: "Salvar",
        cancel: "Cancelar",
        edit: "Editar",
        delete: "Excluir",
        confirm: "Confirmar",
        back: "Voltar",
        next: "Próximo",
        previous: "Anterior",
        search: "Pesquisar",
        filter: "Filtrar",
        all: "Todos",
        select: "Selecionar",
        language: "Idioma",
        portuguese: "Português",
        japanese: "日本語"
      },
      auth: {
        title: "Agenda Otics",
        subtitle: "Sistema de Gestão de Funcionários",
        loginButton: "Entrar",
        invalidCredentials: "E-mail ou senha inválidos",
        loginError: "Erro ao fazer login",
        welcome: "Bem-vindo",
        selectLanguage: "Selecionar Idioma"
      },
      dashboard: {
        title: "Dashboard",
        welcome: "Bem-vindo",
        subtitle: "Acompanhe suas folgas, saídas antecipadas, atrasos e faltas",
        myData: "Meus Dados",
        requests: "Solicitações",
        employees: "Funcionários",
        factories: "Fábricas",
        monitoring: "Monitoramento",
        data: "Dados e Relatórios",
        settings: "Configurações",
        cards: {
          approval: {
            title: "Aprovação de Solicitações",
            description: "Aprove ou rejeite solicitações de folga",
            button: "Gerenciar Aprovações"
          },
          employees: {
            title: "Gestão de Funcionários",
            description: "Gerencie funcionários e suas informações",
            button: "Gerenciar Funcionários"
          },
          factories: {
            title: "Fábricas",
            description: "Gerencie as fábricas e suas configurações",
            button: "Gerenciar Fábricas"
          },
          groups: {
            title: "Grupos",
            description: "Gerencie os grupos de trabalho e turnos",
            button: "Gerenciar Grupos"
          },
          absence: {
            title: "Registro de Faltas",
            description: "Registre faltas dos funcionários",
            button: "Registrar Faltas"
          },
          data: {
            title: "Dados e Relatórios",
            description: "Visualize gráficos e relatórios completos",
            button: "Ver Dados"
          },
          monitoring: {
            title: "Monitoramento",
            description: "Acompanhe eventos de hoje e próximos",
            button: "Ver Monitoramento"
          },
          dismissals: {
            title: "Desligamentos",
            description: "Análise de desligamentos de funcionários",
            button: "Ver Desligamentos"
          },
          myData: {
            title: "Meus Dados",
            description: "Visualize suas estatísticas pessoais",
            button: "Ver Meus Dados"
          }
        }
      },
      home: {
        tagline: "Simplifique a gestão do tempo",
        title: "Gerencie folgas, saídas e atrasos com facilidade",
        subtitle: "A solução elegante para gerenciar a disponibilidade da sua equipe, permitindo que você acompanhe folgas, saídas antecipadas e atrasos em um único lugar.",
        accessDashboard: "Acessar Dashboard",
        viewCalendar: "Ver Calendário",
        getStarted: "Começar agora",
        leavesTitle: "Solicitação de Folgas",
        leavesDescription: "Solicite e acompanhe folgas com poucos cliques, facilitando o planejamento da sua equipe.",
        earlyExitTitle: "Saídas Antecipadas",
        earlyExitDescription: "Registre saídas antecipadas de forma rápida e eficiente, mantendo todos informados.",
        delaysTitle: "Registro de Atrasos",
        delaysDescription: "Documente atrasos de forma transparente, facilitando a comunicação e o acompanhamento.",
        sectionTitle: "Gerencie seu tempo com eficiência",
        sectionSubtitle: "O TimeManager permite que você gerencie folgas, atrasos e saídas antecipadas de forma simples e eficiente.",
        footerCopyright: "OTICS TimeManager. Todos os direitos reservados."
      },
      navbar: {
        dashboard: "Dashboard",
        myData: "Meus Dados",
        requests: "Solicitações",
        employees: "Funcionários",
        factories: "Fábricas",
        monitoring: "Monitoramento",
        data: "Dados",
        profile: "Perfil",
        logout: "Sair"
      },
      monitoring: {
        title: "Monitoramento",
        subtitle: "Acompanhe os acontecimentos de hoje e os próximos eventos",
        todayEvents: "Acontecimentos de Hoje",
        upcomingEvents: "Próximos Eventos",
        employeeStats: "Funcionários - Acontecimentos do Mês",
        distributionChart: "Distribuição de Acontecimentos",
        yearlyTotals: "Totais do Ano",
        selectFactory: "Selecionar fábrica",
        allFactories: "Todas as fábricas",
        timeOff: "Folgas",
        earlyDeparture: "Saídas Antecipadas",
        lateness: "Atrasos",
        absence: "Faltas",
        total: "Total"
      },
      requests: {
        title: "Solicitações",
        newRequest: "Nova Solicitação",
        type: "Tipo",
        reason: "Motivo",
        startDate: "Data de Início",
        endDate: "Data de Fim",
        status: "Status",
        approved: "Aprovado",
        pending: "Pendente",
        rejected: "Rejeitado"
      },
      employees: {
        title: "Funcionários",
        addEmployee: "Adicionar Funcionário",
        name: "Nome",
        email: "E-mail",
        phone: "Telefone",
        factory: "Fábrica",
        group: "Grupo",
        status: "Status",
        active: "Ativo",
        inactive: "Inativo"
      },
      factories: {
        title: "Fábricas",
        addFactory: "Adicionar Fábrica",
        name: "Nome",
        address: "Endereço",
        shifts: "Turnos",
        holidays: "Feriados"
      },
      errors: {
        generic: "Ocorreu um erro inesperado",
        network: "Erro de conexão. Verifique sua internet.",
        unauthorized: "Você não tem permissão para acessar esta página",
        notFound: "Página não encontrada",
        serverError: "Erro interno do servidor",
        validation: "Dados inválidos",
        loginFailed: "Falha no login. Verifique suas credenciais",
        signupFailed: "Falha no cadastro. Tente novamente",
        updateFailed: "Falha ao atualizar dados",
        deleteFailed: "Falha ao excluir item",
        saveFailed: "Falha ao salvar dados",
        loadFailed: "Falha ao carregar dados"
      },
      success: {
        saved: "Dados salvos com sucesso",
        updated: "Dados atualizados com sucesso",
        deleted: "Item excluído com sucesso",
        created: "Item criado com sucesso"
      }
    },
    'jp': {
      common: {
        email: "メールアドレス",
        password: "パスワード",
        login: "ログイン",
        logout: "ログアウト",
        loading: "読み込み中...",
        save: "保存",
        cancel: "キャンセル",
        edit: "編集",
        delete: "削除",
        confirm: "確認",
        back: "戻る",
        next: "次へ",
        previous: "前へ",
        search: "検索",
        filter: "フィルター",
        all: "すべて",
        select: "選択",
        language: "言語",
        portuguese: "Português",
        japanese: "日本語"
      },
      auth: {
        title: "Agenda Otics",
        subtitle: "従業員管理システム",
        loginButton: "ログイン",
        invalidCredentials: "メールアドレスまたはパスワードが無効です",
        loginError: "ログインエラー",
        welcome: "ようこそ",
        selectLanguage: "言語を選択"
      },
      dashboard: {
        title: "ダッシュボード",
        welcome: "ようこそ",
        subtitle: "休暇、早期退社、遅刻、欠勤を追跡",
        myData: "マイデータ",
        requests: "申請",
        employees: "従業員",
        factories: "工場",
        monitoring: "モニタリング",
        data: "データとレポート",
        settings: "設定",
        cards: {
          approval: {
            title: "申請承認",
            description: "休暇申請の承認・却下を行います",
            button: "承認管理"
          },
          employees: {
            title: "従業員管理",
            description: "従業員情報の管理を行います",
            button: "従業員管理"
          },
          factories: {
            title: "工場管理",
            description: "工場とその設定を管理します",
            button: "工場管理"
          },
          groups: {
            title: "グループ管理",
            description: "作業グループとシフトを管理します",
            button: "グループ管理"
          },
          absence: {
            title: "欠勤登録",
            description: "従業員の欠勤を登録します",
            button: "欠勤登録"
          },
          data: {
            title: "データ・レポート",
            description: "グラフとレポートを表示します",
            button: "データ表示"
          },
          monitoring: {
            title: "モニタリング",
            description: "今日と今後のイベントを確認します",
            button: "モニタリング"
          },
          dismissals: {
            title: "退職管理",
            description: "従業員の退職を分析します",
            button: "退職管理"
          },
          myData: {
            title: "マイデータ",
            description: "個人の統計データを表示します",
            button: "マイデータ"
          }
        }
      },
      home: {
        tagline: "時間管理を簡素化",
        title: "休暇、早退、遅刻を簡単に管理",
        subtitle: "チームの可用性を管理するエレガントなソリューション。休暇、早退、遅刻を一箇所で追跡できます。",
        accessDashboard: "ダッシュボードにアクセス",
        viewCalendar: "カレンダーを見る",
        getStarted: "今すぐ始める",
        leavesTitle: "休暇申請",
        leavesDescription: "数クリックで休暇を申請・追跡し、チームの計画を簡単にします。",
        earlyExitTitle: "早退",
        earlyExitDescription: "早退を迅速かつ効率的に記録し、全員に情報を提供します。",
        delaysTitle: "遅刻記録",
        delaysDescription: "遅刻を透明性を持って記録し、コミュニケーションと追跡を容易にします。",
        sectionTitle: "効率的に時間を管理",
        sectionSubtitle: "TimeManagerを使用して、休暇、遅刻、早退をシンプルで効率的に管理できます。",
        footerCopyright: "OTICS TimeManager. 全著作権所有。"
      },
      navbar: {
        dashboard: "ダッシュボード",
        myData: "マイデータ",
        requests: "申請",
        employees: "従業員",
        factories: "工場",
        monitoring: "モニタリング",
        data: "データ",
        profile: "プロフィール",
        logout: "ログアウト"
      },
      monitoring: {
        title: "モニタリング",
        subtitle: "今日の出来事と今後のイベントを追跡",
        todayEvents: "今日の出来事",
        upcomingEvents: "今後のイベント",
        employeeStats: "従業員 - 月間の出来事",
        distributionChart: "出来事の分布",
        yearlyTotals: "年間合計",
        selectFactory: "工場を選択",
        allFactories: "すべての工場",
        timeOff: "休暇",
        earlyDeparture: "早期退社",
        lateness: "遅刻",
        absence: "欠勤",
        total: "合計"
      },
      requests: {
        title: "申請",
        newRequest: "新しい申請",
        type: "タイプ",
        reason: "理由",
        startDate: "開始日",
        endDate: "終了日",
        status: "ステータス",
        approved: "承認済み",
        pending: "保留中",
        rejected: "却下"
      },
      employees: {
        title: "従業員",
        addEmployee: "従業員を追加",
        name: "名前",
        email: "メールアドレス",
        phone: "電話番号",
        factory: "工場",
        group: "グループ",
        status: "ステータス",
        active: "アクティブ",
        inactive: "非アクティブ"
      },
      factories: {
        title: "工場",
        addFactory: "工場を追加",
        name: "名前",
        address: "住所",
        shifts: "シフト",
        holidays: "祝日"
      },
      errors: {
        generic: "予期しないエラーが発生しました",
        network: "接続エラー。インターネット接続を確認してください。",
        unauthorized: "このページにアクセスする権限がありません",
        notFound: "ページが見つかりません",
        serverError: "内部サーバーエラー",
        validation: "無効なデータ",
        loginFailed: "ログインに失敗しました。認証情報を確認してください",
        signupFailed: "登録に失敗しました。もう一度お試しください",
        updateFailed: "データの更新に失敗しました",
        deleteFailed: "アイテムの削除に失敗しました",
        saveFailed: "データの保存に失敗しました",
        loadFailed: "データの読み込みに失敗しました"
      },
      success: {
        saved: "データが正常に保存されました",
        updated: "データが正常に更新されました",
        deleted: "アイテムが正常に削除されました",
        created: "アイテムが正常に作成されました"
      }
    }
  };

  // Estrutura esperada dos cards do dashboard (sem valores padrão)
  const expectedDashboardStructure = {
    cards: {
      approval: { title: '', description: '', button: '' },
      employees: { title: '', description: '', button: '' },
      factories: { title: '', description: '', button: '' },
      groups: { title: '', description: '', button: '' },
      absence: { title: '', description: '', button: '' },
      data: { title: '', description: '', button: '' },
      monitoring: { title: '', description: '', button: '' },
      dismissals: { title: '', description: '', button: '' },
      myData: { title: '', description: '', button: '' }
    }
  } as const;

  // Estrutura esperada da página inicial (home)
  const expectedHomeStructure = {
    tagline: '',
    title: '',
    subtitle: '',
    accessDashboard: '',
    viewCalendar: '',
    getStarted: '',
    leavesTitle: '',
    leavesDescription: '',
    earlyExitTitle: '',
    earlyExitDescription: '',
    delaysTitle: '',
    delaysDescription: '',
    sectionTitle: '',
    sectionSubtitle: '',
    footerCopyright: ''
  } as const;

  // Merge profundo que preserva a estrutura base e usa valores do banco quando existirem
  const deepMerge = (base: any, override: any): any => {
    if (typeof base !== 'object' || base === null) return override ?? base;
    const result: any = Array.isArray(base) ? [] : {};
    const keys = new Set([...(Object.keys(base || {})), ...(Object.keys(override || {}))]);
    keys.forEach((key) => {
      const b = base ? base[key] : undefined;
      const o = override ? override[key] : undefined;
      if (typeof b === 'object' && b !== null && !Array.isArray(b)) {
        result[key] = deepMerge(b, o);
      } else {
        result[key] = o !== undefined ? o : b;
      }
    });
    return result;
  };

  // Função para processar objetos aninhados
  const processNestedObject = (obj: any, prefix: string = '', category: string = ''): TextItem[] => {
    const items: TextItem[] = [];
    
    // Se obj não é um objeto ou é null, retornar array vazio
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return items;
    }
    
    Object.entries(obj).forEach(([key, value]: [string, any]) => {
      // Pular apenas chaves que são números (caracteres individuais) ou undefined
      if (key === 'undefined' || /^\d+$/.test(key)) {
        return;
      }
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Se é um objeto, processar recursivamente
        items.push(...processNestedObject(value, fullKey, category));
      } else {
        // Se é um valor primitivo, adicionar como item
        const finalCategory = category || prefix.split('.')[0] || 'unknown';
        const item = {
          key: fullKey,
          value: String(value),
          category: finalCategory,
          id: `${finalCategory}-${fullKey}`
        };
        items.push(item);
      }
    });
    
    return items;
  };

  // Carregar textos quando o idioma muda
  useEffect(() => {
    
    // NÃO resetar se há mudanças pendentes
    if (hasChanges) {
      return;
    }
    
    const loadTexts = () => {
      const items: TextItem[] = [];

      const langTexts = (customTexts && customTexts[selectedLanguage]) ? customTexts[selectedLanguage] : {};

      // Garantir que os cards do dashboard apareçam mesmo se não existirem ainda no banco
      const dashboardFromDb = langTexts['dashboard'] || {};
      const dashboardMerged = deepMerge(expectedDashboardStructure, dashboardFromDb);
      items.push(...processNestedObject(dashboardMerged, '', 'dashboard'));

      // Garantir que os textos da home apareçam mesmo se não existirem ainda no banco
      const homeFromDb = langTexts['home'] || {};
      const homeMerged = deepMerge(expectedHomeStructure, homeFromDb);
      items.push(...processNestedObject(homeMerged, '', 'home'));

      // Outras categorias existentes no banco
      Object.entries(langTexts).forEach(([category, categoryTexts]: [string, any]) => {
        if (category === 'dashboard' || category === 'home') return; // já tratado acima
        items.push(...processNestedObject(categoryTexts, '', category));
      });

      // Adicionar placeholders sugeridos (apenas dica)
      const withPlaceholders = items.map((item) => {
        const langDefaults = (defaultTexts as any)[selectedLanguage] || {};
        const categoryDefaults = langDefaults[item.category] || {};
        // Navegar na estrutura por chaves aninhadas
        const path = item.key.split('.');
        let current: any = categoryDefaults;
        for (const p of path) {
          if (current && typeof current === 'object' && p in current) {
            current = current[p];
          } else {
            current = undefined;
            break;
          }
        }
        const placeholder = typeof current === 'string' ? current : undefined;
        // Se valor estiver vazio, preencher visualmente com placeholder para facilitar edição
        const original = item.value;
        const value = (item.value && item.value.trim().length > 0) ? item.value : (placeholder || '');
        return {
          ...item,
          value,
          placeholder,
          original
        } as TextItem;
      });

      setTextItems(withPlaceholders);
      setHasChanges(false);

      // Expandir categorias principais na primeira carga
      if (expandedCategories.size === 0) {
        const initial = new Set<string>(['home', 'dashboard']);
        setExpandedCategories(initial);
      }
    };

    loadTexts();
  }, [selectedLanguage, customTexts]);

  // Removido o useEffect que estava causando problemas
  // O carregamento inicial já é feito no primeiro useEffect

  // Atualizar texto individual
  const updateTextItem = (itemId: string, newValue: string) => {
    // Marcar como sendo editado
    setEditingItem(itemId);
    
    setTextItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          return { ...item, value: newValue };
        }
        return item;
      });
      
      return updated;
    });
    setHasChanges(true);
  };

  // Salvar mudanças
  const saveChanges = async () => {
    if (!hasChanges) return;

    try {
      toast.loading('Salvando textos...');
      
      // Converter array de volta para objeto estruturado
      // Formato esperado pelo serviço: { [lang]: { [category]: { ...nestedKeys } } }
      const structuredTexts: Record<string, any> = {
        [selectedLanguage]: {}
      };

      textItems.forEach(item => {
        // Ignorar itens não modificados ou que apenas receberam placeholder visual
        const newTrimmed = (item.value ?? '').trim();
        const originalTrimmed = (item.original ?? '').trim();
        const placeholderTrimmed = (item.placeholder ?? '').trim();
        const onlyPlaceholderFilled = originalTrimmed === '' && newTrimmed === placeholderTrimmed;
        const unchanged = newTrimmed === originalTrimmed || onlyPlaceholderFilled;
        if (unchanged) {
          return;
        }

        // Garantir que a categoria exista
        if (!structuredTexts[selectedLanguage][item.category]) {
          structuredTexts[selectedLanguage][item.category] = {};
        }

        // Processar chaves aninhadas dentro da categoria
        const keys = item.key.split('.');
        let current = structuredTexts[selectedLanguage][item.category];

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }

        current[keys[keys.length - 1]] = item.value;
      });

      // Chamar o callback para que o componente pai gerencie o salvamento (envia para o hook/serviço)
      if (onTextsChange) {
        await onTextsChange(structuredTexts);
        setHasChanges(false);
        toast.dismiss();
        toast.success('Textos salvos com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar textos:', error);
      toast.dismiss();
      toast.error('Erro ao salvar textos');
    }
  };

  // Reverter mudanças
  const revertChanges = () => {
    // Recarregar textos padrão
    const items: TextItem[] = [];
    const currentTexts = defaultTexts[selectedLanguage] || {};

    Object.entries(currentTexts).forEach(([category, categoryTexts]: [string, any]) => {
      Object.entries(categoryTexts).forEach(([key, value]: [string, any]) => {
        items.push({
          key: `${category}.${key}`,
          value: String(value),
          category
        });
      });
    });

    setTextItems(items);
    setHasChanges(false);
    toast.info('Mudanças revertidas');
  };

  // Alternar categoria expandida
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Filtrar textos
  // Filtrar itens baseado na busca (sem recriar os objetos)
  const filteredItems = textItems.filter(item => {
    // Manter item em edição sempre visível
    if (editingItem === item.key) return true;
    if (showOnlyWithValue && (!item.value || item.value.trim() === '')) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const keyMatch = item.key.toLowerCase().includes(searchLower);
    const valueMatch = item.value.toLowerCase().includes(searchLower);
    const placeholderMatch = (item.placeholder || '').toLowerCase().includes(searchLower);
    
    return keyMatch || valueMatch || placeholderMatch;
  });
  

  // Agrupar por categoria
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, TextItem[]>);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Editor de Textos do Site
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="outline" className="text-amber-600">
                    Modificações não salvas
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <Label htmlFor="language">Idioma:</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="jp">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-64">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar textos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={revertChanges}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reverter
            </Button>
            
            <Button
              size="sm"
              onClick={saveChanges}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            <h3 className="font-medium">Editor de Textos</h3>
          </div>
          
          <ScrollArea className="h-[600px] border rounded-lg p-4">
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 w-full p-2 text-left font-medium text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <FileText className="h-4 w-4" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <Badge variant="secondary" className="ml-auto">
                      {items.length}
                    </Badge>
                  </button>
                  
                  <AnimatePresence>
                    {expandedCategories.has(category) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 ml-6"
                      >
                        {items.map((item) => (
                          <div key={item.id || `${item.category}-${item.key}`} className="space-y-1">
                            <Label className="text-xs text-gray-500 font-mono">
                              {item.key}
                            </Label>
                            <Input
                              value={item.value}
                              onChange={(e) => updateTextItem(item.id, e.target.value)}
                              onBlur={() => setEditingItem(null)}
                              className="text-sm"
                              placeholder="Digite o texto..."
                            />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Informações */}
        <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t">
          <div>
            Total de textos: {filteredItems.length}
          </div>
          <div>
            Idioma: {selectedLanguage === 'jp' ? '日本語' : 'Português'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleTextEditor;
