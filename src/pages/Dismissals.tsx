import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Users, Building, Activity, TrendingDown, Filter, Calendar, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchDismissalData,
  generateDismissalByReason,
  generateDismissalByFactory,
  generateDismissalByDepartment,
  generateMonthlyDismissalData,
  fetchFactoriesForDismissalFilter,
  fetchDepartmentsForDismissalFilter,
  fetchReasonsForDismissalFilter,
  fetchPrestadorasForDismissalFilter,
  calculateDismissalStats,
  DismissalFilters,
  DismissalData
} from '@/lib/dismissal-service';
import { toast } from '@/hooks/use-toast';

const Dismissals = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DismissalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DismissalFilters>({
    year: new Date().getFullYear(),
    month: undefined,
    factoryId: undefined,
    department: undefined,
    reason: undefined,
    prestadora: undefined
  });
  
  // Estados para filtros
  const [factories, setFactories] = useState<{id: string, name: string}[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [prestadoras, setPrestadoras] = useState<string[]>([]);
  
  // Estados para os dados dos gráficos
  const [reasonData, setReasonData] = useState<any[]>([]);
  const [factoryData, setFactoryData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Atualizar gráficos quando dados mudarem
  useEffect(() => {
    if (data.length >= 0) { // Permitir 0 registros também
      updateChartData();
    }
  }, [data]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados de desligamentos
      const dismissalData = await fetchDismissalData(filters);
      setData(dismissalData);
      
      // Carregar fábricas para filtros
      const factoriesData = await fetchFactoriesForDismissalFilter();
      setFactories(factoriesData);
      
      // Carregar departamentos para filtros
      const departmentsData = await fetchDepartmentsForDismissalFilter();
      setDepartments(departmentsData);
      
      // Carregar motivos para filtros
      const reasonsData = await fetchReasonsForDismissalFilter();
      setReasons(reasonsData);
      
      // Carregar prestadoras para filtros
      const prestadorasData = await fetchPrestadorasForDismissalFilter();
      setPrestadoras(prestadorasData);
      
    } catch (error) {
      console.error('Erro ao carregar dados de desligamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de desligamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = () => {
    setReasonData(generateDismissalByReason(data));
    setFactoryData(generateDismissalByFactory(data));
    setDepartmentData(generateDismissalByDepartment(data));
    setMonthlyData(generateMonthlyDismissalData(data));
    setStats(calculateDismissalStats(data));
  };

  const handleFilterChange = async (newFilters: DismissalFilters) => {
    try {
      setLoading(true);
      setFilters(newFilters);
      
      const dismissalData = await fetchDismissalData(newFilters);
      setData(dismissalData);
      
      toast({
        title: "Filtros aplicados",
        description: `Exibindo ${dismissalData.length} registros de desligamento`
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

  const clearFilters = () => {
    const clearedFilters = {
      year: new Date().getFullYear(),
      month: undefined,
      factoryId: undefined,
      department: undefined,
      reason: undefined,
      prestadora: undefined
    };
    handleFilterChange(clearedFilters);
  };

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#3B82F6', '#10B981'];

  // Função para renderizar labels apenas quando valor > 0
  const renderLabelIfNotZero = (value: any) => {
    return value > 0 ? value.toString() : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <p>Carregando dados de desligamentos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <Navbar />
      <AnimatedTransition>
        <div className="container mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <UserMinus className="h-8 w-8 text-red-600" />
                Dados de Desligamentos
              </h1>
              <p className="text-gray-600">Análise estatística dos desligamentos de funcionários</p>
            </div>

            {/* Filtros */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                <CardDescription>
                  Filtre os dados para análises específicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
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
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                          </SelectItem>
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
                    <Label htmlFor="department">Departamento</Label>
                    <Select
                      value={filters.department || 'all'}
                      onValueChange={(value) => handleFilterChange({ ...filters, department: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os departamentos</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivo</Label>
                    <Select
                      value={filters.reason || 'all'}
                      onValueChange={(value) => handleFilterChange({ ...filters, reason: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os motivos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os motivos</SelectItem>
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
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Desligamentos</CardTitle>
                  <UserMinus className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Todos os períodos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Este Ano</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.thisYear || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().getFullYear()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fábrica com Mais Desligamentos</CardTitle>
                  <Building className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">{stats.topFactory || 'N/A'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Motivo Mais Comum</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">{stats.topReason || 'N/A'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <Tabs defaultValue="reasons" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="reasons">Por Motivos</TabsTrigger>
                <TabsTrigger value="factory">Por Fábrica</TabsTrigger>
                <TabsTrigger value="department">Por Departamento</TabsTrigger>
                <TabsTrigger value="monthly">Evolução Mensal</TabsTrigger>
              </TabsList>

              <TabsContent value="reasons" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribuição por Motivo</CardTitle>
                      <CardDescription>
                        Percentual de desligamentos por motivo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={reasonData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ reason, percentage }) => `${reason}: ${percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {reasonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, 'Quantidade']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ranking por Motivos</CardTitle>
                      <CardDescription>
                        Quantidade de desligamentos por motivo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reasonData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="reason" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#EF4444">
                            <LabelList dataKey="count" position="right" fill="#EF4444" fontSize={12} formatter={renderLabelIfNotZero} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="factory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Desligamentos por Fábrica</CardTitle>
                    <CardDescription>
                      Quantidade de desligamentos em cada fábrica
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={factoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="factory" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F97316">
                          <LabelList dataKey="count" position="top" fill="#F97316" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="department" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Desligamentos por Departamento</CardTitle>
                    <CardDescription>
                      Quantidade de desligamentos em cada departamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6">
                          <LabelList dataKey="count" position="top" fill="#8B5CF6" fontSize={12} formatter={renderLabelIfNotZero} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução Mensal dos Desligamentos</CardTitle>
                    <CardDescription>
                      Quantidade de desligamentos por mês
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#EF4444" 
                          strokeWidth={3}
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                          name="Desligamentos"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Dismissals;
