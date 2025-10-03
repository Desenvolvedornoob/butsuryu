import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslatedToast } from '@/hooks/use-translated-toast';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function Auth() {
  const { signIn } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { showError, showSuccess } = useTranslatedToast();
  const { getText, isLoading: textsLoading } = useCustomTexts();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Função de login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await signIn({ phone, password });
    } catch (error) {
      console.error("Erro no login:", error);
      showError('loginFailed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter text-gray-900">
            {textsLoading ? t('auth.title') : getText('auth.title', currentLanguage, t('auth.title'))}
          </h1>
          <p className="text-gray-500">
            {textsLoading ? t('auth.subtitle') : getText('auth.subtitle', currentLanguage, t('auth.subtitle'))}
          </p>
        </div>
        
        {/* Seletor de Idioma */}
        <div className="flex justify-center">
          <Select value={currentLanguage} onValueChange={changeLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('common.language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">{t('common.portuguese')}</SelectItem>
              <SelectItem value="jp">{t('common.japanese')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{textsLoading ? t('common.login') : getText('common.login', currentLanguage, t('common.login'))}</CardTitle>
            <CardDescription>
              {textsLoading ? t('auth.subtitle') : getText('auth.subtitle', currentLanguage, t('auth.subtitle'))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(99) 99999-9999" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('common.password')}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full !bg-blue-500 hover:!bg-blue-600 !text-white font-medium" 
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500 w-full text-center">
              {textsLoading ? 'Entre em contato com o administrador para obter acesso ao sistema.' : getText('auth.contactAdmin', currentLanguage, 'Entre em contato com o administrador para obter acesso ao sistema.')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default Auth; 