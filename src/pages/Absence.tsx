import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ChevronRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/types/user';
import { formatEmployeeName } from '@/utils/name-formatter';

import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import StatusBadge from '@/components/StatusBadge';
import AbsenceForm from '@/components/absence/AbsenceForm';

interface AbsenceRequest {
  id: string;
  type: string;
  status: string;
  date: string;
  reason: string;
  employeeId: string;
}

export default function Absence() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [employees, setEmployees] = useState<Record<string, UserType>>({});
  
  useEffect(() => {
    // Verificar permissões
    if (!(user?.role === 'admin' || user?.role === 'superuser' || hasPermission('canApproveLeaves'))) {
      toast.error("Você não tem permissão para acessar esta página");
      navigate('/dashboard');
      return;
    }
    
    fetchEmployees();
    loadAbsenceRequests();
    
    // Atualizar quando houver mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'requests') {
        loadAbsenceRequests();
      }
    };

    // Atualizar quando houver mudanças na mesma janela
    const handleLocalStorageChange = () => {
      loadAbsenceRequests();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleLocalStorageChange);
    };
  }, [user, hasPermission, navigate]);
  
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('first_name', { ascending: true });

      if (error) throw error;

      const employeeData = data as UserType[];
      const employeeMap: Record<string, UserType> = {};
      
      employeeData.forEach(emp => {
        employeeMap[emp.id] = emp;
      });
      
      setEmployees(employeeMap);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error("Não foi possível carregar a lista de funcionários");
    }
  };
  
  const loadAbsenceRequests = () => {
    try {
      const savedRequests = JSON.parse(localStorage.getItem('requests') || '[]');
      const absences = savedRequests
        .filter((req: any) => req.type === 'absence')
        .sort((a: AbsenceRequest, b: AbsenceRequest) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
      setAbsenceRequests(absences);
    } catch (error) {
      console.error('Error loading absence requests:', error);
      toast.error("Erro ao carregar registros de faltas");
    }
  };
  
  const getEmployeeName = (employeeId: string) => {
    const employee = employees[employeeId];
    return employee ? formatEmployeeName(employee) : 'Funcionário não encontrado';
  };
  
  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Registro de Falta</h1>
              <p className="text-muted-foreground">Registre a falta de um funcionário</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-2">Registrar Falta</h2>
              <p className="text-muted-foreground mb-6">Selecione o funcionário e a data da falta.</p>
              
              <AbsenceForm onSuccess={loadAbsenceRequests} />
            </div>
            
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Registro de Faltas</h2>
                <button
                  onClick={() => navigate('/calendar')}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center"
                >
                  Calendário
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {absenceRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="p-4 rounded-lg border border-red-200 bg-red-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-red-600" />
                        <span className="font-medium">{getEmployeeName(request.employeeId)}</span>
                      </div>
                      <StatusBadge status={request.status as any} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(request.date), "dd/MM/yyyy", { locale: pt })}
                    </p>
                    <p className="text-sm">{request.reason}</p>
                  </motion.div>
                ))}
                
                {absenceRequests.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Nenhum registro de falta.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-sm font-medium text-red-800 mb-2">Informações Importantes</h3>
                <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                  <li>Registre a falta assim que tomar conhecimento</li>
                  <li>Faltas excessivas podem resultar em medidas disciplinares</li>
                  <li>Faltas com justificativa médica devem ser acompanhadas de atestado</li>
                  <li>As faltas ficam registradas no histórico do funcionário</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </>
  );
} 