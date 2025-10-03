import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, Palette, Layout, Save, Database, CheckCircle, XCircle } from 'lucide-react';
import SimpleTextEditor from '@/components/SimpleTextEditor';
import DatabaseSetupNotice from '@/components/DatabaseSetupNotice';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { siteTextsService } from '@/services/siteTextsService';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { supabase } from '@/lib/supabase';

const SiteSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('texts');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDatabaseNotice, setShowDatabaseNotice] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Usar o hook useCustomTexts para gerenciar os textos
  const { updateTexts, reloadTexts } = useCustomTexts();

  // Função para recarregar textos quando necessário
  const handleReloadTexts = () => {
    reloadTexts();
  };

  const handleTextsChange = async (texts: Record<string, any>) => {
    
    setHasUnsavedChanges(true);
    
    // Atualizar o hook useCustomTexts com os novos textos
    try {
      const success = await updateTexts(texts);
      
      if (success) {
        setHasUnsavedChanges(false);
        // Recarregar a partir do banco para garantir persistência
        await reloadTexts();
      }
    } catch (error) {
      console.error('❌ SiteSettings: Erro ao atualizar textos no hook useCustomTexts:', error);
    }
  };

  const testDatabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Teste 1: Verificar se consegue buscar dados
      console.log('🔍 Teste 1: Buscando dados existentes...');
      const texts = await siteTextsService.getTextsByLanguage('pt-BR');
      console.log('📊 Dados encontrados:', texts);
      
      // Teste 2: Verificar permissões de leitura diretamente
      console.log('🔍 Teste 2: Verificando permissões de leitura...');
      const { data: directData, error: directError } = await supabase
        .from('site_texts')
        .select('*')
        .limit(5);
      
      console.log('📊 Dados diretos:', directData);
      console.log('❌ Erro direto:', directError);
      
      // Teste 3: Verificar usuário atual
      console.log('🔍 Teste 3: Verificando usuário atual...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', user);
      
      if (directError) {
        setTestResult(`❌ ERRO DE PERMISSÃO! ${directError.message}`);
      } else if (directData && directData.length > 0) {
        setTestResult('✅ SUCESSO! Permissões OK, dados encontrados.');
      } else {
        setTestResult('⚠️ Permissões OK, mas nenhum dado encontrado.');
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setTestResult(`❌ ERRO! ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const insertDefaultTexts = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Dados padrão para inserir
      const defaultTexts = {
        'pt-BR': {
          'auth': {
            'title': 'Butsuryu Calendário',
            'subtitle': 'Sistema de Gestão de Funcionários'
          },
          'navbar': {
            'dashboard': 'Meu Dashboard',
            'requests': 'Solicitações',
            'employees': 'Funcionários',
            'factories': 'Fábricas',
            'data': 'Dados',
            'monitoring': 'Monitoramento',
            'myData': 'Meus Dados',
            'profile': 'Perfil',
            'logout': 'Sair'
          },
          'common': {
            'save': 'Salvar',
            'cancel': 'Cancelar',
            'edit': 'Editar',
            'delete': 'Excluir',
            'confirm': 'Confirmar',
            'back': 'Voltar'
          }
        }
      };
      
      console.log('📝 Inserindo textos padrão...', defaultTexts);
      console.log('🔍 Idiomas disponíveis:', Object.keys(defaultTexts));
      console.log('🔍 Chaves do pt-BR:', Object.keys(defaultTexts['pt-BR']));
      setTestResult('⏳ Inserindo textos padrão...');
      
      const success = await siteTextsService.updateTexts(defaultTexts);
      
      if (success) {
        console.log('✅ Textos inseridos com sucesso!');
        setTestResult('✅ Textos padrão inseridos com sucesso! Verificando...');
        
        // Aguardar um pouco e verificar se os dados foram salvos
        setTimeout(async () => {
          try {
            // Verificação direta no Supabase
            console.log('🔍 Verificação direta no Supabase...');
            const { data: directData, error: directError } = await supabase
              .from('site_texts')
              .select('*')
              .eq('language', 'pt-BR')
              .limit(5);
            
            console.log('🔍 Dados diretos encontrados:', directData);
            console.log('🔍 Erro direto:', directError);
            
            const verifyTexts = await siteTextsService.getTextsByLanguage('pt-BR');
            console.log('🔍 Verificação via siteTextsService:', verifyTexts);
            
            if (verifyTexts && verifyTexts['pt-BR'] && verifyTexts['pt-BR']['auth']) {
              setTestResult('✅ SUCESSO! Textos inseridos e verificados. Recarregando página automaticamente...');
              
              // Recarregar a página após 3 segundos
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else if (directData && directData.length > 0) {
              setTestResult('⚠️ Dados encontrados no Supabase mas não via siteTextsService. Problema na consulta.');
            } else {
              setTestResult('⚠️ Textos inseridos mas não encontrados na verificação. Pode ser um problema de cache.');
            }
          } catch (verifyError) {
            console.error('Erro na verificação:', verifyError);
            setTestResult('⚠️ Textos inseridos mas erro na verificação: ' + verifyError);
          }
        }, 2000);
        
        // Recarregar os textos após inserir
        setTimeout(() => {
          reloadTexts();
        }, 1000);
        
      } else {
        setTestResult('❌ Falha ao inserir textos no banco de dados.');
      }
      
    } catch (error) {
      console.error('Erro ao inserir textos padrão:', error);
      setTestResult('❌ Erro ao inserir textos: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  const insertMissingTexts = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Inserir apenas textos faltantes para português (sem sobrescrever existentes)
      await siteTextsService.insertMissingTexts('pt-BR');
      
      // Inserir apenas textos faltantes para japonês (sem sobrescrever existentes)
      await siteTextsService.insertMissingTexts('jp');
      
      setTestResult('✅ Textos faltantes inseridos com sucesso! Recarregando...');
      
      setTimeout(() => {
        reloadTexts();
        setTestResult('✅ Textos atualizados! Apenas textos faltantes foram adicionados, suas alterações foram preservadas.');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao inserir textos faltantes:', error);
      setTestResult('❌ Erro ao inserir textos faltantes: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <AnimatedTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Configurações do Site
                </h1>
                <p className="text-gray-600 mt-1">
                  Personalize textos, aparência e funcionalidades do sistema
                </p>
              </div>
            </div>
            
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 mb-4">
                Você tem alterações não salvas
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="texts" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Textos
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Avançado
              </TabsTrigger>
            </TabsList>

            <TabsContent value="texts" className="space-y-6">
              {showDatabaseNotice && (
                <DatabaseSetupNotice 
                  onDismiss={() => setShowDatabaseNotice(false)} 
                />
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Editor de Textos
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Edite todos os textos do site, incluindo menus, botões, mensagens e títulos.
                    {showDatabaseNotice 
                      ? "As mudanças são salvas localmente até você configurar o banco de dados."
                      : "As mudanças são salvas no banco de dados e ficam visíveis para todos os usuários."
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <SimpleTextEditor onTextsChange={handleTextsChange} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personalização Visual
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Configure cores, fontes e temas do sistema.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Palette className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Personalização Visual
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Em breve você poderá personalizar cores, fontes e temas
                    </p>
                    <Badge variant="outline">Em Desenvolvimento</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Configurações de Layout
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Ajuste o layout, navegação e organização das páginas.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Configurações de Layout
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Em breve você poderá personalizar o layout do sistema
                    </p>
                    <Badge variant="outline">Em Desenvolvimento</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações Avançadas
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Configurações técnicas e opções avançadas do sistema.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Exportar Configurações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Exporte suas configurações personalizadas
                          </p>
                          <Button variant="outline" size="sm" className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Exportar
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Importar Configurações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Importe configurações de outro sistema
                          </p>
                          <Button variant="outline" size="sm" className="w-full">
                            Importar
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Restaurar Padrões</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Restaure todas as configurações para o padrão
                          </p>
                          <Button variant="outline" size="sm" className="w-full">
                            Restaurar
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Testar Banco de Dados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Teste se os dados estão sendo salvos no Supabase
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={testDatabase}
                            disabled={isTesting}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            {isTesting ? 'Testando...' : 'Testar Banco'}
                          </Button>
                          {testResult && (
                            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                              testResult.includes('✅') 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {testResult.includes('✅') ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              {testResult}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Inserir Textos Padrão</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Insere textos padrão no banco de dados para começar a usar o sistema
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={insertDefaultTexts}
                            disabled={isTesting}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            {isTesting ? 'Inserindo...' : 'Inserir Textos Padrão'}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Atualizar Textos Faltantes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Adiciona novos textos que podem estar faltando (como auth.contactAdmin)
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={insertMissingTexts}
                            disabled={isTesting}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            {isTesting ? 'Atualizando...' : 'Atualizar Textos Faltantes'}
                          </Button>
                        </CardContent>
                      </Card>


                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Recarregar Textos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Recarregue os textos do banco de dados
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={handleReloadTexts}
                          >
                            <Database className="h-4 w-4 mr-2" />
                            Recarregar
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Limpar Cache</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4">
                            Limpe o cache do navegador
                          </p>
                          <Button variant="outline" size="sm" className="w-full">
                            Limpar
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Informações do Sistema */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Versão:</span>
                  <span className="ml-2">1.0.0</span>
                </div>
                <div>
                  <span className="font-medium">Última Atualização:</span>
                  <span className="ml-2">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="font-medium">Configurações Salvas:</span>
                  <span className="ml-2">
                    {localStorage.getItem('siteTexts') ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default SiteSettings;
