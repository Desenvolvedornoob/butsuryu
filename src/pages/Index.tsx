
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import UploadForm from '@/components/UploadForm';
import FinancialSummary from '@/components/FinancialSummary';
import ExpenseChart from '@/components/ExpenseChart';
import RevenueChart from '@/components/RevenueChart';
import TransactionsTable from '@/components/TransactionsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialData {
  receitas: Array<{ mes: string; valor: number }>;
  despesas: Array<{ categoria: string; valor: number }>;
  saldo: number;
}

const Index = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  
  // Sample transactions for the table
  const mockTransactions = [
    {
      id: 1,
      date: '10/05/2023',
      description: 'Salário',
      category: 'Renda',
      amount: 5000,
      type: 'receita' as const,
    },
    {
      id: 2,
      date: '15/05/2023',
      description: 'Aluguel',
      category: 'Moradia',
      amount: 1500,
      type: 'despesa' as const,
    },
    {
      id: 3,
      date: '20/05/2023',
      description: 'Supermercado',
      category: 'Alimentação',
      amount: 450,
      type: 'despesa' as const,
    },
    {
      id: 4,
      date: '25/05/2023',
      description: 'Freela',
      category: 'Renda Extra',
      amount: 800,
      type: 'receita' as const,
    },
    {
      id: 5,
      date: '30/05/2023',
      description: 'Internet',
      category: 'Utilidades',
      amount: 120,
      type: 'despesa' as const,
    },
  ];

  const handleFileUpload = (uploadedData: FinancialData) => {
    setData(uploadedData);
  };

  const totalReceitas = data?.receitas.reduce((sum, item) => sum + item.valor, 0) || 0;
  const totalDespesas = data?.despesas.reduce((sum, item) => sum + item.valor, 0) || 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>
        <p className="text-gray-500 mt-1">
          Visualize e gerencie suas finanças com facilidade
        </p>
      </div>

      {!data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Bem-vindo ao seu Dashboard Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Para começar, faça o upload da sua planilha financeira no formato CSV ou Excel.
                  O sistema processará seus dados e mostrará visualizações gráficas para ajudar na análise.
                </p>
                <p className="text-sm text-muted-foreground">
                  Dica: Organize sua planilha com colunas para data, descrição, categoria e valor para melhores resultados.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1">
            <UploadForm onFileUpload={handleFileUpload} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <FinancialSummary receitas={totalReceitas} despesas={totalDespesas} saldo={data.saldo} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueChart data={data.receitas} />
            <ExpenseChart data={data.despesas} />
          </div>
          
          <TransactionsTable transactions={mockTransactions} />
          
          <div className="flex justify-center">
            <UploadForm onFileUpload={handleFileUpload} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Index;
