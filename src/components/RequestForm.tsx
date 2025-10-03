import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { useAuth } from '@/contexts/AuthContext';
import { saveRequest } from '@/integrations/supabase/client';
import { supabase } from '@/lib/supabase';
import { formatEmployeeName } from '@/utils/name-formatter';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pt } from "date-fns/locale";

export type RequestType = 'time-off' | 'early-departure' | 'lateness' | 'absence';

export interface RequestFormProps {
  type: RequestType;
  onSuccess?: () => void;
}

// Define the base schema properties
const baseSchema = {
  date: z.date({
    required_error: "Por favor selecione uma data",
  }),
  reason: z.string().min(1, {
    message: "Por favor, selecione um motivo",
  }),
  subReason: z.string().optional(),
  employeeId: z.string().optional(),
  substituteId: z.string().optional(),
};

// Define schemas for each type
const timeOffSchema = z.object({
  ...baseSchema,
  endDate: z.date({
    required_error: "Por favor selecione a data final",
  }),
});

const earlyDepartureSchema = z.object({
  ...baseSchema,
  time: z.string().min(5, {
    message: "Por favor, informe o horário de saída",
  }),
});

const latenessSchema = z.object({
  ...baseSchema,
  arrivalTime: z.string().min(5, {
    message: "Por favor, informe o horário de chegada",
  }),
});

const absenceSchema = z.object({
  ...baseSchema,
  employeeId: z.string().min(1, {
    message: "Por favor, selecione um funcionário",
  }),
});

// Type definitions for each form type
type TimeOffFormValues = z.infer<typeof timeOffSchema>;
type EarlyDepartureFormValues = z.infer<typeof earlyDepartureSchema>;
type LatenessFormValues = z.infer<typeof latenessSchema>;
type AbsenceFormValues = z.infer<typeof absenceSchema>;
type FormValues = TimeOffFormValues | EarlyDepartureFormValues | LatenessFormValues | AbsenceFormValues;

const RequestForm: React.FC<RequestFormProps> = ({ type, onSuccess }) => {
  const { user, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [substitutes, setSubstitutes] = useState<{id: string, name: string, role: string}[]>([]);
  const [currentReason, setCurrentReason] = useState<string>('');
  const [currentSubReason, setCurrentSubReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [customSubReason, setCustomSubReason] = useState<string>('');
  const [hasManualEndDate, setHasManualEndDate] = useState(false);
  const isAdmin = hasPermission('canApproveLeaves') || user?.role === 'admin' || user?.role === 'superuser';
  
  useEffect(() => {
    // Reset da flag quando o componente é montado
    setHasManualEndDate(false);
    
    // Carregar a lista de funcionários se o usuário for admin
    if (isAdmin) {
      const loadEmployees = async () => {
        try {
          const { data: users, error } = await supabase
            .from('profiles')
            .select('id, first_name')
            .order('first_name', { ascending: true });
          
          if (error) throw error;
          
          setEmployees(users.map(user => ({
            id: user.id,
            name: formatEmployeeName(user)
          })));
        } catch (error) {
          console.error('Erro ao carregar funcionários:', error);
        }
      };
      
      loadEmployees();
    }

    // Carregar lista de substitutos para folgas se for admin
    if (isAdmin && type === 'time-off') {
      const loadSubstitutes = async () => {
        try {
          const { data: users, error } = await supabase
            .from('profiles')
            .select('id, first_name, role')
            .neq('status', 'inactive')
            .order('first_name', { ascending: true });
          
          if (error) throw error;
          
          setSubstitutes(users.map(user => ({
            id: user.id,
            name: formatEmployeeName(user),
            role: user.role || 'funcionario'
          })));
        } catch (error) {
          console.error('Erro ao carregar substitutos:', error);
        }
      };
      
      loadSubstitutes();
    }
  }, [isAdmin, type]);

  // Get the appropriate schema based on request type
  const getSchemaForType = () => {
    switch (type) {
      case 'time-off':
        return timeOffSchema;
      case 'early-departure':
        return earlyDepartureSchema;
      case 'lateness':
        return latenessSchema;
      case 'absence':
        return absenceSchema;
      default:
        return z.object({ ...baseSchema });
    }
  };

  // Função para obter opções de motivos baseadas no tipo de solicitação
  const getReasonOptions = (requestType: RequestType) => {
    const optionsMap = {
      'time-off': ['5 dias', 'Descanso', 'Viagem', 'Família', 'Particular', 'Outros'],
      'absence': ['Passando Mal', 'Família', 'Corpo', 'Doença', 'Outros'],
      'lateness': ['Família', 'Perdeu o horário', 'Veículo', 'Outros'],
      'early-departure': ['Compromisso', 'Família', 'Ruim', 'Outros']
    };
    
    return optionsMap[requestType] || [];
  };

  // Função para obter subcategorias baseadas no motivo principal
  const getSubReasonOptions = (requestType: RequestType, mainReason: string) => {
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
    
    return subOptionsMap[requestType]?.[mainReason] || [];
  };

  // Função para verificar se um motivo tem subcategorias
  const hasSubReasons = (requestType: RequestType, mainReason: string) => {
    return getSubReasonOptions(requestType, mainReason).length > 0;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(getSchemaForType()),
    defaultValues: {
      date: undefined,
      endDate: undefined,
      reason: "",
      subReason: "",
      time: "",
      arrivalTime: "",
      employeeId: "",
      substituteId: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      
      // Exibir toast de carregamento
      const toastId = toast.loading("Enviando solicitação...");
      
      // Obter ID do usuário do contexto de autenticação
      const userId = user?.id;
      
      if (!userId && !values.employeeId) {
        toast.error("Usuário não identificado. Faça login novamente.");
        return;
      }
      
      // Construir data final para envio (evitando problemas de timezone)
      const finalDate = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, '0')}-${String(values.date.getDate()).padStart(2, '0')}T00:00:00.000Z`;
      
      // Preparar dados para o formato esperado pelo Supabase
      const requestData: {
        type: RequestType;
        user_id: string;
        reason: string;
        start_date: string;
        end_date?: string;
        time?: string;
        arrival_time?: string;
        substitute_id?: string;
        status?: 'pending' | 'approved' | 'rejected';
      } = {
        type,
        user_id: values.employeeId || userId || '',
        reason: (() => {
          let mainReason = values.reason;
          let subReason = values.subReason;
          
          // Se o motivo principal for "Outros", usar o campo personalizado
          if (values.reason === 'Outros' && customReason.trim()) {
            mainReason = customReason.trim();
          }
          
          // Se a subcategoria for "Outros", usar o campo personalizado
          if (values.subReason === 'Outros' && customSubReason.trim()) {
            subReason = customSubReason.trim();
          }
          
          return subReason ? `${mainReason} - ${subReason}` : mainReason;
        })(),
        start_date: finalDate
      };
      
      // Adicionar campos específicos para cada tipo
      if (type === 'time-off' && 'endDate' in values) {
        requestData.end_date = values.endDate.toISOString();
        // Adicionar substituto se selecionado
        if (values.substituteId && values.substituteId !== '' && values.substituteId !== 'none') {
          requestData.substitute_id = values.substituteId;
        }
      } else if (type === 'early-departure' && 'time' in values) {
        requestData.time = values.time;
      } else if (type === 'lateness' && 'arrivalTime' in values) {
        requestData.arrival_time = values.arrivalTime;
      } else if (type === 'absence' && 'employeeId' in values) {
        // Para ausências, definimos o ID do funcionário selecionado
        requestData.user_id = values.employeeId;
        requestData.status = 'approved';
      }
      
      // Se for administrador criando uma solicitação para outro funcionário, aprová-la automaticamente
      if (isAdmin && values.employeeId && values.employeeId !== userId) {
        requestData.status = 'approved';
      }
      
      // Salvar no Supabase
      const result = await saveRequest(requestData);
      
      if (result.success) {
        toast.success(result.message || "Solicitação enviada com sucesso!", { id: toastId });
        form.reset();
        setHasManualEndDate(false);
        if (onSuccess) onSuccess();
      } else {
        // Verificar se é erro específico de turno da manhã, limite de folgas ou antecedência
        if (result.code === 'MORNING_SHIFT_REQUIRED') {
          toast.error(result.error || "Apenas funcionários do turno da manhã podem solicitar folgas no momento.", { id: toastId });
        } else if (result.code === 'DAILY_LIMIT_EXCEEDED') {
          toast.error(result.error || "Limite de folgas atingido para esta data.", { id: toastId });
        } else if (result.code === 'INSUFFICIENT_ADVANCE_NOTICE') {
          toast.error(result.error || "Folgas devem ser solicitadas com pelo menos 2 dias de antecedência.", { id: toastId });
        } else {
          toast.error("Erro ao enviar solicitação. Tente novamente.", { id: toastId });
        }
      }
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    }
  }

  const getFormTitle = () => {
    switch (type) {
      case 'time-off':
        return "Solicitar Folga";
      case 'early-departure':
        return "Solicitar Saída Antecipada";
      case 'lateness':
        return "Registrar Atraso";
      case 'absence':
        return "Registrar Falta";
      default:
        return "Formulário de Solicitação";
    }
  };

  const getFormDescription = () => {
    switch (type) {
      case 'time-off':
        return "Preencha o formulário para solicitar um período de folga.";
      case 'early-departure':
        return "Informe o dia e horário para sua saída antecipada.";
      case 'lateness':
        return "Registre um atraso informando a data e horário de chegada.";
      case 'absence':
        return "Registre a falta de um funcionário selecionando a data e motivo.";
      default:
        return "Complete todos os campos abaixo.";
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 md:p-8 w-full max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{getFormTitle()}</h2>
              <p className="text-sm text-muted-foreground">
                {getFormDescription()}
              </p>
            </div>
            
            {/* Campo de seleção de funcionário para admins */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Deixe em branco para solicitar para você mesmo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Campo de data */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data {type === 'time-off' ? 'inicial' : ''}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy", { locale: pt })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            
                            // Para time-off: define automaticamente a data final apenas se o usuário não selecionou manualmente
                            if (type === 'time-off' && date && !hasManualEndDate) {
                              // Para folga de 1 dia, a data final deve ser a mesma data inicial
                              form.setValue('endDate', new Date(date));
                            }
                          }}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de data final (apenas para folgas) */}
            {type === 'time-off' && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data final</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Para folga de 1 dia, a data final será igual à inicial. Para múltiplos dias, clique no calendário para alterar.
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: pt })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            setHasManualEndDate(true);
                            field.onChange(date);
                          }}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Campo de horário (apenas para saída antecipada) */}
            {type === 'early-departure' && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de saída</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          placeholder="Ex: 16:00"
                          {...field}
                          className="w-full"
                        />
                        <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Informe o horário desejado para saída.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Campo de horário (apenas para atrasos) */}
            {type === 'lateness' && (
              <FormField
                control={form.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de chegada</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          placeholder="Ex: 09:30"
                          {...field}
                          className="w-full"
                        />
                        <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Informe o horário estimado de chegada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Campo de motivo */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setCurrentReason(value);
                      // Limpar subcategoria e campos personalizados quando mudar o motivo principal
                      form.setValue('subReason', '');
                      setCurrentSubReason('');
                      setCustomReason('');
                      setCustomSubReason('');
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getReasonOptions(type).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo personalizado para quando "Outros" for selecionado como motivo principal */}
            {currentReason === 'Outros' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Especifique o motivo</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo específico..."
                  className="min-h-[80px] resize-none"
                  required
                />
              </div>
            )}

            {/* Campo de subcategoria - aparece apenas se o motivo principal tiver subcategorias */}
            {currentReason && hasSubReasons(type, currentReason) && (
              <FormField
                control={form.control}
                name="subReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especificar</FormLabel>
                    <Select 
                                          onValueChange={(value) => {
                      field.onChange(value);
                      setCurrentSubReason(value);
                      // Limpar campo personalizado da subcategoria quando mudar
                      setCustomSubReason('');
                    }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a especificação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getSubReasonOptions(type, currentReason).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Campo personalizado para quando "Outros" for selecionado na subcategoria */}
            {currentSubReason === 'Outros' && (
              <div className="space-y-2">
                <Label htmlFor="customSubReason">Especifique</Label>
                <Textarea
                  id="customSubReason"
                  value={customSubReason}
                  onChange={(e) => setCustomSubReason(e.target.value)}
                  placeholder="Descreva a especificação..."
                  className="min-h-[80px] resize-none"
                  required
                />
              </div>
            )}

            {/* Campo de substituto - apenas para admins */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="substituteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substituto (Opcional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um substituto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum substituto</SelectItem>
                        {substitutes
                          .sort((a, b) => {
                            // Primeiro superusers, depois admins, depois funcionários
                            const roleOrder = { superuser: 1, admin: 2, funcionario: 3 };
                            const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 4;
                            const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 4;
                            
                            if (aOrder !== bOrder) {
                              return aOrder - bOrder;
                            }
                            // Se mesmo role, ordernar por nome
                            return a.name.localeCompare(b.name);
                          })
                          .map((substitute) => (
                            <SelectItem key={substitute.id} value={substitute.id}>
                              <div className="flex items-center space-x-2">
                                <span>{substitute.name}</span>
                                {substitute.role === 'admin' && (
                                  <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Admin</span>
                                )}
                                {substitute.role === 'superuser' && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Super</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione um funcionário para cobrir durante a folga.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <Button type="submit" className="w-full">
            Enviar solicitação
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RequestForm;
