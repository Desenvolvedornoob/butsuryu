import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, LogOut, User, TrendingUp, Activity, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchUserData, 
  generateChartDataByType, 
  generateMonthlyData,
  RequestData,
  DataFilters 
} from '@/lib/data-service';
import { toast } from '@/hooks/use-toast';

const MyData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  
  // Estados para os dados dos gráficos
  const [chartDataByType, setChartDataByType] = useState<any[]>([]);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Carregar dados do usuário
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user, selectedYear, selectedMonth]);

  // Atualizar gráficos quando dados mudarem ou filtros mudarem
  useEffect(() => {
    updateChartData();
  }, [data, selectedYear, selectedMonth]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Filtros para o usuário logado
      const filters: DataFilters = {
        userId: user.id,
        year: selectedYear,
        month: selectedMonth
      };
      
      const userData = await fetchUserData(user.id);
      
      // Aplicar filtros de ano e mês
      let filteredData = userData;
      
      if (selectedYear) {
        filteredData = filteredData.filter(item => 
          new Date(item.date).getFullYear() === selectedYear
        );
      }
      
      if (selectedMonth) {
        filteredData = filteredData.filter(item => 
          new Date(item.date).getMonth() + 1 === selectedMonth
        );
      }
      
      setData(filteredData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = () => {
    setChartDataByType(generateChartDataByType(data));
    setMonthlyData(generateMonthlyData(data, selectedYear, selectedMonth));
  };

  const exportMyData = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade em desenvolvimento"
    });
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#EAB308', '#F97316', '#10B981', '#EF4444'];

  // Calcular estatísticas
  const totalRequests = data.length;
  const approvedRequests = data.filter(d => d.status === 'approved').length;
  const pendingRequests = data.filter(d => d.status === 'pending').length;
  const rejectedRequests = data.filter(d => d.status === 'rejected').length;
  
  // Contar apenas requests aprovados para estatísticas principais
  const timeOffRequests = data.filter(d => d.type === 'time-off' && d.status === 'approved').length;
  const latenessRequests = data.filter(d => d.type === 'lateness' && d.status === 'approved').length;
  const absenceRequests = data.filter(d => d.type === 'absence' && d.status === 'approved').length;
  const earlyDepartureRequests = data.filter(d => d.type === 'early-departure' && d.status === 'approved').length;
  

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Meus Dados</h1>
              <p className="text-muted-foreground">
                Visualize suas solicitações, faltas, atrasos e saídas antecipadas
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button onClick={exportMyData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Meus Dados
              </Button>
            </div>
          </div>

          {/* Filtros Simples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtre seus dados por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="year" className="text-sm font-medium">Ano</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2023, 2024, 2025].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="month" className="text-sm font-medium">Mês</label>
                  <Select
                    value={selectedMonth?.toString() || 'all'}
                    onValueChange={(value) => setSelectedMonth(value === 'all' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4">
                <Badge variant="secondary">
                  {totalRequests} solicitações encontradas
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Minhas Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {approvedRequests} aprovadas, {pendingRequests} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Folgas</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeOffRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Solicitações de folga
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latenessRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Registros de atraso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saídas Antecipadas</CardTitle>
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{earlyDepartureRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Saídas antecipadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faltas</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{absenceRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Faltas registradas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos dos Meus Dados */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Minhas Solicitações por Tipo</CardTitle>
                    <CardDescription>
                      Distribuição das suas solicitações por tipo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartDataByType.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma solicitação encontrada</p>
                          <p className="text-sm">Para o período selecionado</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartDataByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartDataByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quantidade por Tipo</CardTitle>
                    <CardDescription>
                      Número total de cada tipo de solicitação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartDataByType.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center">
                          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma solicitação encontrada</p>
                          <p className="text-sm">Para o período selecionado</p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartDataByType}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Minha Evolução Mensal</CardTitle>
                  <CardDescription>
                    Como suas solicitações evoluíram ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado mensal encontrado</p>
                        <p className="text-sm">Para o período selecionado</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name="Folgas" />
                        <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name="Saída Antecipada" />
                        <Bar dataKey="lateness" stackId="a" fill="#EAB308" name="Atrasos" />
                        <Bar dataKey="absence" stackId="a" fill="#F97316" name="Faltas" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
      </AnimatedTransition>
    </>
  );
};

export default MyData; 