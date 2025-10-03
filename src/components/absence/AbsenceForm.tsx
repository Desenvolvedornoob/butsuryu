import React, { useEffect, useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { saveRequest } from '@/integrations/supabase/client';
import { User } from '@/types/user';
import { formatEmployeeName } from '@/utils/name-formatter';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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

const formSchema = z.object({
  date: z.date({
    required_error: "Por favor selecione uma data",
  }),
  reason: z.string().min(1, {
    message: "Por favor, selecione um motivo",
  }),
  subReason: z.string().optional(),
  employeeId: z.string().min(1, {
    message: "Por favor, selecione um funcionário",
  }),
  substituteId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AbsenceFormProps {
  onSuccess?: () => void;
}

const AbsenceForm: React.FC<AbsenceFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [substitutes, setSubstitutes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReason, setCurrentReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [customSubReason, setCustomSubReason] = useState<string>('');
  
  // Verificar se o usuário é admin ou superuser
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';

  // Função para obter opções de motivos para faltas
  const getAbsenceReasonOptions = () => {
    return ['Passando Mal', 'Família', 'Corpo', 'Doença', 'Outros'];
  };

  // Função para obter subcategorias baseadas no motivo principal para faltas
  const getAbsenceSubReasonOptions = (mainReason: string) => {
    const subOptionsMap: { [key: string]: string[] } = {
      'Passando Mal': ['Insolação', 'Tontura', 'Febre', 'Dor de cabeça', 'Barriga', 'Dor no corpo', 'Outros'],
      'Família': ['Esposa', 'Filhos', 'Morte'],
      'Corpo': ['Costa', 'Joelho', 'Mão', 'Outro'],
      'Doença': ['Resfriado', 'Corona', 'Influenza', 'Diarreia', 'Pedra no rim', 'Outros']
    };
    
    return subOptionsMap[mainReason] || [];
  };

  // Função para verificar se um motivo tem subcategorias
  const hasAbsenceSubReasons = (mainReason: string) => {
    return getAbsenceSubReasonOptions(mainReason).length > 0;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      subReason: "",
      substituteId: "",
    },
  });

  useEffect(() => {
    fetchEmployees();
    if (isAdmin) {
      fetchSubstitutes();
    }
  }, [isAdmin]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;

      const employeeData = data as User[];
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error("Não foi possível carregar a lista de funcionários");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;

      const substituteData = data as User[];
      setSubstitutes(substituteData);
    } catch (error) {
      console.error('Error fetching substitutes:', error);
      toast.error("Não foi possível carregar a lista de substitutos");
    }
  };

  async function onSubmit(values: FormValues) {
    try {
      // Exibir toast de carregamento
      const toastId = toast.loading("Registrando falta...");
      
      // Preparar dados para envio ao Supabase
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
      
      const finalReason = subReason 
        ? `${mainReason} - ${subReason}`
        : mainReason;
        
      const requestData = {
        type: 'absence' as const,
        user_id: values.employeeId,
        reason: finalReason,
        start_date: values.date.toISOString(),
        status: 'approved' as const, // Faltas são sempre aprovadas
        substitute_id: values.substituteId && values.substituteId !== 'none' ? values.substituteId : null
      };
      
      // Enviar para o Supabase
      const result = await saveRequest(requestData);
      
      if (result.success) {
        toast.success("Falta registrada com sucesso!", { id: toastId });
        
        // Manter backup no localStorage para compatibilidade
        const existingRequests = JSON.parse(localStorage.getItem('requests') || '[]');
        existingRequests.push({
          id: result.data?.id || Math.random().toString(36).substr(2, 9),
          ...values,
          type: 'absence',
          status: 'approved',
          created_at: new Date().toISOString()
        });
        localStorage.setItem('requests', JSON.stringify(existingRequests));
        
        // Disparar evento para atualizar outras janelas/componentes
        window.dispatchEvent(new Event('localStorageChange'));
        
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        // Se falhar no Supabase, salvar apenas no localStorage
        console.warn("Erro ao salvar no Supabase:", result.error);
        toast.dismiss(toastId);
        
        // Mock da resposta
        const mockResponse = {
          id: Math.random().toString(36).substr(2, 9),
          ...values,
          type: 'absence',
          status: 'approved',
          created_at: new Date().toISOString()
        };

        // Salvar no localStorage para persistir os dados
        const existingRequests = JSON.parse(localStorage.getItem('requests') || '[]');
        existingRequests.push(mockResponse);
        localStorage.setItem('requests', JSON.stringify(existingRequests));
        
        // Disparar evento para atualizar outras janelas/componentes
        window.dispatchEvent(new Event('localStorageChange'));
        
        toast.success("Falta registrada com sucesso! (Modo offline)");
        form.reset();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Erro ao registrar falta:', error);
      toast.error("Erro ao registrar falta. Tente novamente.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {formatEmployeeName(employee)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Falta</FormLabel>
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
                        format(field.value, "dd/MM/yyyy")
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
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo da Falta</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setCurrentReason(value);
                  // Limpar subcategoria e campos personalizados quando mudar o motivo principal
                  form.setValue('subReason', '');
                  setCustomReason('');
                  setCustomSubReason('');
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo da falta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getAbsenceReasonOptions().map((option) => (
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
        {currentReason && hasAbsenceSubReasons(currentReason) && (
          <FormField
            control={form.control}
            name="subReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especificar</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
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
                    {getAbsenceSubReasonOptions(currentReason).map((option) => (
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
        {currentReason && hasAbsenceSubReasons(currentReason) && form.watch('subReason') === 'Outros' && (
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
                        // Ordenar por prioridade: superuser → admin → funcionários
                        if (a.role === 'superuser' && b.role !== 'superuser') return -1;
                        if (a.role === 'admin' && b.role !== 'admin' && b.role !== 'superuser') return -1;
                        if (b.role === 'superuser' && a.role !== 'superuser') return 1;
                        if (b.role === 'admin' && a.role !== 'admin' && a.role !== 'superuser') return 1;
                        return a.first_name.localeCompare(b.first_name);
                      })
                      .map((substitute) => (
                        <SelectItem key={substitute.id} value={substitute.id}>
                          <div className="flex items-center gap-2">
                            {formatEmployeeName(substitute)}
                            {substitute.role === 'superuser' && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Superuser
                              </span>
                            )}
                            {substitute.role === 'admin' && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          Registrar Falta
        </Button>
      </form>
    </Form>
  );
};

export default AbsenceForm; 