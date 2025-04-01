
import React, { useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UploadFormProps {
  onFileUpload: (data: any) => void;
}

const UploadForm = ({ onFileUpload }: UploadFormProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    try {
      // Simple file validation
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error('Por favor, faça upload de um arquivo CSV ou Excel.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        // For a real implementation, we would parse CSV/Excel data here
        // For demo purposes, we'll just simulate some parsed data
        setTimeout(() => {
          const mockData = {
            receitas: [
              { mes: 'Janeiro', valor: 5000 },
              { mes: 'Fevereiro', valor: 5200 },
              { mes: 'Março', valor: 4800 },
              { mes: 'Abril', valor: 5500 },
              { mes: 'Maio', valor: 5300 },
              { mes: 'Junho', valor: 5800 },
            ],
            despesas: [
              { categoria: 'Moradia', valor: 1500 },
              { categoria: 'Alimentação', valor: 800 },
              { categoria: 'Transporte', valor: 500 },
              { categoria: 'Lazer', valor: 300 },
              { categoria: 'Saúde', valor: 400 },
              { categoria: 'Outros', valor: 600 },
            ],
            saldo: 1800
          };

          onFileUpload(mockData);
          toast.success('Arquivo processado com sucesso!');
          setIsLoading(false);
        }, 1000);
      };

      reader.readAsText(file);
    } catch (error) {
      toast.error('Erro ao processar o arquivo.');
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload de Planilha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          <FileUp className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700">
            Arraste e solte sua planilha aqui ou clique para selecionar
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Suporta arquivos CSV e Excel
          </p>
        </div>
        <div className="mt-4">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={isLoading}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            {isLoading ? 'Processando...' : 'Selecionar Arquivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadForm;
