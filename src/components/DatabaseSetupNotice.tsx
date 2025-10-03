import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { siteTextsService } from '@/services/siteTextsService';

interface DatabaseSetupNoticeProps {
  onDismiss?: () => void;
}

const DatabaseSetupNotice: React.FC<DatabaseSetupNoticeProps> = ({ onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const sqlScript = `-- 🚨 EXECUTE ESTE SQL NO SUPABASE PRIMEIRO! 🚨
-- Arquivo: create-site-texts-simple.sql

-- Verificar se a tabela existe e criar se necessário
CREATE TABLE IF NOT EXISTS site_texts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    language VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    text_key VARCHAR(100) NOT NULL,
    text_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(language, category, text_key)
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_site_texts_language_category ON site_texts(language, category);
CREATE INDEX IF NOT EXISTS idx_site_texts_key ON site_texts(text_key);

-- Habilitar RLS
ALTER TABLE site_texts ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas já existem antes de criar
DO $$
BEGIN
    -- Verificar se a política de leitura existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_texts' 
        AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON site_texts
            FOR SELECT TO authenticated
            USING (true);
    END IF;
    
    -- Verificar se a política de escrita existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_texts' 
        AND policyname = 'Allow write access to admins and superusers'
    ) THEN
        CREATE POLICY "Allow write access to admins and superusers" ON site_texts
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'superuser')
                )
            );
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_site_texts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_site_texts_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_site_texts_updated_at
            BEFORE UPDATE ON site_texts
            FOR EACH ROW
            EXECUTE FUNCTION update_site_texts_updated_at();
    END IF;
END $$;`;

  // Verificar se o banco está configurado
  useEffect(() => {
    const checkDatabaseSetup = async () => {
      try {
        console.log('🔍 Verificando configuração do banco de dados...');
        const texts = await siteTextsService.getTextsByLanguage('pt-BR');
        console.log('📊 Resultado da verificação:', texts);
        
        // Se conseguiu buscar dados sem erro, o banco está configurado
        setIsDatabaseConfigured(true);
        console.log('✅ Banco de dados configurado corretamente!');
      } catch (error) {
        console.log('❌ Banco de dados não configurado:', error);
        setIsDatabaseConfigured(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkDatabaseSetup();
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // Se está verificando, mostrar loading
  if (isChecking) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-800">Verificando configuração do banco de dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se o banco está configurado, não mostrar o aviso
  if (isDatabaseConfigured) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800">
            Configuração do Banco de Dados Necessária
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>🚨 ATENÇÃO:</strong> Para que as mudanças de texto sejam salvas no banco de dados e visíveis para todos os usuários, 
            você precisa executar o script SQL abaixo no Supabase primeiro!
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Script SQL para executar:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{sqlScript}</pre>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Como executar:</h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Acesse o painel do Supabase</li>
            <li>Vá em "SQL Editor"</li>
            <li>Cole o script copiado</li>
            <li>Execute o script</li>
            <li>Recarregue esta página</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="destructive" className="text-xs">
            ❌ Banco não configurado - Execute o SQL primeiro!
          </Badge>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="ml-auto text-xs"
            >
              Dispensar aviso
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetupNotice;
