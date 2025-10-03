import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { checkAndFixRLS } from '@/utils/supabase-fix';

/**
 * Componente invisível que verifica e tenta corrigir problemas de RLS
 * Pode ser incluído em páginas que precisam manipular dados com RLS
 */
export const RLSChecker = () => {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const verifyAndFix = async () => {
      if (checking) return;
      
      setChecking(true);
      try {
        const result = await checkAndFixRLS();
        
        if (result.success) {
          // Verificação bem-sucedida, não precisamos mostrar nada
        } else {
          // Se a verificação não teve sucesso mas também não lançou erro
          console.warn('Verificação de RLS concluída com avisos');
        }
      } catch (error) {
        console.error('Erro ao verificar RLS:', error);
        toast('Atenção', {
          description: 'Algumas funcionalidades podem estar limitadas devido a restrições de acesso'
        });
      } finally {
        setChecking(false);
      }
    };

    verifyAndFix();
  }, []);

  // Este componente não renderiza nada visível
  return null;
}; 