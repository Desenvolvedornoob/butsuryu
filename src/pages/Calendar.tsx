import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LogOut, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { loadAllRequests } from '@/lib/requests';
import { toast } from 'sonner';

interface Request {
  id: string;
  type: string;
  status: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  endDate?: string;
  reason: string;
  user_id: string;
  userName?: string;
  factory_id?: string;
}

interface Factory {
  id: string;
  name: string;
  holidays: { id: string; name: string; date: string; factory_id: string }[];
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [requests, setRequests] = useState<Request[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  // Estados para o modal de solicitação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<'time-off' | 'early-departure' | 'lateness'>('time-off');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    time: '',
    arrivalTime: '',
    reason: '',
    subReason: '',
    customReason: '',
    customSubReason: ''
  });
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Função para verificar se usuário deve ver nomes
  const shouldShowNames = () => {
    return user?.role === 'admin' || user?.role === 'superuser';
  };

  // Função para obter opções de motivos baseadas no tipo de solicitação
  const getReasonOptions = (type: 'time-off' | 'early-departure' | 'lateness' | 'absence') => {
    const optionsMap = {
      'time-off': ['5 dias', 'Descanso', 'Viagem', 'Família', 'Particular', 'Outros'],
      'absence': ['Passando Mal', 'Família', 'Corpo', 'Doença', 'Outros'],
      'lateness': ['Família', 'Perdeu o horário', 'Veículo', 'Outros'],
      'early-departure': ['Compromisso', 'Família', 'Ruim', 'Outros']
    };
    
    return optionsMap[type] || [];
  };

  // Função para obter subcategorias baseadas no motivo principal
  const getSubReasonOptions = (type: 'time-off' | 'early-departure' | 'lateness' | 'absence', mainReason: string) => {
    const subOptionsMap: { [key: string]: { [key: string]: string[] } } = {
      'absence': {
        'Passando Mal': ['Insolação', 'Tontura', 'Febre', 'Dor de cabeça', 'Barriga', 'Dor no corpo', 'Outros'],
        'Família': ['Esposa', 'Filhos', 'Morte'],
        'Corpo': ['Costa', 'Joelho', 'Mão', 'Outro'],
        'Doença': ['Resfriado', 'Corona', 'Influenza', 'Diarreia', 'Pedra no rim', 'Outros']
      },
      'lateness': {
        'Família': ['Esposa', 'Filhos', 'Familiares'],
        'Perdeu o horário': ['Dormiu', 'Despertador'],
        'Veículo': ['Quebrou', 'Acidente']
      },
      'early-departure': {
        'Ruim': ['Insolação', 'Tontura', 'Febre', 'Dor de cabeça', 'Barriga', 'Dor no corpo', 'Outros'],
        'Família': ['Esposa', 'Filhos', 'Familiares']
      }
    };
    
    return subOptionsMap[type]?.[mainReason] || [];
  };

  // Função para verificar se um motivo tem subcategorias
  const hasSubReasons = (type: 'time-off' | 'early-departure' | 'lateness' | 'absence', mainReason: string) => {
    return getSubReasonOptions(type, mainReason).length > 0;
  };

  // Função para formatar texto do evento baseado nas permissões
  const formatEventText = (userName: string, eventType: string) => {
    if (shouldShowNames()) {
      return `${userName}: ${getEventLabel(eventType)}`;
    }
    return getEventLabel(eventType);
  };

  // Função para padronizar rótulos dos eventos
  const getEventLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'time-off': 'Folga',
      'absence': 'Falta',
      'early-departure': 'Saída Antecipada',
      'lateness': 'Atraso',
      'holiday': 'Feriado'
    };
    return labels[type] || type;
  };

  // Função auxiliar para formatar datas com segurança
  const safeFormatDate = (date: any, formatStr: string, options?: any) => {
    if (!date) return 'Data inválida';
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Data inválida';
    }
    
    try {
      return format(parsedDate, formatStr, options);
    } catch (error) {
      console.warn('🚨 [Calendar] Erro ao formatar data:', error, date);
      return 'Data inválida';
    }
  };

  // Função para verificar se um dia está bloqueado para solicitações de folga
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedDates.includes(dateStr);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Carregar fábricas e feriados
        const { data: factoriesData, error: factoriesError } = await supabase
          .from('factories')
          .select('*')
          .order('name');

        if (factoriesError) throw factoriesError;

        // Buscar feriados para cada fábrica
        const factoriesWithHolidays = await Promise.all(
          (factoriesData || []).map(async (factory) => {
            const { data: holidaysData, error: holidaysError } = await supabase
              .from('holidays')
              .select('*')
              .eq('factory_id', factory.id);

            if (holidaysError) throw holidaysError;

            return {
              ...factory,
              holidays: holidaysData || []
            };
          })
        );

        setFactories(factoriesWithHolidays);

        // Carregar dias bloqueados para o usuário atual
        if (user?.id) {
          const { getBlockedDatesForUser } = await import('@/utils/holiday-validation');
          const blockedDatesData = await getBlockedDatesForUser(user.id);
          setBlockedDates(blockedDatesData);
        }

        // Carregar solicitações aprovadas
        const requestsResult = await loadAllRequests();
        if (requestsResult.success && requestsResult.data) {
          // Filtrar apenas as aprovadas e formatar para o calendário
          const approvedRequests = requestsResult.data
            .filter(req => req.status === 'approved')
            .map(req => ({
              id: req.id,
              type: req.type,
              status: req.status,
              start_date: req.date || req.start_date,
              end_date: req.endDate || req.end_date || req.date,
              reason: req.reason,
              user_id: req.user_id,
              userName: req.userName,
              factory_id: req.factory_id || '1' // Usar factory_id da solicitação, padrão '1' se não existir
            }));
          
          setRequests(approvedRequests);
          
          // Log para debug dos factory_ids
          console.log('🏭 [Calendar] Factory IDs das solicitações:', [...new Set(approvedRequests.map(req => req.factory_id))]);
          console.log('🏭 [Calendar] Factory IDs das fábricas:', factories.map(f => f.id));
        } else {
          console.error('Erro ao carregar solicitações:', requestsResult.error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getRequestsForDate = (date: Date): any[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    console.log(`🗓️ [Calendar] Buscando eventos para ${dateStr}`);
    console.log(`🗓️ [Calendar] Total de requests disponíveis:`, requests.length);
    console.log(`🗓️ [Calendar] Selected factory:`, selectedFactory);
    
    if (!selectedFactory || selectedFactory === 'all') {
      // Adiciona solicitações de todas as fábricas
      const dayRequests = requests.filter(request => {
        const startDate = new Date(request.start_date || request.date || '');
        const endDate = new Date(request.end_date || request.endDate || request.start_date || request.date || '');
        const currentDate = new Date(dateStr);
        
        // Verificar se as datas são válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(currentDate.getTime())) {
          console.warn(`🚨 [Calendar] Data inválida encontrada:`, {
            startDate: request.start_date || request.date,
            endDate: request.end_date || request.endDate,
            requestId: request.id
          });
          return false;
        }
        
        // Comparar apenas as datas (ano, mês, dia) ignorando horários
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        const isInRange = currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
        
        return isInRange;
      });

      // Adiciona feriados - com validação de data
      const dayHolidays = factories.flatMap(factory => 
        factory.holidays
          .filter(holiday => {
            // Verificar se a data do feriado é válida
            const holidayDate = new Date(holiday.date);
            if (isNaN(holidayDate.getTime())) {
              console.warn(`🚨 [Calendar] Data de feriado inválida:`, holiday);
              return false;
            }
            
            try {
              return format(holidayDate, 'yyyy-MM-dd') === dateStr;
            } catch (error) {
              console.warn(`🚨 [Calendar] Erro ao formatar data do feriado:`, error, holiday);
              return false;
            }
          })
          .map(holiday => ({
            id: `holiday-${holiday.id}`,
            type: 'holiday',
            status: 'approved',
            start_date: holiday.date,
            end_date: holiday.date,
            reason: holiday.name,
            user_id: '',
            userName: holiday.name,
            factory_id: holiday.factory_id
          }))
      );

      const events = [...dayHolidays, ...dayRequests];
      
      console.log(`📋 [Calendar] Eventos encontrados para ${dateStr}:`, events.length);
      
      return events;
    }

    // Adiciona solicitações da fábrica selecionada
    const dayRequests = requests.filter(request => {
      const startDate = new Date(request.start_date || request.date || '');
      const endDate = new Date(request.end_date || request.endDate || request.start_date || request.date || '');
      const currentDate = new Date(dateStr);
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(currentDate.getTime())) {
        console.warn(`🚨 [Calendar] Data inválida encontrada:`, {
          startDate: request.start_date || request.date,
          endDate: request.end_date || request.endDate,
          requestId: request.id
        });
        return false;
      }
      
      // Comparar apenas as datas (ano, mês, dia) ignorando horários
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      
      const isInDateRange = currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly;
      const isFromSelectedFactory = request.factory_id === selectedFactory;
      
      console.log(`🏭 [Calendar] Request ${request.id} (${request.userName}): factory_id="${request.factory_id}" vs selectedFactory="${selectedFactory}", match=${isFromSelectedFactory}, inRange=${isInDateRange}`);
      
      return isInDateRange && isFromSelectedFactory;
    });

    // Adiciona feriados - com validação de data
    const dayHolidays = factories.find(factory => factory.id === selectedFactory)?.holidays
      .filter(holiday => {
        // Verificar se a data do feriado é válida
        const holidayDate = new Date(holiday.date);
        if (isNaN(holidayDate.getTime())) {
          console.warn(`🚨 [Calendar] Data de feriado inválida:`, holiday);
          return false;
        }
        
        try {
          return format(holidayDate, 'yyyy-MM-dd') === dateStr;
        } catch (error) {
          console.warn(`🚨 [Calendar] Erro ao formatar data do feriado:`, error, holiday);
          return false;
        }
      })
      .map(holiday => ({
        id: `holiday-${holiday.id}`,
        type: 'holiday',
        status: 'approved',
        start_date: holiday.date,
        end_date: holiday.date,
        reason: holiday.name,
        user_id: '',
        userName: holiday.name,
        factory_id: holiday.factory_id
      })) || [];

    const events = [...dayHolidays, ...dayRequests];
    
    console.log(`📋 [Calendar] Eventos encontrados para ${dateStr}:`, events.length);
    
    return events;
  };

  const hasEvents = (date: Date) => {
    return getRequestsForDate(date).length > 0;
  };

  const getEventColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'time-off': 'bg-blue-500',
      'absence': 'bg-orange-500',
      'early-departure': 'bg-purple-500',
      'lateness': 'bg-yellow-500',
      'holiday': 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Adicionar dias vazios no início para completar a primeira semana
    const firstDayOfWeek = start.getDay();
    const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);
    
    return [...emptyDays, ...days];
  };

  // Função para determinar se a semana deve ter fundo escuro
  const isWeekDark = (weekNumber: number) => {
    return weekNumber % 2 === 1; // Semanas ímpares (1, 3, 5...) terão fundo escuro
  };

  // Função para abrir o modal de solicitação
  const openRequestModal = (type: 'time-off' | 'early-departure' | 'lateness') => {
    // Usar a data selecionada se não for passada, ou hoje se for passada
    const today = new Date();
    const targetDate = selectedDate < today ? today : selectedDate;
    
    setRequestType(type);
    setFormData({
      startDate: format(targetDate, 'yyyy-MM-dd'),
      endDate: format(targetDate, 'yyyy-MM-dd'),
      time: '',
      arrivalTime: '',
      reason: '',
      subReason: '',
      customReason: '',
      customSubReason: ''
    });
    setIsModalOpen(true);
  };

  // Função para submeter a solicitação
  const submitRequest = async () => {
    if (!user) {
      toast.error('Erro: Usuário não autenticado.');
      return;
    }

    if (!formData.startDate || !formData.reason || 
        (requestType === 'early-departure' && !formData.time) ||
        (requestType === 'lateness' && !formData.arrivalTime)) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Verificar se a data não é passada
    const today = new Date();
    const startDate = new Date(formData.startDate);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      toast.error('Não é possível criar solicitações para datas passadas.');
      return;
    }

    // Verificar se a data de fim é anterior à data de início
    if (requestType === 'time-off' && formData.endDate) {
      const endDate = new Date(formData.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (endDate < startDate) {
        toast.error('A data de fim não pode ser anterior à data de início.');
        return;
      }
    }

    // Verificar se há feriados/eventos que bloqueiam solicitações de folga
    if (requestType === 'time-off') {
      const { checkBlockedDates } = await import('@/utils/holiday-validation');
      const startDateStr = formData.startDate;
      const endDateStr = formData.endDate || formData.startDate;
      
      const blockCheck = await checkBlockedDates(user.id, startDateStr, endDateStr);
      
      if (blockCheck.isBlocked && blockCheck.blockedDate) {
        toast.error(`Não é possível solicitar folga em ${format(new Date(blockCheck.blockedDate.date), 'dd/MM/yyyy', { locale: ptBR })} devido ao feriado/evento: ${blockCheck.blockedDate.name}`);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Preparar dados para envio
      let mainReason = formData.reason;
      let subReason = formData.subReason;
      
      // Se o motivo principal for "Outros", usar o campo personalizado
      if (formData.reason === 'Outros' && formData.customReason.trim()) {
        mainReason = formData.customReason.trim();
      }
      
      // Se a subcategoria for "Outros", usar o campo personalizado
      if (formData.subReason === 'Outros' && formData.customSubReason.trim()) {
        subReason = formData.customSubReason.trim();
      }
      
      const finalReason = subReason 
        ? `${mainReason} - ${subReason}`
        : mainReason;
        
      const requestData = {
        type: requestType,
        start_date: formData.startDate,
        end_date: requestType === 'time-off' ? formData.endDate : null,
        time: requestType === 'early-departure' ? formData.time : null,
        arrival_time: requestType === 'lateness' ? formData.arrivalTime : null,
        reason: finalReason,
        user_id: user.id,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      // Usar a função saveRequest que tem validação de turno da manhã
      const { saveRequest } = await import('@/integrations/supabase/client');
      const result = await saveRequest(requestData);

      if (!result.success) {
        if (result.code === 'MORNING_SHIFT_REQUIRED') {
          toast.error('Apenas funcionários do turno da manhã podem solicitar folgas no momento.');
        } else if (result.code === 'DAILY_LIMIT_EXCEEDED') {
          toast.error('Limite de folgas atingido para esta data.');
        } else if (result.code === 'INSUFFICIENT_ADVANCE_NOTICE') {
          toast.error('Folgas devem ser solicitadas com pelo menos 2 dias de antecedência.');
        } else {
          toast.error(result.error || 'Erro ao enviar solicitação.');
        }
        return;
      }

      const requestTypeLabel = requestType === 'time-off' ? 'folga' : 
                              requestType === 'early-departure' ? 'saída antecipada' : 'atraso';
      toast.success(`Solicitação de ${requestTypeLabel} enviada com sucesso!`);
      
      // Resetar formulário e fechar modal
      setFormData({
        startDate: '',
        endDate: '',
        time: '',
        arrivalTime: '',
        reason: '',
        subReason: '',
        customReason: '',
        customSubReason: ''
      });
      setIsModalOpen(false);
      
      // Recarregar dados do calendário
      const requestsResult = await loadAllRequests();
      if (requestsResult.success && requestsResult.data) {
        const approvedRequests = requestsResult.data
          .filter(req => req.status === 'approved')
          .map(req => ({
            id: req.id,
            type: req.type,
            status: req.status,
            start_date: req.date || req.start_date,
            end_date: req.endDate || req.end_date || req.date,
            reason: req.reason,
            user_id: req.user_id,
            userName: req.userName,
            factory_id: req.factory_id || '1'
          }));
        
        setRequests(approvedRequests);
      }
      
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para atualizar campo do formulário
  const updateFormField = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se estamos atualizando startDate e é uma solicitação de folga,
      // atualizar endDate para não ser anterior à startDate
      if (field === 'startDate' && requestType === 'time-off') {
        const startDate = new Date(value);
        const endDate = new Date(prev.endDate);
        
        if (endDate < startDate) {
          newData.endDate = value;
        }
      }
      
      // Se estamos atualizando o motivo principal, limpar a subcategoria e campos personalizados
      if (field === 'reason') {
        newData.subReason = '';
        newData.customReason = '';
        newData.customSubReason = '';
      }
      
      // Se estamos atualizando a subcategoria, limpar o campo personalizado da subcategoria
      if (field === 'subReason') {
        newData.customSubReason = '';
      }
      
      return newData;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando calendário...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Calendário de Eventos</h1>
            <p className="text-muted-foreground">Visualize todos os eventos aprovados</p>
          </div>
          
          {/* Botões de Solicitação */}
          {hasPermission('createRequest') && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => openRequestModal('time-off')}
                className="flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Solicitar Folga
              </Button>
              <Button
                variant="outline"
                onClick={() => openRequestModal('early-departure')}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Saída Antecipada
              </Button>
              <Button
                variant="outline"
                onClick={() => openRequestModal('lateness')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Atraso
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 lg:items-center">
                  {/* Filtro de Fábrica */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Fábrica:</label>
                    <select
                      value={selectedFactory}
                      onChange={(e) => setSelectedFactory(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">Todas as Fábricas</option>
                      {factories.map(factory => (
                        <option key={factory.id} value={factory.id}>
                          {factory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {/* Botões de visualização */}
                    <div className="flex gap-1 mr-4">
                      <Button
                        variant={viewMode === 'day' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('day')}
                      >
                        Dia
                      </Button>
                      <Button
                        variant={viewMode === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                      >
                        Mês
                      </Button>
                    </div>
                    
                    {/* Navegação de mês */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-sm font-medium p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((day, index) => {
                  // Lidar com dias vazios
                  if (day === null) {
                    const weekNumber = Math.floor(index / 7);
                    const isDarkWeek = isWeekDark(weekNumber);
                    
                    return (
                      <div
                        key={`empty-${index}`}
                        className={`
                          relative p-2 min-h-[60px] border rounded
                          ${isDarkWeek ? 'bg-slate-200/80' : 'bg-background/30'}
                          border-border
                        `}
                      ></div>
                    );
                  }
                  
                  const dayEvents = day ? getRequestsForDate(day) : [];
                  const isSelected = day ? isSameDay(day, selectedDate) : false;
                  const weekNumber = Math.floor(index / 7);
                  const isDarkWeek = isWeekDark(weekNumber);
                  const isBlocked = day ? isDateBlocked(day) : false;
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        relative p-2 min-h-[60px] border rounded cursor-pointer transition-colors
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : isBlocked
                            ? 'bg-red-500/80 hover:bg-red-500/90 text-white' 
                            : isDarkWeek 
                              ? 'bg-slate-200/80 hover:bg-slate-200/95' 
                              : 'bg-background/30 hover:bg-background/50'
                        }
                        ${day ? hasEvents(day) ? 'border-primary' : 'border-border' : 'border-border'}
                        ${isBlocked ? 'border-red-600' : ''}
                      `}
                      onClick={() => day && setSelectedDate(day)}
                      title={isBlocked ? 'Indisponível para solicitações de folga' : ''}
                    >
                      <div className="text-sm font-medium">
                        {day ? format(day, 'd') : ''}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {day && dayEvents.slice(0, 3).map((event, index) => {
                          return (
                            <div
                              key={`${event.id}-${index}`}
                              className={`w-2 h-2 rounded-full ${getEventColor(event.type)}`}
                              title={formatEventText(event.userName || '', event.type)}
                            />
                          );
                        })}
                        {day && dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            
            {/* Legenda de Cores */}
            <div className="px-6 pb-6">
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Legenda:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Folgas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Faltas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Saída</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Atrasos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Eventos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-sm">Indisponível</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Detalhes do Dia Selecionado ou Eventos do Mês */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {viewMode === 'day' 
                    ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                    : `Eventos de ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`
                  }
                </CardTitle>
                

              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {viewMode === 'day' ? (
                  // Visualização por dia
                  getRequestsForDate(selectedDate).length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Nenhum evento neste dia
                    </p>
                  ) : (
                    getRequestsForDate(selectedDate).map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                          <Badge variant="secondary">
                            {getEventLabel(event.type)}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatEventText(event.userName || '', event.type)}
                          </div>
                          {event.reason && (
                            <div className="text-muted-foreground mt-1">
                              {event.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  // Visualização do mês inteiro
                  (() => {
                    const monthEvents = getDaysInMonth()
                      .filter(day => day !== null) // Filtrar dias null
                      .flatMap(day => 
                        getRequestsForDate(day).map(event => ({
                          ...event,
                          date: day
                        }))
                      )
                      .sort((a, b) => {
                        const dateA = new Date(a.start_date || a.date || '');
                        const dateB = new Date(b.start_date || b.date || '');
                        
                        // Verificar se as datas são válidas antes de comparar
                        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                          return 0;
                        }
                        
                        return dateA.getTime() - dateB.getTime();
                      });

                    return monthEvents.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Nenhum evento neste mês
                      </p>
                    ) : (
                      monthEvents.map((event, index) => (
                        <div
                          key={`${event.id}-${index}`}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                              <Badge variant="secondary">
                                {getEventLabel(event.type)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {safeFormatDate(event.date, 'dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatEventText(event.userName || '', event.type)}
                            </div>
                            {event.reason && (
                              <div className="text-muted-foreground mt-1">
                                {event.reason}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    );
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal de Solicitação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {requestType === 'time-off' ? 'Solicitar Folga' : 
               requestType === 'early-departure' ? 'Solicitar Saída Antecipada' : 'Registrar Atraso'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {requestType === 'lateness' ? 'Data do Atraso' : 'Data de Início'}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormField('startDate', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            
            {requestType === 'time-off' && (
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormField('endDate', e.target.value)}
                  min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
            )}
            
            {requestType === 'early-departure' && (
              <div className="space-y-2">
                <Label htmlFor="time">Horário de Saída</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => updateFormField('time', e.target.value)}
                  required
                />
              </div>
            )}
            
            {requestType === 'lateness' && (
              <div className="space-y-2">
                <Label htmlFor="arrivalTime">Horário de Chegada</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => updateFormField('arrivalTime', e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => updateFormField('reason', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {getReasonOptions(requestType).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo personalizado para quando "Outros" for selecionado como motivo principal */}
            {formData.reason === 'Outros' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Especifique o motivo</Label>
                <Textarea
                  id="customReason"
                  value={formData.customReason}
                  onChange={(e) => updateFormField('customReason', e.target.value)}
                  placeholder="Descreva o motivo específico..."
                  rows={2}
                  required
                />
              </div>
            )}

            {/* Campo de submotivo/subcategoria - aparece apenas se o motivo principal tiver subcategorias */}
            {formData.reason && hasSubReasons(requestType, formData.reason) && (
              <div className="space-y-2">
                <Label htmlFor="subReason">Especificar</Label>
                <Select
                  value={formData.subReason}
                  onValueChange={(value) => updateFormField('subReason', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especificação" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubReasonOptions(requestType, formData.reason).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Campo personalizado para quando "Outros" for selecionado na subcategoria */}
            {formData.subReason === 'Outros' && (
              <div className="space-y-2">
                <Label htmlFor="customSubReason">Especifique</Label>
                <Textarea
                  id="customSubReason"
                  value={formData.customSubReason}
                  onChange={(e) => updateFormField('customSubReason', e.target.value)}
                  placeholder="Descreva a especificação..."
                  rows={2}
                  required
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={submitRequest}
              disabled={isSubmitting || !formData.startDate || !formData.reason || 
                       (requestType === 'early-departure' && !formData.time) ||
                       (requestType === 'lateness' && !formData.arrivalTime)}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
