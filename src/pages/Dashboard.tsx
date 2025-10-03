import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, LogOut, PieChart, UserCheck, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { loadRequests, loadAllRequests } from '@/integrations/supabase/client';

interface Request {
  id: string;
  type: string;
  status: string;
  date: string;
  endDate?: string;
  time?: string;
  arrivalTime?: string;
  reason: string;
  created_at?: string;
  user_id?: string;
  userName?: string;
}

export function Dashboard() {
  const { user, hasPermission } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const { getText, isLoading: textsLoading } = useCustomTexts();
  const navigate = useNavigate();
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);
  const [upcomingTimeOff, setUpcomingTimeOff] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));
  
  const [filterType, setFilterType] = useState<'month' | 'year'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('approved');
  const [filteredStats, setFilteredStats] = useState({
    folgas_utilizadas: 0,
    saidas_antecipadas: 0,
    atrasos: 0,
    faltas: 0
  });

  // Gerar opções de mês
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const currentYear = new Date().getFullYear();
    const date = new Date(currentYear, i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: pt });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  // Gerar opções de ano
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Usar useCallback para funções de navegação para evitar re-renderizações desnecessárias
  const handleNavigate = useCallback((path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.error("Erro ao navegar:", error);
      toast.error("Erro ao navegar. Tente novamente.");
    }
  }, [navigate]);
  
  // Função simplificada para recarregar dados manualmente
  const reloadData = useCallback(async () => {
    if (!user || !user.id) return;
    
    setIsLoading(true);
    try {
      const canApprove = user.role === 'admin' || user.role === 'superuser';
      const requestsResult = canApprove ? await loadAllRequests() : await loadRequests(user.id);
      
      if (requestsResult.success && requestsResult.data) {
        setRecentRequests(requestsResult.data.slice(0, 3));
        
        const approvedTimeOff = requestsResult.data
          .filter((req: Request) => 
            req.type === 'time-off' && 
            req.status === 'approved' && 
            new Date(req.date) >= new Date()
          )
          .slice(0, 3);
        
        setUpcomingTimeOff(approvedTimeOff);
      }
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    const loadData = async () => {
      // Só carregar dados se o usuário estiver completamente carregado
      if (!user || !user.id || user._loading_state === 'loading' || user._loading_state === 'temp') {
        return;
      }

      setIsLoading(true);
      
      try {
        let requestsResult;
        
        // Se o usuário tem permissão para ver todas as solicitações (admin/superuser)
        const canApprove = user.role === 'admin' || user.role === 'superuser';
        
        if (canApprove) {
          requestsResult = await loadAllRequests();
        } else {
          requestsResult = await loadRequests(user.id);
        }
        
        if (requestsResult.success && requestsResult.data) {
          const sortedRequests = requestsResult.data;
          
          // Pegar as 3 solicitações mais recentes
          setRecentRequests(sortedRequests.slice(0, 3));
          
          // Pegar as próximas folgas aprovadas
          const approvedTimeOff = sortedRequests
            .filter((req: Request) => 
              req.type === 'time-off' && 
              req.status === 'approved' && 
              new Date(req.date) >= new Date()
            )
            .slice(0, 3);
          
          setUpcomingTimeOff(approvedTimeOff);
          
          // Calcular estatísticas filtradas
          let filteredRequests: Request[] = [];

          if (filterType === 'month') {
            const [year, month] = selectedMonth.split('-');
            
            filteredRequests = sortedRequests.filter(req => {
              const reqDate = new Date(req.date);
              const matchesYear = reqDate.getFullYear() === parseInt(year);
              const matchesMonth = reqDate.getMonth() === parseInt(month) - 1;
              return matchesYear && matchesMonth;
            });
          } else {
            filteredRequests = sortedRequests.filter(req => {
              const reqDate = new Date(req.date);
              return reqDate.getFullYear() === parseInt(selectedYear);
            });
          }
          
          // Aplicar filtro de status
          let statusFilteredRequests = filteredRequests;
          if (statusFilter === 'approved') {
            statusFilteredRequests = filteredRequests.filter(req => req.status === 'approved');
          } else if (statusFilter === 'pending') {
            statusFilteredRequests = filteredRequests.filter(req => req.status === 'pending');
          }
          
          const stats = {
            folgas_utilizadas: statusFilteredRequests.filter(req => req.type === 'time-off').length,
            saidas_antecipadas: statusFilteredRequests.filter(req => req.type === 'early-departure').length,
            atrasos: statusFilteredRequests.filter(req => req.type === 'lateness').length,
            faltas: statusFilteredRequests.filter(req => req.type === 'absence').length
          };

          setFilteredStats(stats);
        }
      } catch (error) {
        console.error("❌ [Dashboard] Erro ao carregar solicitações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, user?.role, user?._loading_state, selectedMonth, selectedYear, filterType, statusFilter]);

  // Logs removidos para evitar poluição do console
  


  // Estatísticas dinâmicas baseadas no filtro
  const stats = useMemo(() => {
    const periodText = filterType === 'month' ? 'este mês' : 'este ano';
    
    return [
      { 
        id: 'folgas',
        label: 'Folgas', 
        value: `${filteredStats.folgas_utilizadas} ${periodText}`, 
        icon: <UserCheck className="h-5 w-5 text-green-500" /> 
      },
      { 
        id: 'saidas',
        label: 'Saídas Antecipadas', 
        value: `${filteredStats.saidas_antecipadas} ${periodText}`, 
        icon: <LogOut className="h-5 w-5 text-amber-500" /> 
      },
      { 
        id: 'atrasos',
        label: 'Atrasos', 
        value: `${filteredStats.atrasos} ${periodText}`, 
        icon: <Clock className="h-5 w-5 text-purple-500" /> 
      },
      { 
        id: 'faltas',
        label: 'Faltas', 
        value: `${filteredStats.faltas} ${periodText}`, 
        icon: <AlertTriangle className="h-5 w-5 text-red-500" /> 
      },
    ];
  }, [filteredStats, filterType, statusFilter]);
  
  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                {textsLoading ? t('dashboard.welcome') : getText('dashboard.welcome', currentLanguage)}, {user?.first_name}
              </h1>
              <p className="text-muted-foreground">{textsLoading ? t('dashboard.subtitle') : getText('dashboard.subtitle', currentLanguage)}</p>
            </div>
            {user?.role !== 'observador' && (
              <div className="mt-4 md:mt-0 space-x-2 flex flex-wrap gap-2">
                <Button
                  onClick={() => handleNavigate('/time-off')}
                  variant="outline"
                  className="px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  Solicitar Folga
                </Button>
                <Button
                  onClick={() => handleNavigate('/lateness')}
                  variant="secondary"
                  className="px-4 py-2 rounded-md transition-colors"
                >
                  Solicitar Atraso
                </Button>
                <Button
                  onClick={() => handleNavigate('/early-departure')}
                  variant="secondary"
                  className="px-4 py-2 rounded-md transition-colors"
                >
                  Saída Antecipada
                </Button>
                {hasPermission('canApproveLeaves') && (
                  <Button
                    onClick={() => handleNavigate('/absence')}
                    variant="destructive"
                    className="px-4 py-2 rounded-md transition-colors"
                  >
                    Registrar Falta
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filtros */}
          {user?.role !== 'observador' && (
            <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filtrar por:</label>
                    <Select value={filterType} onValueChange={(value: 'month' | 'year') => setFilterType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Mês</SelectItem>
                        <SelectItem value="year">Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <Select value={statusFilter} onValueChange={(value: 'all' | 'approved' | 'pending') => setStatusFilter(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="approved">Aprovados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filterType === 'month' ? (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Mês:</label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Ano:</label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={reloadData} 
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar Dados
                </Button>
              </div>
            </div>
          )}
          
          {user?.role !== 'observador' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  className="glass-panel rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                    </div>
                    <div className="p-2 bg-background rounded-md">
                      {stat.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {user?.role !== 'observador' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Pedidos Recentes</CardTitle>
                    <Button
                      onClick={() => handleNavigate('/requests')}
                      variant="ghost"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center"
                    >
                      Ver todos
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Suas solicitações mais recentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Carregando solicitações...</p>
                      </div>
                    ) : recentRequests.length > 0 ? (
                      recentRequests.map((request) => (
                        <motion.div
                          key={request.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="mb-3 sm:mb-0">
                                                      <div className="flex items-center mb-1">
                              <h4 className="font-medium mr-2">
                                {request.type === 'time-off' && 'Folga'}
                                {request.type === 'early-departure' && 'Saída Antecipada'}
                                {request.type === 'lateness' && 'Atraso'}
                                {request.type === 'absence' && 'Falta'}
                                {request.userName && hasPermission('canApproveLeaves') && ` - ${request.userName}`}
                              </h4>
                              <StatusBadge status={request.status as any} />
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(new Date(request.date), "yyyy-MM-dd", { locale: pt })}
                              {request.endDate && ` - ${format(new Date(request.endDate), "yyyy-MM-dd", { locale: pt })}`}
                              {request.time && ` às ${request.time}`}
                              {request.arrivalTime && ` chegada às ${request.arrivalTime}`}
                            </p>
                            <p className="text-sm mt-1">{request.reason}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Nenhuma solicitação recente.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Próximas Folgas</CardTitle>
                    <Button
                      onClick={() => handleNavigate('/calendar')}
                      variant="ghost"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center"
                    >
                      Calendário
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Folgas agendadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Carregando folgas...</p>
                      </div>
                    ) : upcomingTimeOff.length > 0 ? (
                      upcomingTimeOff.map((timeOff) => (
                        <motion.div
                          key={timeOff.id}
                          className="p-4 rounded-lg border"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Sua Folga</h4>
                            <StatusBadge status={timeOff.status as any} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(timeOff.date), "yyyy-MM-dd", { locale: pt })}
                            {timeOff.endDate && ` - ${format(new Date(timeOff.endDate), "yyyy-MM-dd", { locale: pt })}`}
                          </p>
                          <p className="text-sm mt-1">{timeOff.reason}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">Nenhuma folga agendada.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {user?.role !== 'observador' && (
            <div className="mt-8 glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Distribuição de Solicitações</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <PieChart className="h-4 w-4 mr-1" />
                  <span>{filterType === 'month' ? 'Este mês' : 'Este ano'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-green-50">
                  <span className="text-3xl font-bold text-green-600">{filteredStats.folgas_utilizadas}</span>
                  <span className="text-sm text-muted-foreground mt-2">Folgas Utilizadas</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-amber-50">
                  <span className="text-3xl font-bold text-amber-600">{filteredStats.saidas_antecipadas}</span>
                  <span className="text-sm text-muted-foreground mt-2">Saídas Antecipadas</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-purple-50">
                  <span className="text-3xl font-bold text-purple-600">{filteredStats.atrasos}</span>
                  <span className="text-sm text-muted-foreground mt-2">Atrasos</span>
                </div>

                <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-50">
                  <span className="text-3xl font-bold text-red-600">{filteredStats.faltas}</span>
                  <span className="text-sm text-muted-foreground mt-2">Faltas</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">


            {/* Opções para Superuser e Admin */}
            {hasPermission('canApproveLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.approval.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.approval.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/requests')} 
                    className="w-full"
                  >
                    {getText('dashboard.cards.approval.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Opções para Admin */}
            {hasPermission('canManageEmployees') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.employees.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.employees.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/employees')} 
                    className="w-full"
                  >
                    {getText('dashboard.cards.employees.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canManageFactories') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.factories.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.factories.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/factories')} 
                    className="w-full"
                  >
                    {getText('dashboard.cards.factories.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canManageShifts') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.groups.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.groups.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/groups')} 
                    className="w-full"
                  >
                    {getText('dashboard.cards.groups.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}



            {hasPermission('canApproveLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.absence.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.absence.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/absence')} 
                    variant="destructive"
                    className="w-full"
                  >
                    {getText('dashboard.cards.absence.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canApproveLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.data.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.data.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/data')} 
                    className="w-full"
                  >
                    {getText('dashboard.cards.data.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canApproveLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.monitoring.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.monitoring.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/monitoring')} 
                    className="w-full"
                    variant="outline"
                  >
                    {getText('dashboard.cards.monitoring.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canApproveLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.dismissals.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.dismissals.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/dismissals')} 
                    className="w-full"
                    variant="outline"
                    style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626' }}
                  >
                    {getText('dashboard.cards.dismissals.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission('canViewOwnLeaves') && (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('dashboard.cards.myData.title', currentLanguage)}</CardTitle>
                  <CardDescription>{getText('dashboard.cards.myData.description', currentLanguage)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleNavigate('/my-data')} 
                    variant="outline"
                    className="w-full"
                  >
                    {getText('dashboard.cards.myData.button', currentLanguage)}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AnimatedTransition>
    </>
  );
}

export default Dashboard;
