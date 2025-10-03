import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

export const useTranslatedToast = () => {
  const { t } = useLanguage();

  const showError = (key: string, customMessage?: string) => {
    const message = customMessage || t(`errors.${key}`);
    toast.error(message);
  };

  const showSuccess = (key: string, customMessage?: string) => {
    const message = customMessage || t(`success.${key}`);
    toast.success(message);
  };

  const showInfo = (message: string) => {
    toast.info(message);
  };

  const showWarning = (message: string) => {
    toast.warning(message);
  };

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning
  };
};
