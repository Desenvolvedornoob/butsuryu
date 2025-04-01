
import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialSummaryProps {
  receitas: number;
  despesas: number;
  saldo: number;
}

const FinancialSummary = ({ receitas, despesas, saldo }: FinancialSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Receitas</CardTitle>
          <ArrowUpCircle className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(receitas)}</div>
          <p className="text-xs text-gray-500">+5% em relação ao mês anterior</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(despesas)}</div>
          <p className="text-xs text-gray-500">-2% em relação ao mês anterior</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(saldo)}</div>
          <p className="text-xs text-gray-500">+8% em relação ao mês anterior</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
