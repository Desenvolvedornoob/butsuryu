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
  Plus,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TextItem {
  key: string;
  value: string;
  path: string;
  category: string;
}

interface SiteTextEditorProps {
  onTextsChange?: (texts: Record<string, any>) => void;
  className?: string;
}

const SiteTextEditor: React.FC<SiteTextEditorProps> = ({ 
  onTextsChange,
  className = '' 
}) => {
  const [originalTexts, setOriginalTexts] = useState<Record<string, any>>({});
  const [editedTexts, setEditedTexts] = useState<Record<string, any>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
        settings: "Configurações"
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
        settings: "設定"
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
      }
    }
  };

  // Carregar textos salvos ou usar padrões
  useEffect(() => {
    const savedTexts = localStorage.getItem('siteTexts');
    if (savedTexts) {
      try {
        const parsed = JSON.parse(savedTexts);
        setOriginalTexts(parsed);
        setEditedTexts(parsed);
      } catch (error) {
        console.error('Erro ao carregar textos salvos:', error);
        loadDefaultTexts();
      }
    } else {
      loadDefaultTexts();
    }
  }, []);

  const loadDefaultTexts = () => {
    setOriginalTexts(defaultTexts);
    setEditedTexts(defaultTexts);
  };

  // Converter objeto aninhado em array de itens
  const flattenTexts = (obj: any, prefix = '', category = ''): TextItem[] => {
    const items: TextItem[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        items.push(...flattenTexts(value, fullKey, key));
      } else {
        items.push({
          key: fullKey,
          value: value as string,
          path: fullKey,
          category: category || 'common'
        });
      }
    }
    
    return items;
  };

  // Função para fazer deep clone de objetos
  const deepClone = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  };

  // Atualizar texto editado
  const updateText = (path: string, newValue: string) => {
    setEditedTexts(prev => {
      // Fazer deep clone para evitar mutação
      const newTexts = deepClone(prev);
      const pathParts = path.split('.');
      
      // Navegar até o objeto correto
      let current = newTexts;
      
      // Primeiro, navegar até o idioma
      if (!current[selectedLanguage]) {
        current[selectedLanguage] = {};
      }
      current = current[selectedLanguage];
      
      // Navegar através do caminho aninhado
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Atualizar o valor final
      current[pathParts[pathParts.length - 1]] = newValue;
      
      // Debug: verificar se a atualização funcionou
      console.log('Atualizando texto:', {
        path,
        newValue,
        finalValue: current[pathParts[pathParts.length - 1]]
      });
      
      return newTexts;
    });
    
    setHasChanges(true);
  };

  // Salvar mudanças
  const saveChanges = () => {
    localStorage.setItem('siteTexts', JSON.stringify(editedTexts));
    setOriginalTexts(editedTexts);
    setHasChanges(false);
    toast.success('Textos salvos com sucesso!');
    
    if (onTextsChange) {
      onTextsChange(editedTexts);
    }
  };

  // Reverter mudanças
  const revertChanges = () => {
    setEditedTexts(originalTexts);
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

  // Obter textos filtrados
  const getFilteredTexts = () => {
    const currentTexts = editedTexts[selectedLanguage] || {};
    const flattened = flattenTexts(currentTexts);
    
    if (!searchTerm) return flattened;
    
    return flattened.filter(item => 
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Agrupar textos por categoria
  const getGroupedTexts = () => {
    const filtered = getFilteredTexts();
    const grouped: Record<string, TextItem[]> = {};
    
    filtered.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    
    return grouped;
  };

  const groupedTexts = getGroupedTexts();

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
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Editar' : 'Visualizar'}
            </Button>
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

        {/* Área de edição/visualização */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <h3 className="font-medium">Editor de Textos</h3>
            </div>
            
            <ScrollArea className="h-[600px] border rounded-lg p-4">
              <div className="space-y-4">
                {Object.entries(groupedTexts).map(([category, items]) => (
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
                            <div key={item.key} className="space-y-1">
                              <Label className="text-xs text-gray-500 font-mono">
                                {item.key}
                              </Label>
                              <Input
                                value={item.value || ''}
                                onChange={(e) => updateText(item.key, e.target.value)}
                                className="text-sm"
                                placeholder="Digite o texto..."
                                onFocus={(e) => e.target.select()}
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

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <h3 className="font-medium">Preview</h3>
            </div>
            
            <ScrollArea className="h-[600px] border rounded-lg p-4 bg-gray-50">
              <div className="space-y-4">
                {Object.entries(groupedTexts).slice(0, 3).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-gray-700 capitalize">
                      {category}
                    </h4>
                    <div className="grid gap-2">
                      {items.slice(0, 5).map((item) => (
                        <div key={item.key} className="text-sm p-2 bg-white rounded border">
                          <span className="font-mono text-xs text-gray-500">
                            {item.key}:
                          </span>
                          <span className="ml-2">{item.value}</span>
                        </div>
                      ))}
                      {items.length > 5 && (
                        <div className="text-xs text-gray-500 italic">
                          ... e mais {items.length - 5} itens
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Informações */}
        <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t">
          <div>
            Total de textos: {getFilteredTexts().length}
          </div>
          <div>
            Idioma: {selectedLanguage === 'pt-BR' ? 'Português' : '日本語'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteTextEditor;
