import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type EventType = 'time-off' | 'early-departure' | 'lateness' | 'absence' | 'holiday';

interface CalendarEvent {
  id: string;
  date: Date;
  endDate?: Date;
  type: EventType;
  status: 'pending' | 'approved' | 'rejected';
  employee?: string;
  reason: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const getEventColor = (type: EventType, status: string) => {
  if (status === 'rejected') return 'bg-red-100 border-red-300';
  if (status === 'pending') return 'bg-amber-100 border-amber-300';
  
  switch (type) {
    case 'time-off':
      return 'bg-blue-100 border-blue-300';
    case 'early-departure':
      return 'bg-green-100 border-green-300';
    case 'lateness':
      return 'bg-purple-100 border-purple-300';
    case 'absence':
      return 'bg-orange-100 border-orange-300';
    case 'holiday':
      return 'bg-green-100 border-green-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

const getEventLabel = (type: EventType) => {
  switch (type) {
    case 'time-off':
      return 'Folga';
    case 'early-departure':
      return 'Saída Antecipada';
    case 'lateness':
      return 'Atraso';
    case 'absence':
      return 'Falta';
    case 'holiday':
      return 'Feriado';
    default:
      return 'Evento';
  }
};

const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const startDay = getDay(monthStart);
  
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };
  
  // Função para calcular qual semana o dia pertence (baseado no primeiro dia do mês)
  const getWeekNumber = (day: Date, dayIndex: number) => {
    // Calcular baseado na posição no grid (incluindo dias vazios do início)
    const totalDaysFromStart = startDay + dayIndex;
    return Math.floor(totalDaysFromStart / 7);
  };
  
  // Função para determinar se a semana deve ter fundo escuro
  const isWeekDark = (weekNumber: number) => {
    return weekNumber % 2 === 1; // Semanas ímpares (1, 3, 5...) terão fundo escuro
  };
  
  const getDayEvents = (day: Date) => {
    return events.filter(event => {
      if (event.endDate) {
        const rangeStart = new Date(event.date);
        const rangeEnd = new Date(event.endDate);
        return day >= rangeStart && day <= rangeEnd;
      }
      return (
        day.getDate() === new Date(event.date).getDate() &&
        day.getMonth() === new Date(event.date).getMonth() &&
        day.getFullYear() === new Date(event.date).getFullYear()
      );
    });
  };
  
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, dateFormat, { locale: pt })}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
            className="h-8 text-xs"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="text-center py-2 text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        
        {Array.from({ length: startDay }).map((_, index) => {
          const weekNumber = Math.floor(index / 7);
          const isDarkWeek = isWeekDark(weekNumber);
          
          return (
            <div 
              key={`empty-${index}`} 
              className={cn(
                "h-28 border border-border/50 rounded-md",
                isDarkWeek ? "bg-slate-200/80" : "bg-background/30"
              )}
            ></div>
          );
        })}
        
        {days.map((day, i) => {
          const dayEvents = getDayEvents(day);
          const weekNumber = getWeekNumber(day, i);
          const isDarkWeek = isWeekDark(weekNumber);
          
          return (
            <div
              key={i}
              className={cn(
                "h-28 border border-border/50 rounded-md p-1 relative transition-colors",
                isToday(day) 
                  ? "bg-primary/10 border-primary/30" 
                  : isDarkWeek 
                    ? "bg-slate-200/80 hover:bg-slate-200/95" 
                    : "bg-background/30 hover:bg-background/50",
              )}
            >
              <span 
                className={cn(
                  "text-xs font-medium inline-block w-6 h-6 rounded-full text-center leading-6",
                  isToday(day) ? "bg-primary text-white" : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayEvents.map((event) => (
                  <TooltipProvider key={event.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "text-xs py-0.5 px-1.5 rounded border truncate cursor-pointer",
                            getEventColor(event.type, event.status)
                          )}
                          onClick={() => onEventClick && onEventClick(event)}
                        >
                          {event.employee || getEventLabel(event.type)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">{getEventLabel(event.type)}</p>
                          <p>{event.employee || 'Você'}</p>
                          <p>
                            {format(new Date(event.date), "dd/MM/yyyy")}
                            {event.endDate && ` - ${format(new Date(event.endDate), "dd/MM/yyyy")}`}
                          </p>
                          <p className="capitalize">
                            Status: {event.status === 'approved' ? 'Aprovado' : 
                              event.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
