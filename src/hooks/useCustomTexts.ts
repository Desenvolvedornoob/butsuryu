import { useState, useEffect, useCallback } from 'react';
import { siteTextsService, SiteTextsByLanguage } from '@/services/siteTextsService';

interface CustomTexts {
  [language: string]: {
    [category: string]: {
      [key: string]: string;
    };
  };
}

export const useCustomTexts = () => {
  const [customTexts, setCustomTexts] = useState<CustomTexts | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar textos do Supabase para todos os idiomas
  const loadTextsFromSupabase = useCallback(async (language?: string) => {
    setIsLoading(true);
    try {
      // Carregar textos para português e japonês
      const [ptTexts, jpTexts] = await Promise.all([
        siteTextsService.getTextsByLanguage('pt-BR'),
        siteTextsService.getTextsByLanguage('jp')
      ]);
      
      // Combinar textos de ambos os idiomas
      const allTexts = {
        ...ptTexts,
        ...jpTexts
      };
      
      // Não inserir textos padrão automaticamente. Apenas usar os existentes no banco
      
      if (allTexts && Object.keys(allTexts).length > 0) {
        setCustomTexts(allTexts);
      } else {
        setCustomTexts({});
      }
    } catch (error) {
      console.error('Erro ao carregar textos do Supabase:', error);
      
      // Se a tabela não existe, mostrar erro específico
      if (error instanceof Error && error.message.includes('Tabela site_texts não existe')) {
        console.error('🚨 EXECUTE O SQL PRIMEIRO: create-site-texts-simple.sql');
        setCustomTexts({});
      } else {
        // Outros erros
        setCustomTexts({});
      }
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, []);

  // Ouvir eventos globais para sincronizar textos entre instâncias do hook
  useEffect(() => {
    const handleUpdated = () => {
      // Recarregar do banco quando algum lugar atualizar os textos
      loadTextsFromSupabase();
    };
    window.addEventListener('siteTextsUpdated', handleUpdated as EventListener);
    return () => {
      window.removeEventListener('siteTextsUpdated', handleUpdated as EventListener);
    };
  }, [loadTextsFromSupabase]);

  useEffect(() => {
    // Carregar apenas uma vez na inicialização
    let mounted = true;
    
    const load = async () => {
      if (!mounted || isLoaded) return;
      await loadTextsFromSupabase();
    };
    
    load();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para obter um texto personalizado
  const getText = useCallback((key: string, language: string = 'pt-BR', fallback?: string): string => {
    
    // Se ainda está carregando ou não carregou ainda, retornar fallback
    if (isLoading || !isLoaded) {
      return fallback || key;
    }
    
    // Se customTexts é null ou não tem dados para o idioma
    if (!customTexts || !customTexts[language] || Object.keys(customTexts).length === 0) {
      return fallback || key;
    }

    const keys = key.split('.');
    let current: any = customTexts[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return fallback || key;
      }
    }

    const result = typeof current === 'string' ? current : (fallback || key);
    
    
    return result;
  }, [customTexts, isLoading, isLoaded]);

  // Função para atualizar textos no Supabase
  const updateTexts = useCallback(async (newTexts: CustomTexts) => {
    try {
      const success = await siteTextsService.updateTexts(newTexts);
      
      if (success) {
        // Mesclar profundamente os textos para não perder edições anteriores
        setCustomTexts(prevTexts => {
          const merged = { ...prevTexts };
          
          Object.entries(newTexts).forEach(([lang, categories]) => {
            if (!merged[lang]) {
              merged[lang] = {};
            }
            
            Object.entries(categories).forEach(([category, texts]) => {
              if (!merged[lang][category]) {
                merged[lang][category] = {};
              }
              
              merged[lang][category] = { ...merged[lang][category], ...texts };
            });
          });
          
          return merged;
        });
        // Notificar outras instâncias do hook para recarregarem do banco
        try {
          window.dispatchEvent(new Event('siteTextsUpdated'));
        } catch {}
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar textos:', error);
      
      // Se a tabela não existe, mostrar erro específico
      if (error instanceof Error && error.message.includes('Tabela site_texts não existe')) {
        alert('❌ Tabela site_texts não existe!\n\nExecute o SQL create-site-texts-simple.sql no Supabase primeiro!');
      } else {
        alert(`❌ Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
      
      return false;
    }
  }, [loadTextsFromSupabase]);

  // Função para resetar textos
  const resetTexts = useCallback(async (language: string = 'pt-BR') => {
    try {
      const success = await siteTextsService.resetToDefaults(language);
      if (success) {
        setCustomTexts(null);
        localStorage.removeItem('siteTexts');
        // Recarregar textos padrão
        await loadTextsFromSupabase(language);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao resetar textos:', error);
      return false;
    }
  }, [loadTextsFromSupabase]);

  // Função para recarregar textos
  const reloadTexts = useCallback(async (language?: string) => {
    setCustomTexts(null);
    setIsLoaded(false);
    setIsLoading(true);
    
    // Recarregar do Supabase
    await loadTextsFromSupabase(language);
  }, [loadTextsFromSupabase]);


  return {
    customTexts,
    isLoaded,
    isLoading,
    getText,
    updateTexts,
    resetTexts,
    reloadTexts,
    hasCustomTexts: !!customTexts
  };
};
