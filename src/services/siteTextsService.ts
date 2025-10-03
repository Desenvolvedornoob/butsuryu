import { supabase, supabaseAdmin } from '@/integrations/supabase/client';

export interface SiteText {
  id: string;
  language: string;
  category: string;
  text_key: string;
  text_value: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SiteTextsByCategory {
  [category: string]: {
    [key: string]: string;
  };
}

export interface SiteTextsByLanguage {
  [language: string]: SiteTextsByCategory;
}

class SiteTextsService {
  // Buscar todos os textos de um idioma
  async getTextsByLanguage(language: string): Promise<SiteTextsByLanguage> {
    try {
      let { data, error } = await supabaseAdmin
        .from('site_texts')
        .select('*')
        .eq('language', language)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao buscar textos do Supabase:', error);
        throw new Error(`Erro ao conectar com o banco de dados: ${error.message}`);
      }

      // Se não há dados, apenas retorne vazio (não inserir textos padrão automaticamente)
      if (!data || data.length === 0) {
        return {};
      }

      // Organizar textos por categoria e processar chaves aninhadas
      const textsByCategory: SiteTextsByCategory = {};
      
      data.forEach(text => {
        if (!textsByCategory[text.category]) {
          textsByCategory[text.category] = {};
        }
        
        // Validar: exigir categoria e chave; permitir valor vazio ("")
        if (!text.category || !text.text_key) {
          console.warn('Texto com dados inválidos ignorado:', text);
          return;
        }
        
        // Processar chaves aninhadas (ex: "cards.approval.title" -> cards.approval.title)
        const keys = text.text_key.split('.');
        let current = textsByCategory[text.category];
        
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }
        
        // Definir o valor final
        current[keys[keys.length - 1]] = text.text_value ?? '';
      });

      const result = {
        [language]: textsByCategory
      };
      return result;
    } catch (error) {
      console.error('Erro ao buscar textos:', error);
      throw error; // Re-throw para que o hook possa tratar
    }
  }

  // Buscar um texto específico
  async getText(language: string, category: string, key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('site_texts')
        .select('text_value')
        .eq('language', language)
        .eq('category', category)
        .eq('text_key', key)
        .single();

      if (error) {
        console.error('Erro ao buscar texto:', error);
        return null;
      }

      return data?.text_value || null;
    } catch (error) {
      console.error('Erro ao buscar texto:', error);
      return null;
    }
  }

  // Atualizar um texto
  async updateText(language: string, category: string, key: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_texts')
        .upsert({
          language,
          category,
          text_key: key,
          text_value: value
        });

      if (error) {
        console.error('Erro ao atualizar texto:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar texto:', error);
      return false;
    }
  }

  // Atualizar múltiplos textos
  // Função para processar objetos aninhados recursivamente
  private processNestedObject(obj: any, prefix: string = '', language: string, category: string): Omit<SiteText, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] {
    const items: Omit<SiteText, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] = [];
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Se é um objeto, processar recursivamente
        items.push(...this.processNestedObject(value, fullKey, language, category));
      } else {
        // Se é um valor primitivo, adicionar como item
        items.push({
          language,
          category,
          text_key: fullKey,
          text_value: String(value)
        });
      }
    });
    
    return items;
  }

  async updateTexts(texts: SiteTextsByLanguage): Promise<boolean> {
    try {
      const textsToUpdate: Omit<SiteText, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] = [];

      Object.entries(texts).forEach(([language, categories]) => {
        Object.entries(categories).forEach(([category, keys]) => {
          textsToUpdate.push(...this.processNestedObject(keys, '', language, category));
        });
      });

      // Verificar se a tabela existe usando cliente admin
      const { error: tableCheckError } = await supabaseAdmin
        .from('site_texts')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Tabela site_texts não existe. Erro:', tableCheckError);
        throw new Error(`Tabela site_texts não existe. Execute o SQL create-site-texts-simple.sql primeiro!`);
      }

      // Tentar inserir/atualizar em lotes maiores para melhorar performance
      const batchSize = 50;
      
      for (let i = 0; i < textsToUpdate.length; i += batchSize) {
        const batch = textsToUpdate.slice(i, i + batchSize);
        
        const { data, error } = await supabaseAdmin
          .from('site_texts')
          .upsert(batch, { 
            onConflict: 'language,category,text_key',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Erro ao atualizar lote ${i / batchSize + 1}:`, error);
          throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar textos:', error);
      throw error; // Re-throw para que o hook possa tratar
    }
  }

  // Deletar um texto
  async deleteText(language: string, category: string, key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_texts')
        .delete()
        .eq('language', language)
        .eq('category', category)
        .eq('text_key', key);

      if (error) {
        console.error('Erro ao deletar texto:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar texto:', error);
      return false;
    }
  }

  // Resetar textos para padrão
  async resetToDefaults(language: string): Promise<boolean> {
    try {
      // Deletar todos os textos personalizados do idioma
      const { error: deleteError } = await supabase
        .from('site_texts')
        .delete()
        .eq('language', language);

      if (deleteError) {
        console.error('Erro ao deletar textos:', deleteError);
        return false;
      }

      // Aqui você poderia inserir os textos padrão novamente
      // ou deixar que o sistema use os textos do arquivo JSON
      return true;
    } catch (error) {
      console.error('Erro ao resetar textos:', error);
      return false;
    }
  }

  // Buscar todos os textos (para backup/exportação)
  async getAllTexts(): Promise<SiteText[]> {
    try {
      const { data, error } = await supabase
        .from('site_texts')
        .select('*')
        .order('language', { ascending: true })
        .order('category', { ascending: true })
        .order('text_key', { ascending: true });

      if (error) {
        console.error('Erro ao buscar todos os textos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar todos os textos:', error);
      return [];
    }
  }

  // Inserir textos padrão automaticamente (método público)
  async insertDefaultTexts(language: string): Promise<void> {
    return this._insertDefaultTexts(language);
  }

          // Método público para inserir textos padrão
          public async insertDefaultTextsPublic(language: string): Promise<void> {
            return this._insertDefaultTexts(language);
          }

          // Método para inserir apenas textos faltantes (sem sobrescrever existentes)
          public async insertMissingTexts(language: string): Promise<void> {
            try {
              // Buscar textos existentes para este idioma
              const existingTexts = await this.getTextsByLanguage(language);
              
              // Obter textos padrão
              const defaultTexts = this._getDefaultTexts(language);
              
              // Filtrar apenas textos que não existem
              const missingTexts = defaultTexts.filter(defaultText => {
                const category = defaultText.category;
                const key = defaultText.text_key;
                
                // Verificar se o texto já existe
                return !existingTexts[language] || 
                       !existingTexts[language][category] || 
                       !existingTexts[language][category][key];
              });

              if (missingTexts.length === 0) {
                console.log(`Nenhum texto faltante encontrado para ${language}`);
                return;
              }

              console.log(`Inserindo ${missingTexts.length} textos faltantes para ${language}`);

              // Inserir apenas os textos faltantes
              const batchSize = 10;
              for (let i = 0; i < missingTexts.length; i += batchSize) {
                const batch = missingTexts.slice(i, i + batchSize);
                
                const { error } = await supabaseAdmin
                  .from('site_texts')
                  .upsert(batch, { 
                    onConflict: 'language,category,text_key',
                    ignoreDuplicates: true // Não sobrescrever existentes
                  });

                if (error) {
                  console.error(`Erro ao inserir lote ${i / batchSize + 1}:`, error);
                  throw error;
                }
              }
            } catch (error) {
              console.error('Erro ao inserir textos faltantes:', error);
              throw error;
            }
          }

          // Método auxiliar para obter textos padrão sem inserir
          private _getDefaultTexts(language: string): any[] {
            let defaultTexts: any[] = [];
            
            if (language === 'pt-BR') {
              defaultTexts = [
                // Auth texts
                { language, category: 'auth', text_key: 'title', text_value: 'Butsuryu Calendário' },
                { language, category: 'auth', text_key: 'subtitle', text_value: 'Sistema de Gestão de Funcionários' },
                { language, category: 'auth', text_key: 'loginButton', text_value: 'Entrar' },
                { language, category: 'auth', text_key: 'invalidCredentials', text_value: 'E-mail ou senha inválidos' },
                { language, category: 'auth', text_key: 'loginError', text_value: 'Erro ao fazer login' },
                { language, category: 'auth', text_key: 'welcome', text_value: 'Bem-vindo' },
                { language, category: 'auth', text_key: 'selectLanguage', text_value: 'Selecionar Idioma' },
                { language, category: 'auth', text_key: 'contactAdmin', text_value: 'Entre em contato com o administrador para obter acesso ao sistema.' },
                
                // Home page texts
                { language, category: 'home', text_key: 'tagline', text_value: 'Simplifique a gestão do tempo' },
                { language, category: 'home', text_key: 'title', text_value: 'Gerencie folgas, saídas e atrasos com facilidade' },
                { language, category: 'home', text_key: 'subtitle', text_value: 'A solução elegante para gerenciar a disponibilidade da sua equipe, permitindo que você acompanhe folgas, saídas antecipadas e atrasos em um único lugar.' },
                { language, category: 'home', text_key: 'accessDashboard', text_value: 'Acessar Dashboard' },
                { language, category: 'home', text_key: 'viewCalendar', text_value: 'Ver Calendário' },
                { language, category: 'home', text_key: 'getStarted', text_value: 'Começar agora' },
                { language, category: 'home', text_key: 'sectionTitle', text_value: 'Gerencie seu tempo com eficiência' },
                { language, category: 'home', text_key: 'sectionSubtitle', text_value: 'O TimeManager permite que você gerencie folgas, atrasos e saídas antecipadas de forma simples e eficiente.' },
                { language, category: 'home', text_key: 'leavesTitle', text_value: 'Solicitação de Folgas' },
                { language, category: 'home', text_key: 'leavesDescription', text_value: 'Solicite e acompanhe folgas com poucos cliques, facilitando o planejamento da sua equipe.' },
                { language, category: 'home', text_key: 'earlyExitTitle', text_value: 'Saídas Antecipadas' },
                { language, category: 'home', text_key: 'earlyExitDescription', text_value: 'Registre saídas antecipadas de forma rápida e eficiente, mantendo todos informados.' },
                { language, category: 'home', text_key: 'delaysTitle', text_value: 'Registro de Atrasos' },
                { language, category: 'home', text_key: 'delaysDescription', text_value: 'Documente atrasos de forma transparente, facilitando a comunicação e o acompanhamento.' },
                { language, category: 'home', text_key: 'footerCopyright', text_value: 'OTICS TimeManager. Todos os direitos reservados.' },
                
                // Dashboard texts
                { language, category: 'dashboard', text_key: 'title', text_value: 'Dashboard' },
                { language, category: 'dashboard', text_key: 'welcome', text_value: 'Bem-vindo' },
                { language, category: 'dashboard', text_key: 'subtitle', text_value: 'Acompanhe suas folgas, saídas antecipadas, atrasos e faltas' },
                { language, category: 'dashboard', text_key: 'myData', text_value: 'Meus Dados' },
                { language, category: 'dashboard', text_key: 'requests', text_value: 'Solicitações' },
                { language, category: 'dashboard', text_key: 'employees', text_value: 'Funcionários' },
                { language, category: 'dashboard', text_key: 'factories', text_value: 'Fábricas' },
                { language, category: 'dashboard', text_key: 'monitoring', text_value: 'Monitoramento' },
                { language, category: 'dashboard', text_key: 'data', text_value: 'Dados e Relatórios' },
                { language, category: 'dashboard', text_key: 'settings', text_value: 'Configurações' },
                { language, category: 'dashboard', text_key: 'filterBy', text_value: 'Filtrar por:' },
                { language, category: 'dashboard', text_key: 'month', text_value: 'Mês' },
                { language, category: 'dashboard', text_key: 'year', text_value: 'Ano' },
                { language, category: 'dashboard', text_key: 'status', text_value: 'Status:' },
                { language, category: 'dashboard', text_key: 'all', text_value: 'Todos' },
                { language, category: 'dashboard', text_key: 'approved', text_value: 'Aprovados' },
                { language, category: 'dashboard', text_key: 'pending', text_value: 'Pendentes' },
                { language, category: 'dashboard', text_key: 'thisMonth', text_value: 'Este mês' },
                { language, category: 'dashboard', text_key: 'thisYear', text_value: 'Este ano' },
                { language, category: 'dashboard', text_key: 'leaves', text_value: 'Folgas' },
                { language, category: 'dashboard', text_key: 'earlyDepartures', text_value: 'Saídas Antecipadas' },
                { language, category: 'dashboard', text_key: 'lateness', text_value: 'Atrasos' },
                { language, category: 'dashboard', text_key: 'absences', text_value: 'Faltas' },
                { language, category: 'dashboard', text_key: 'recentRequests', text_value: 'Solicitações Recentes' },
                { language, category: 'dashboard', text_key: 'upcomingTimeOff', text_value: 'Próximas Folgas' },
                { language, category: 'dashboard', text_key: 'viewAll', text_value: 'Ver todas' },
                { language, category: 'dashboard', text_key: 'viewCalendar', text_value: 'Ver Calendário' },
                { language, category: 'dashboard', text_key: 'reload', text_value: 'Recarregar' },
                { language, category: 'dashboard', text_key: 'adminOptions', text_value: 'Opções de Administração' },
                { language, category: 'dashboard', text_key: 'employeeManagement', text_value: 'Gerenciar Funcionários' },
                { language, category: 'dashboard', text_key: 'factoryManagement', text_value: 'Gerenciar Fábricas' },
                { language, category: 'dashboard', text_key: 'shiftManagement', text_value: 'Gerenciar Turnos' },
                { language, category: 'dashboard', text_key: 'leaveApproval', text_value: 'Aprovar Folgas' },
                { language, category: 'dashboard', text_key: 'monitoring', text_value: 'Ver Monitoramento' },
                { language, category: 'dashboard', text_key: 'dismissals', text_value: 'Demissões' },
                { language, category: 'dashboard', text_key: 'myData', text_value: 'Meus Dados' },
                
                // Navbar texts
                { language, category: 'navbar', text_key: 'dashboard', text_value: 'Meu Dashboard' },
                { language, category: 'navbar', text_key: 'myData', text_value: 'Meus Dados' },
                { language, category: 'navbar', text_key: 'requests', text_value: 'Solicitações' },
                { language, category: 'navbar', text_key: 'employees', text_value: 'Funcionários' },
                { language, category: 'navbar', text_key: 'factories', text_value: 'Fábricas' },
                { language, category: 'navbar', text_key: 'monitoring', text_value: 'Monitoramento' },
                { language, category: 'navbar', text_key: 'data', text_value: 'Dados' },
                { language, category: 'navbar', text_key: 'profile', text_value: 'Perfil' },
                { language, category: 'navbar', text_key: 'logout', text_value: 'Sair' },
                
                // Common texts
                { language, category: 'common', text_key: 'save', text_value: 'Salvar' },
                { language, category: 'common', text_key: 'cancel', text_value: 'Cancelar' },
                { language, category: 'common', text_key: 'edit', text_value: 'Editar' },
                { language, category: 'common', text_key: 'delete', text_value: 'Excluir' },
                { language, category: 'common', text_key: 'confirm', text_value: 'Confirmar' },
                { language, category: 'common', text_key: 'back', text_value: 'Voltar' },
                { language, category: 'common', text_key: 'loading', text_value: 'Carregando...' },
                
                // Calendar texts
                { language, category: 'calendar', text_key: 'title', text_value: 'Calendário' },
                
                // Groups texts
                { language, category: 'groups', text_key: 'title', text_value: 'Grupos' },
                
                // Dismissals texts
                { language, category: 'dismissals', text_key: 'title', text_value: 'Desligamentos' },
                
                // Settings texts
                { language, category: 'settings', text_key: 'title', text_value: 'Configurações' },
                
                // Chart texts
                { language, category: 'charts', text_key: 'timeOff', text_value: 'Folgas' },
                { language, category: 'charts', text_key: 'earlyDeparture', text_value: 'Saídas Antecipadas' },
                { language, category: 'charts', text_key: 'lateness', text_value: 'Atrasos' },
                { language, category: 'charts', text_key: 'absence', text_value: 'Faltas' },
                
                // Status texts
                { language, category: 'status', text_key: 'approved', text_value: 'Aprovado' },
                { language, category: 'status', text_key: 'pending', text_value: 'Pendente' },
                { language, category: 'status', text_key: 'rejected', text_value: 'Rejeitado' },
                
                // Common texts
                { language, category: 'common', text_key: 'select', text_value: 'Selecionar' },
                { language, category: 'common', text_key: 'all', text_value: 'Todos' },
                { language, category: 'common', text_key: 'loading', text_value: 'Carregando...' },
                { language, category: 'common', text_key: 'error', text_value: 'Erro' },
                { language, category: 'common', text_key: 'selectYear', text_value: 'Selecione o ano' },
                { language, category: 'common', text_key: 'selectMonth', text_value: 'Selecione o mês' },
                { language, category: 'common', text_key: 'selectStatus', text_value: 'Selecione um status' },
                { language, category: 'common', text_key: 'selectType', text_value: 'Selecione o tipo' },
                { language, category: 'common', text_key: 'selectEmployee', text_value: 'Selecione o funcionário' },
                { language, category: 'common', text_key: 'selectReason', text_value: 'Selecione o motivo' },
                { language, category: 'common', text_key: 'selectDate', text_value: 'Selecione uma data' },
                { language, category: 'common', text_key: 'allMonths', text_value: 'Todos os meses' },
                { language, category: 'common', text_key: 'allFactories', text_value: 'Todas as fábricas' },
                { language, category: 'common', text_key: 'allDepartments', text_value: 'Todos os departamentos' },
                { language, category: 'common', text_key: 'allReasons', text_value: 'Todos os motivos' },
                { language, category: 'common', text_key: 'allProviders', text_value: 'Todas as prestadoras' }
              ];
            } else if (language === 'jp') {
              defaultTexts = [
                // Auth texts
                { language, category: 'auth', text_key: 'title', text_value: '仏流カレンダー' },
                { language, category: 'auth', text_key: 'subtitle', text_value: '従業員管理システム' },
                { language, category: 'auth', text_key: 'loginButton', text_value: 'ログイン' },
                { language, category: 'auth', text_key: 'invalidCredentials', text_value: 'メールまたはパスワードが無効です' },
                { language, category: 'auth', text_key: 'loginError', text_value: 'ログインエラー' },
                { language, category: 'auth', text_key: 'welcome', text_value: 'ようこそ' },
                { language, category: 'auth', text_key: 'selectLanguage', text_value: '言語を選択' },
                { language, category: 'auth', text_key: 'contactAdmin', text_value: 'システムへのアクセスについては管理者にお問い合わせください。' },
                
                // Home page texts
                { language, category: 'home', text_key: 'tagline', text_value: '時間管理を簡素化' },
                { language, category: 'home', text_key: 'title', text_value: '休暇、早退、遅刻を簡単に管理' },
                { language, category: 'home', text_key: 'subtitle', text_value: 'チームの可用性を管理するエレガントなソリューション。休暇、早退、遅刻を一箇所で追跡できます。' },
                { language, category: 'home', text_key: 'accessDashboard', text_value: 'ダッシュボードにアクセス' },
                { language, category: 'home', text_key: 'viewCalendar', text_value: 'カレンダーを見る' },
                { language, category: 'home', text_key: 'getStarted', text_value: '今すぐ始める' },
                { language, category: 'home', text_key: 'sectionTitle', text_value: '効率的に時間を管理' },
                { language, category: 'home', text_key: 'sectionSubtitle', text_value: 'TimeManagerを使用して、休暇、遅刻、早退をシンプルで効率的に管理できます。' },
                { language, category: 'home', text_key: 'leavesTitle', text_value: '休暇申請' },
                { language, category: 'home', text_key: 'leavesDescription', text_value: '数クリックで休暇を申請・追跡し、チームの計画を簡単にします。' },
                { language, category: 'home', text_key: 'earlyExitTitle', text_value: '早退' },
                { language, category: 'home', text_key: 'earlyExitDescription', text_value: '早退を迅速かつ効率的に記録し、全員に情報を提供します。' },
                { language, category: 'home', text_key: 'delaysTitle', text_value: '遅刻記録' },
                { language, category: 'home', text_key: 'delaysDescription', text_value: '遅刻を透明性を持って記録し、コミュニケーションと追跡を容易にします。' },
                { language, category: 'home', text_key: 'footerCopyright', text_value: 'OTICS TimeManager. 全著作権所有。' },
                
                // Dashboard texts
                { language, category: 'dashboard', text_key: 'title', text_value: 'ダッシュボード' },
                { language, category: 'dashboard', text_key: 'welcome', text_value: 'ようこそ' },
                { language, category: 'dashboard', text_key: 'subtitle', text_value: '休暇、早期退社、遅刻、欠勤を追跡' },
                { language, category: 'dashboard', text_key: 'myData', text_value: 'マイデータ' },
                { language, category: 'dashboard', text_key: 'requests', text_value: '申請' },
                { language, category: 'dashboard', text_key: 'employees', text_value: '従業員' },
                { language, category: 'dashboard', text_key: 'factories', text_value: '工場' },
                { language, category: 'dashboard', text_key: 'monitoring', text_value: 'モニタリング' },
                { language, category: 'dashboard', text_key: 'data', text_value: 'データとレポート' },
                { language, category: 'dashboard', text_key: 'settings', text_value: '設定' },
                { language, category: 'dashboard', text_key: 'filterBy', text_value: 'フィルター:' },
                { language, category: 'dashboard', text_key: 'month', text_value: '月' },
                { language, category: 'dashboard', text_key: 'year', text_value: '年' },
                { language, category: 'dashboard', text_key: 'status', text_value: 'ステータス:' },
                { language, category: 'dashboard', text_key: 'all', text_value: 'すべて' },
                { language, category: 'dashboard', text_key: 'approved', text_value: '承認済み' },
                { language, category: 'dashboard', text_key: 'pending', text_value: '保留中' },
                { language, category: 'dashboard', text_key: 'thisMonth', text_value: '今月' },
                { language, category: 'dashboard', text_key: 'thisYear', text_value: '今年' },
                { language, category: 'dashboard', text_key: 'leaves', text_value: '休暇' },
                { language, category: 'dashboard', text_key: 'earlyDepartures', text_value: '早期退社' },
                { language, category: 'dashboard', text_key: 'lateness', text_value: '遅刻' },
                { language, category: 'dashboard', text_key: 'absences', text_value: '欠勤' },
                { language, category: 'dashboard', text_key: 'recentRequests', text_value: '最近の申請' },
                { language, category: 'dashboard', text_key: 'upcomingTimeOff', text_value: '今後の休暇' },
                { language, category: 'dashboard', text_key: 'viewAll', text_value: 'すべて表示' },
                { language, category: 'dashboard', text_key: 'viewCalendar', text_value: 'カレンダーを見る' },
                { language, category: 'dashboard', text_key: 'reload', text_value: '再読み込み' },
                { language, category: 'dashboard', text_key: 'adminOptions', text_value: '管理オプション' },
                { language, category: 'dashboard', text_key: 'employeeManagement', text_value: '従業員管理' },
                { language, category: 'dashboard', text_key: 'factoryManagement', text_value: '工場管理' },
                { language, category: 'dashboard', text_key: 'shiftManagement', text_value: 'シフト管理' },
                { language, category: 'dashboard', text_key: 'leaveApproval', text_value: '休暇承認' },
                { language, category: 'dashboard', text_key: 'monitoring', text_value: 'モニタリングを見る' },
                { language, category: 'dashboard', text_key: 'dismissals', text_value: '解雇' },
                { language, category: 'dashboard', text_key: 'myData', text_value: 'マイデータ' },
                
                // Navbar texts
                { language, category: 'navbar', text_key: 'dashboard', text_value: 'ダッシュボード' },
                { language, category: 'navbar', text_key: 'myData', text_value: 'マイデータ' },
                { language, category: 'navbar', text_key: 'requests', text_value: 'リクエスト' },
                { language, category: 'navbar', text_key: 'employees', text_value: '従業員' },
                { language, category: 'navbar', text_key: 'factories', text_value: '工場' },
                { language, category: 'navbar', text_key: 'monitoring', text_value: 'モニタリング' },
                { language, category: 'navbar', text_key: 'data', text_value: 'データ' },
                { language, category: 'navbar', text_key: 'profile', text_value: 'プロフィール' },
                { language, category: 'navbar', text_key: 'logout', text_value: 'ログアウト' },
                
                // Common texts
                { language, category: 'common', text_key: 'save', text_value: '保存' },
                { language, category: 'common', text_key: 'cancel', text_value: 'キャンセル' },
                { language, category: 'common', text_key: 'edit', text_value: '編集' },
                { language, category: 'common', text_key: 'delete', text_value: '削除' },
                { language, category: 'common', text_key: 'confirm', text_value: '確認' },
                { language, category: 'common', text_key: 'back', text_value: '戻る' },
                { language, category: 'common', text_key: 'loading', text_value: '読み込み中...' },
                
                // Calendar texts
                { language, category: 'calendar', text_key: 'title', text_value: 'カレンダー' },
                
                // Groups texts
                { language, category: 'groups', text_key: 'title', text_value: 'グループ' },
                
                // Dismissals texts
                { language, category: 'dismissals', text_key: 'title', text_value: '解雇' },
                
                // Settings texts
                { language, category: 'settings', text_key: 'title', text_value: '設定' },
                
                // Chart texts
                { language, category: 'charts', text_key: 'timeOff', text_value: '休暇' },
                { language, category: 'charts', text_key: 'earlyDeparture', text_value: '早期退社' },
                { language, category: 'charts', text_key: 'lateness', text_value: '遅刻' },
                { language, category: 'charts', text_key: 'absence', text_value: '欠勤' },
                
                // Status texts
                { language, category: 'status', text_key: 'approved', text_value: '承認済み' },
                { language, category: 'status', text_key: 'pending', text_value: '保留中' },
                { language, category: 'status', text_key: 'rejected', text_value: '拒否' },
                
                // Common texts
                { language, category: 'common', text_key: 'select', text_value: '選択' },
                { language, category: 'common', text_key: 'all', text_value: 'すべて' },
                { language, category: 'common', text_key: 'loading', text_value: '読み込み中...' },
                { language, category: 'common', text_key: 'error', text_value: 'エラー' },
                { language, category: 'common', text_key: 'selectYear', text_value: '年を選択' },
                { language, category: 'common', text_key: 'selectMonth', text_value: '月を選択' },
                { language, category: 'common', text_key: 'selectStatus', text_value: 'ステータスを選択' },
                { language, category: 'common', text_key: 'selectType', text_value: 'タイプを選択' },
                { language, category: 'common', text_key: 'selectEmployee', text_value: '従業員を選択' },
                { language, category: 'common', text_key: 'selectReason', text_value: '理由を選択' },
                { language, category: 'common', text_key: 'selectDate', text_value: '日付を選択' },
                { language, category: 'common', text_key: 'allMonths', text_value: 'すべての月' },
                { language, category: 'common', text_key: 'allFactories', text_value: 'すべての工場' },
                { language, category: 'common', text_key: 'allDepartments', text_value: 'すべての部門' },
                { language, category: 'common', text_key: 'allReasons', text_value: 'すべての理由' },
                { language, category: 'common', text_key: 'allProviders', text_value: 'すべての提供者' }
              ];
            }

            return defaultTexts;
          }

  // Inserir textos padrão automaticamente (método privado)
  private async _insertDefaultTexts(language: string): Promise<void> {
    try {
      let defaultTexts: any[] = [];
      
      if (language === 'pt-BR') {
        defaultTexts = [
          // Auth texts
          { language, category: 'auth', text_key: 'title', text_value: 'Butsuryu Calendário' },
          { language, category: 'auth', text_key: 'subtitle', text_value: 'Sistema de Gestão de Funcionários' },
          { language, category: 'auth', text_key: 'loginButton', text_value: 'Entrar' },
          { language, category: 'auth', text_key: 'invalidCredentials', text_value: 'E-mail ou senha inválidos' },
          { language, category: 'auth', text_key: 'loginError', text_value: 'Erro ao fazer login' },
          { language, category: 'auth', text_key: 'welcome', text_value: 'Bem-vindo' },
          { language, category: 'auth', text_key: 'selectLanguage', text_value: 'Selecionar Idioma' },
          { language, category: 'auth', text_key: 'contactAdmin', text_value: 'Entre em contato com o administrador para obter acesso ao sistema.' },
          
          // Home page texts
          { language, category: 'home', text_key: 'tagline', text_value: 'Simplifique a gestão do tempo' },
          { language, category: 'home', text_key: 'title', text_value: 'Gerencie folgas, saídas e atrasos com facilidade' },
          { language, category: 'home', text_key: 'subtitle', text_value: 'A solução elegante para gerenciar a disponibilidade da sua equipe, permitindo que você acompanhe folgas, saídas antecipadas e atrasos em um único lugar.' },
          { language, category: 'home', text_key: 'accessDashboard', text_value: 'Acessar Dashboard' },
          { language, category: 'home', text_key: 'viewCalendar', text_value: 'Ver Calendário' },
          { language, category: 'home', text_key: 'getStarted', text_value: 'Começar agora' },
          { language, category: 'home', text_key: 'sectionTitle', text_value: 'Gerencie seu tempo com eficiência' },
          { language, category: 'home', text_key: 'sectionSubtitle', text_value: 'O TimeManager permite que você gerencie folgas, atrasos e saídas antecipadas de forma simples e eficiente.' },
          { language, category: 'home', text_key: 'leavesTitle', text_value: 'Solicitação de Folgas' },
          { language, category: 'home', text_key: 'leavesDescription', text_value: 'Solicite e acompanhe folgas com poucos cliques, facilitando o planejamento da sua equipe.' },
          { language, category: 'home', text_key: 'earlyExitTitle', text_value: 'Saídas Antecipadas' },
          { language, category: 'home', text_key: 'earlyExitDescription', text_value: 'Registre saídas antecipadas de forma rápida e eficiente, mantendo todos informados.' },
          { language, category: 'home', text_key: 'delaysTitle', text_value: 'Registro de Atrasos' },
          { language, category: 'home', text_key: 'delaysDescription', text_value: 'Documente atrasos de forma transparente, facilitando a comunicação e o acompanhamento.' },
          { language, category: 'home', text_key: 'footerCopyright', text_value: 'OTICS TimeManager. Todos os direitos reservados.' },
          
          // Dashboard texts
          { language, category: 'dashboard', text_key: 'title', text_value: 'Dashboard' },
          { language, category: 'dashboard', text_key: 'welcome', text_value: 'Bem-vindo' },
          { language, category: 'dashboard', text_key: 'subtitle', text_value: 'Acompanhe suas folgas, saídas antecipadas, atrasos e faltas' },
          { language, category: 'dashboard', text_key: 'myData', text_value: 'Meus Dados' },
          { language, category: 'dashboard', text_key: 'requests', text_value: 'Solicitações' },
          { language, category: 'dashboard', text_key: 'employees', text_value: 'Funcionários' },
          { language, category: 'dashboard', text_key: 'factories', text_value: 'Fábricas' },
          { language, category: 'dashboard', text_key: 'monitoring', text_value: 'Monitoramento' },
          { language, category: 'dashboard', text_key: 'data', text_value: 'Dados e Relatórios' },
          { language, category: 'dashboard', text_key: 'settings', text_value: 'Configurações' },
          { language, category: 'dashboard', text_key: 'filterBy', text_value: 'Filtrar por:' },
          { language, category: 'dashboard', text_key: 'month', text_value: 'Mês' },
          { language, category: 'dashboard', text_key: 'year', text_value: 'Ano' },
          { language, category: 'dashboard', text_key: 'status', text_value: 'Status:' },
          { language, category: 'dashboard', text_key: 'all', text_value: 'Todos' },
          { language, category: 'dashboard', text_key: 'approved', text_value: 'Aprovados' },
          { language, category: 'dashboard', text_key: 'pending', text_value: 'Pendentes' },
          { language, category: 'dashboard', text_key: 'thisMonth', text_value: 'Este mês' },
          { language, category: 'dashboard', text_key: 'thisYear', text_value: 'Este ano' },
          { language, category: 'dashboard', text_key: 'leaves', text_value: 'Folgas' },
          { language, category: 'dashboard', text_key: 'earlyDepartures', text_value: 'Saídas Antecipadas' },
          { language, category: 'dashboard', text_key: 'lateness', text_value: 'Atrasos' },
          { language, category: 'dashboard', text_key: 'absences', text_value: 'Faltas' },
          { language, category: 'dashboard', text_key: 'recentRequests', text_value: 'Solicitações Recentes' },
          { language, category: 'dashboard', text_key: 'upcomingTimeOff', text_value: 'Próximas Folgas' },
          { language, category: 'dashboard', text_key: 'viewAll', text_value: 'Ver todas' },
          { language, category: 'dashboard', text_key: 'viewCalendar', text_value: 'Ver Calendário' },
          { language, category: 'dashboard', text_key: 'reload', text_value: 'Recarregar' },
          { language, category: 'dashboard', text_key: 'adminOptions', text_value: 'Opções de Administração' },
          { language, category: 'dashboard', text_key: 'employeeManagement', text_value: 'Gerenciar Funcionários' },
          { language, category: 'dashboard', text_key: 'factoryManagement', text_value: 'Gerenciar Fábricas' },
          { language, category: 'dashboard', text_key: 'shiftManagement', text_value: 'Gerenciar Turnos' },
          { language, category: 'dashboard', text_key: 'leaveApproval', text_value: 'Aprovar Folgas' },
          { language, category: 'dashboard', text_key: 'monitoring', text_value: 'Ver Monitoramento' },
          { language, category: 'dashboard', text_key: 'dismissals', text_value: 'Demissões' },
          { language, category: 'dashboard', text_key: 'myData', text_value: 'Meus Dados' },
          
          // Navbar texts
          { language, category: 'navbar', text_key: 'dashboard', text_value: 'Meu Dashboard' },
          { language, category: 'navbar', text_key: 'myData', text_value: 'Meus Dados' },
          { language, category: 'navbar', text_key: 'requests', text_value: 'Solicitações' },
          { language, category: 'navbar', text_key: 'employees', text_value: 'Funcionários' },
          { language, category: 'navbar', text_key: 'factories', text_value: 'Fábricas' },
          { language, category: 'navbar', text_key: 'monitoring', text_value: 'Monitoramento' },
          { language, category: 'navbar', text_key: 'data', text_value: 'Dados' },
          { language, category: 'navbar', text_key: 'profile', text_value: 'Perfil' },
          { language, category: 'navbar', text_key: 'logout', text_value: 'Sair' },
          
          // Common texts
          { language, category: 'common', text_key: 'save', text_value: 'Salvar' },
          { language, category: 'common', text_key: 'cancel', text_value: 'Cancelar' },
          { language, category: 'common', text_key: 'edit', text_value: 'Editar' },
          { language, category: 'common', text_key: 'delete', text_value: 'Excluir' },
          { language, category: 'common', text_key: 'confirm', text_value: 'Confirmar' },
          { language, category: 'common', text_key: 'back', text_value: 'Voltar' },
          { language, category: 'common', text_key: 'loading', text_value: 'Carregando...' }
        ];
      } else if (language === 'jp') {
        defaultTexts = [
          // Auth texts
          { language, category: 'auth', text_key: 'title', text_value: '仏流カレンダー' },
          { language, category: 'auth', text_key: 'subtitle', text_value: '従業員管理システム' },
          { language, category: 'auth', text_key: 'loginButton', text_value: 'ログイン' },
          { language, category: 'auth', text_key: 'invalidCredentials', text_value: 'メールまたはパスワードが無効です' },
          { language, category: 'auth', text_key: 'loginError', text_value: 'ログインエラー' },
          { language, category: 'auth', text_key: 'welcome', text_value: 'ようこそ' },
          { language, category: 'auth', text_key: 'selectLanguage', text_value: '言語を選択' },
          { language, category: 'auth', text_key: 'contactAdmin', text_value: 'システムへのアクセスについては管理者にお問い合わせください。' },
          
          // Home page texts
          { language, category: 'home', text_key: 'tagline', text_value: '時間管理を簡素化' },
          { language, category: 'home', text_key: 'title', text_value: '休暇、早退、遅刻を簡単に管理' },
          { language, category: 'home', text_key: 'subtitle', text_value: 'チームの可用性を管理するエレガントなソリューション。休暇、早退、遅刻を一箇所で追跡できます。' },
          { language, category: 'home', text_key: 'accessDashboard', text_value: 'ダッシュボードにアクセス' },
          { language, category: 'home', text_key: 'viewCalendar', text_value: 'カレンダーを見る' },
          { language, category: 'home', text_key: 'getStarted', text_value: '今すぐ始める' },
          { language, category: 'home', text_key: 'sectionTitle', text_value: '効率的に時間を管理' },
          { language, category: 'home', text_key: 'sectionSubtitle', text_value: 'TimeManagerを使用して、休暇、遅刻、早退をシンプルで効率的に管理できます。' },
          { language, category: 'home', text_key: 'leavesTitle', text_value: '休暇申請' },
          { language, category: 'home', text_key: 'leavesDescription', text_value: '数クリックで休暇を申請・追跡し、チームの計画を簡単にします。' },
          { language, category: 'home', text_key: 'earlyExitTitle', text_value: '早退' },
          { language, category: 'home', text_key: 'earlyExitDescription', text_value: '早退を迅速かつ効率的に記録し、全員に情報を提供します。' },
          { language, category: 'home', text_key: 'delaysTitle', text_value: '遅刻記録' },
          { language, category: 'home', text_key: 'delaysDescription', text_value: '遅刻を透明性を持って記録し、コミュニケーションと追跡を容易にします。' },
          { language, category: 'home', text_key: 'footerCopyright', text_value: 'OTICS TimeManager. 全著作権所有。' },
          
          // Dashboard texts
          { language, category: 'dashboard', text_key: 'title', text_value: 'ダッシュボード' },
          { language, category: 'dashboard', text_key: 'welcome', text_value: 'ようこそ' },
          { language, category: 'dashboard', text_key: 'subtitle', text_value: '休暇、早期退社、遅刻、欠勤を追跡' },
          { language, category: 'dashboard', text_key: 'myData', text_value: 'マイデータ' },
          { language, category: 'dashboard', text_key: 'requests', text_value: '申請' },
          { language, category: 'dashboard', text_key: 'employees', text_value: '従業員' },
          { language, category: 'dashboard', text_key: 'factories', text_value: '工場' },
          { language, category: 'dashboard', text_key: 'monitoring', text_value: 'モニタリング' },
          { language, category: 'dashboard', text_key: 'data', text_value: 'データとレポート' },
          { language, category: 'dashboard', text_key: 'settings', text_value: '設定' },
          { language, category: 'dashboard', text_key: 'filterBy', text_value: 'フィルター:' },
          { language, category: 'dashboard', text_key: 'month', text_value: '月' },
          { language, category: 'dashboard', text_key: 'year', text_value: '年' },
          { language, category: 'dashboard', text_key: 'status', text_value: 'ステータス:' },
          { language, category: 'dashboard', text_key: 'all', text_value: 'すべて' },
          { language, category: 'dashboard', text_key: 'approved', text_value: '承認済み' },
          { language, category: 'dashboard', text_key: 'pending', text_value: '保留中' },
          { language, category: 'dashboard', text_key: 'thisMonth', text_value: '今月' },
          { language, category: 'dashboard', text_key: 'thisYear', text_value: '今年' },
          { language, category: 'dashboard', text_key: 'leaves', text_value: '休暇' },
          { language, category: 'dashboard', text_key: 'earlyDepartures', text_value: '早期退社' },
          { language, category: 'dashboard', text_key: 'lateness', text_value: '遅刻' },
          { language, category: 'dashboard', text_key: 'absences', text_value: '欠勤' },
          { language, category: 'dashboard', text_key: 'recentRequests', text_value: '最近の申請' },
          { language, category: 'dashboard', text_key: 'upcomingTimeOff', text_value: '今後の休暇' },
          { language, category: 'dashboard', text_key: 'viewAll', text_value: 'すべて表示' },
          { language, category: 'dashboard', text_key: 'viewCalendar', text_value: 'カレンダーを見る' },
          { language, category: 'dashboard', text_key: 'reload', text_value: '再読み込み' },
          { language, category: 'dashboard', text_key: 'adminOptions', text_value: '管理オプション' },
          { language, category: 'dashboard', text_key: 'employeeManagement', text_value: '従業員管理' },
          { language, category: 'dashboard', text_key: 'factoryManagement', text_value: '工場管理' },
          { language, category: 'dashboard', text_key: 'shiftManagement', text_value: 'シフト管理' },
          { language, category: 'dashboard', text_key: 'leaveApproval', text_value: '休暇承認' },
          { language, category: 'dashboard', text_key: 'monitoring', text_value: 'モニタリングを見る' },
          { language, category: 'dashboard', text_key: 'dismissals', text_value: '解雇' },
          { language, category: 'dashboard', text_key: 'myData', text_value: 'マイデータ' },
          
          // Navbar texts
          { language, category: 'navbar', text_key: 'dashboard', text_value: 'ダッシュボード' },
          { language, category: 'navbar', text_key: 'myData', text_value: 'マイデータ' },
          { language, category: 'navbar', text_key: 'requests', text_value: 'リクエスト' },
          { language, category: 'navbar', text_key: 'employees', text_value: '従業員' },
          { language, category: 'navbar', text_key: 'factories', text_value: '工場' },
          { language, category: 'navbar', text_key: 'monitoring', text_value: '監視' },
          { language, category: 'navbar', text_key: 'data', text_value: 'データ' },
          { language, category: 'navbar', text_key: 'profile', text_value: 'プロフィール' },
          { language, category: 'navbar', text_key: 'logout', text_value: 'ログアウト' },
          
          // Common texts
          { language, category: 'common', text_key: 'save', text_value: '保存' },
          { language, category: 'common', text_key: 'cancel', text_value: 'キャンセル' },
          { language, category: 'common', text_key: 'edit', text_value: '編集' },
          { language, category: 'common', text_key: 'delete', text_value: '削除' },
          { language, category: 'common', text_key: 'confirm', text_value: '確認' },
          { language, category: 'common', text_key: 'back', text_value: '戻る' },
          { language, category: 'common', text_key: 'loading', text_value: '読み込み中...' }
        ];
      }

      // Inserir em lotes usando o cliente admin
      const batchSize = 10;
      for (let i = 0; i < defaultTexts.length; i += batchSize) {
        const batch = defaultTexts.slice(i, i + batchSize);
        
        const { error } = await supabaseAdmin
          .from('site_texts')
          .upsert(batch, { 
            onConflict: 'language,category,text_key',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Erro ao inserir lote ${i / batchSize + 1}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Erro ao inserir textos padrão:', error);
      throw error;
    }
  }
}

export const siteTextsService = new SiteTextsService();
