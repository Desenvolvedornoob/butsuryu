import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Users, Building, Activity, TrendingUp, Filter, Download, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchDataForCharts, 
  generateChartDataByType, 
  generateMonthlyData,
  generateFactoryData,
  generateUserData,
  generateReasonsData,
  generateReasonUserData,
  fetchUsersForFilter,
  fetchFactoriesForFilter,
  fetchReasonsForFilter,
  fetchPrestadorasForFilter,
  calculateDurationInDays,
  fetchSubstitutesForFilter,
  DataFilters,
  RequestData,
  ReasonsData,
  ReasonUserData
} from '@/lib/data-service';
import { toast } from '@/hooks/use-toast';

const Data = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DataFilters>({
    year: new Date().getFullYear(),
    month: undefined,
    userId: undefined,
    factoryId: undefined,
    requestType: undefined,
    reason: undefined,
    prestadora: undefined,
    substituteId: undefined
  });
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [factories, setFactories] = useState<{id: string, name: string}[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [prestadoras, setPrestadoras] = useState<string[]>([]);
  const [substitutes, setSubstitutes] = useState<{id: string, name: string}[]>([]);
  
  // Estados para os dados dos gráficos
  const [chartDataByType, setChartDataByType] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [factoryData, setFactoryData] = useState<any[]>([]);
  const [userData, setUserData] = useState<any[]>([]);
  const [reasonsData, setReasonsData] = useState<ReasonsData[]>([]);
  
  // Estados para o modal de detalhes do motivo
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reasonUserData, setReasonUserData] = useState<ReasonUserData[]>([]);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Atualizar gráficos quando dados mudarem
  useEffect(() => {
    if (data.length > 0) {
      updateChartData();
    }
  }, [data]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados dos gráficos
      const chartData = await fetchDataForCharts(filters);
      
      setData(chartData);
      
      // Carregar usuários para filtros
      const usersData = await fetchUsersForFilter();
      setUsers(usersData);
      
      // Carregar fábricas para filtros
      const factoriesData = await fetchFactoriesForFilter();
      setFactories(factoriesData);
      
      // Carregar motivos para filtros (todos os tipos inicialmente)
      const reasonsData = await fetchReasonsForFilter();
      setReasons(reasonsData);
      
      // Carregar prestadoras para filtros
      const prestadorasData = await fetchPrestadorasForFilter();
      setPrestadoras(prestadorasData);
      
      // Carregar substitutos para filtros
      const substitutesData = await fetchSubstitutesForFilter();
      setSubstitutes(substitutesData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos gráficos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = () => {
    setChartDataByType(generateChartDataByType(data));
    setMonthlyData(generateMonthlyData(data));
    setFactoryData(generateFactoryData(data));
    setUserData(generateUserData(data));
    setReasonsData(generateReasonsData(data));
  };

  // Função para recarregar motivos baseado no tipo selecionado
  const loadReasonsForType = async (requestType?: any) => {
    try {
      const reasonsData = await fetchReasonsForFilter(requestType);
      setReasons(reasonsData);
    } catch (error) {
      console.error('Erro ao carregar motivos para o tipo:', error);
    }
  };

  const handleFilterChange = async (newFilters: DataFilters) => {
    try {
      setLoading(true);
      
      // Se o tipo de solicitação mudou, recarregar motivos e limpar motivo selecionado
      if (newFilters.requestType !== filters.requestType) {
        await loadReasonsForType(newFilters.requestType);
        newFilters.reason = undefined; // Limpar motivo selecionado
      }
      
      setFilters(newFilters);
      
      const chartData = await fetchDataForCharts(newFilters);
      setData(chartData);
      
      toast({
        title: "Filtros aplicados",
        description: `Exibindo ${chartData.length} registros`
      });
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar os filtros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = async () => {
    try {
      // Recarregar todos os motivos
      await loadReasonsForType();
      
      const clearedFilters = {
        year: new Date().getFullYear(),
        month: undefined,
        userId: undefined,
        factoryId: undefined,
        requestType: undefined,
        reason: undefined,
        prestadora: undefined
      };
      handleFilterChange(clearedFilters);
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    }
  };

  const exportData = () => {
    // Implementar exportação de dados
    toast({
      title: "Exportação",
      description: "Funcionalidade em desenvolvimento"
    });
  };

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason);
    const userData = generateReasonUserData(data, reason);
    setReasonUserData(userData);
    setIsReasonModalOpen(true);
  };

  const COLORS = ['#3B82F6', '#8B5CF6', '#EAB308', '#F97316', '#10B981', '#EF4444'];


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
              <h1 className="text-3xl font-bold mb-2">Dados e Relatórios</h1>
              <p className="text-muted-foreground">
                Análise completa de solicitações, faltas, atrasos e saídas antecipadas
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtre os dados por período, usuário, fábrica ou tipo de solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Select
                    value={filters.year?.toString() || ''}
                    onValueChange={(value) => handleFilterChange({ ...filters, year: parseInt(value) })}
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
                  <Label htmlFor="month">Mês</Label>
                  <Select
                    value={filters.month?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, month: value === 'all' ? undefined : parseInt(value) })}
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

                <div className="space-y-2">
                  <Label htmlFor="user">Funcionário</Label>
                  <Select
                    value={filters.userId || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, userId: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os funcionários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os funcionários</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="factory">Fábrica</Label>
                  <Select
                    value={filters.factoryId || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, factoryId: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as fábricas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fábricas</SelectItem>
                      {factories.map(factory => (
                        <SelectItem key={factory.id} value={factory.id}>{factory.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={filters.requestType || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, requestType: value === 'all' ? undefined : value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="time-off">Folgas</SelectItem>
                      <SelectItem value="early-departure">Saída Antecipada</SelectItem>
                      <SelectItem value="lateness">Atrasos</SelectItem>
                      <SelectItem value="absence">Faltas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Motivo
                    {filters.requestType && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (filtrado por tipo)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={filters.reason || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, reason: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        filters.requestType 
                          ? `Motivos de ${filters.requestType === 'time-off' ? 'Folgas' : 
                                         filters.requestType === 'early-departure' ? 'Saída Antecipada' :
                                         filters.requestType === 'lateness' ? 'Atrasos' : 'Faltas'}`
                          : "Todos os motivos"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {filters.requestType 
                          ? `Todos os motivos de ${filters.requestType === 'time-off' ? 'Folgas' : 
                                                  filters.requestType === 'early-departure' ? 'Saída Antecipada' :
                                                  filters.requestType === 'lateness' ? 'Atrasos' : 'Faltas'}`
                          : "Todos os motivos"
                        }
                      </SelectItem>
                      {reasons.map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prestadora">Prestadora</Label>
                  <Select
                    value={filters.prestadora || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, prestadora: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as prestadoras" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as prestadoras</SelectItem>
                      {prestadoras.map(prestadora => (
                        <SelectItem key={prestadora} value={prestadora}>{prestadora}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="substitute">Substituto</Label>
                  <Select
                    value={filters.substituteId || 'all'}
                    onValueChange={(value) => handleFilterChange({ ...filters, substituteId: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os substitutos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os substitutos</SelectItem>
                      {substitutes.map(substitute => (
                        <SelectItem key={substitute.id} value={substitute.id}>{substitute.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Limpar Filtros
                </Button>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {data.length} registros encontrados
                  </Badge>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {data.filter(d => d.status === 'approved').length} aprovados
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Dias</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data
                    .filter(d => d.status === 'approved')
                    .reduce((total, item) => total + calculateDurationInDays(item), 0)
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Folgas</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data
                    .filter(d => d.type === 'time-off' && d.status === 'approved')
                    .reduce((total, item) => total + calculateDurationInDays(item), 0)
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saídas Antecipadas</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data
                    .filter(d => d.type === 'early-departure' && d.status === 'approved')
                    .reduce((total, item) => total + calculateDurationInDays(item), 0)
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data
                    .filter(d => d.type === 'lateness' && d.status === 'approved')
                    .reduce((total, item) => total + calculateDurationInDays(item), 0)
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faltas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data
                    .filter(d => d.type === 'absence' && d.status === 'approved')
                    .reduce((total, item) => total + calculateDurationInDays(item), 0)
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Motivos Únicos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reasonsData.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="factory">Por Fábrica</TabsTrigger>
              <TabsTrigger value="user">Por Funcionário</TabsTrigger>
              <TabsTrigger value="reasons">Por Motivos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Tipo</CardTitle>
                    <CardDescription>
                      Total de dias por tipo de solicitação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartDataByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => `${name}: ${value} dias (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartDataByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dias por Tipo</CardTitle>
                    <CardDescription>
                      Total de dias por cada tipo de solicitação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartDataByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                        <Bar dataKey="value" fill="#3B82F6">
                          <LabelList dataKey="value" position="top" fill="#3B82F6" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                  <CardDescription>
                    Total de dias por mês e tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                      <Legend />
                      <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name="Folgas">
                        <LabelList dataKey="timeOff" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name="Saída Antecipada">
                        <LabelList dataKey="earlyDeparture" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="lateness" stackId="a" fill="#EAB308" name="Atrasos">
                        <LabelList dataKey="lateness" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="absence" stackId="a" fill="#F97316" name="Faltas">
                        <LabelList dataKey="absence" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados por Fábrica</CardTitle>
                  <CardDescription>
                    Total de dias por tipo de solicitação aprovada por fábrica
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={factoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="factory" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                      <Legend />
                      <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name="Folgas">
                        <LabelList dataKey="timeOff" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="absence" stackId="a" fill="#F97316" name="Faltas">
                        <LabelList dataKey="absence" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="lateness" stackId="a" fill="#EAB308" name="Atrasos">
                        <LabelList dataKey="lateness" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name="Saídas Antecipadas">
                        <LabelList dataKey="earlyDeparture" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados por Funcionário</CardTitle>
                  <CardDescription>
                    Todos os funcionários ordenados por total de dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={600}>
                    <BarChart data={userData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="user" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                      <Legend />
                      <Bar dataKey="timeOff" stackId="a" fill="#3B82F6" name="Folgas">
                        <LabelList dataKey="timeOff" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="earlyDeparture" stackId="a" fill="#8B5CF6" name="Saída Antecipada">
                        <LabelList dataKey="earlyDeparture" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="lateness" stackId="a" fill="#EAB308" name="Atrasos">
                        <LabelList dataKey="lateness" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                      <Bar dataKey="absence" stackId="a" fill="#F97316" name="Faltas">
                        <LabelList dataKey="absence" position="center" fill="white" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reasons" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Motivos</CardTitle>
                    <CardDescription>
                      Frequência dos motivos por total de dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={reasonsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ reason, count }) => `${reason}: ${count} dias`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {reasonsData.map((entry) => (
                            <Cell key={`cell-${entry.reason}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ranking de Motivos</CardTitle>
                    <CardDescription>
                      Motivos com mais dias em ordem decrescente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={reasonsData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="reason" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [`${value} dias`, name]} />
                        <Bar dataKey="count" fill="#3B82F6">
                          <LabelList dataKey="count" position="top" fill="#3B82F6" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {reasonsData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhamento dos Motivos</CardTitle>
                    <CardDescription>
                      Lista completa com total de dias e percentuais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reasonsData.map((item, index) => (
                        <div 
                          key={item.reason} 
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleReasonClick(item.reason)}
                          title="Clique para ver detalhes dos usuários"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            ></div>
                            <span className="font-medium text-sm">{item.reason}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{item.count} dias</div>
                            <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          </Tabs>

          {/* Modal para detalhes do motivo */}
          <Dialog open={isReasonModalOpen} onOpenChange={setIsReasonModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Detalhes do Motivo: "{selectedReason}"</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsReasonModalOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
                <DialogDescription>
                  Usuários que utilizaram este motivo e frequência de uso
                </DialogDescription>
              </DialogHeader>
              
              {reasonUserData.length > 0 ? (
                <div className="space-y-6">
                  {/* Gráfico de Barras */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Frequência por Usuário</CardTitle>
                      <CardDescription>
                        Quantas vezes cada usuário utilizou o motivo "{selectedReason}"
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={reasonUserData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="user" 
                            angle={-45} 
                            textAnchor="end" 
                            height={120}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6">
                          <LabelList dataKey="count" position="top" fill="#3B82F6" fontSize={12} formatter={(value) => value > 0 ? `${value} dias` : ''} />
                        </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Pizza */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Usuário</CardTitle>
                      <CardDescription>
                        Proporção de uso do motivo "{selectedReason}" entre usuários
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={reasonUserData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ user, count }) => `${user}: ${count}`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {reasonUserData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Lista detalhada */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Lista Detalhada</CardTitle>
                      <CardDescription>
                        Ranking de usuários por frequência de uso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reasonUserData.map((item, index) => (
                          <div key={item.user} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                {index + 1}
                              </div>
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.fill }}
                              ></div>
                              <span className="font-medium text-sm">{item.user}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{item.count}</div>
                              <div className="text-xs text-muted-foreground">uso(s)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum usuário encontrado para o motivo "{selectedReason}"
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedTransition>
    </>
  );
};

export default Data; 