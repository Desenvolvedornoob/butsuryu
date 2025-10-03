import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import RequestForm from '@/components/RequestForm';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface TimeOffRequest {
  id: string;
  type: string;
  status: string;
  date: string;
  endDate?: string;
  reason: string;
}

const TimeOff = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  
  useEffect(() => {
    // Carregar solicitações do localStorage
    const loadRequests = () => {
      const savedRequests = JSON.parse(localStorage.getItem('requests') || '[]');
      const timeOffRequests = savedRequests.filter(req => req.type === 'time-off');
      setRequests(timeOffRequests);
    };

    loadRequests();
    
    // Atualizar quando houver mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'requests') {
        loadRequests();
      }
    };

    // Atualizar quando houver mudanças na mesma janela
    const handleLocalStorageChange = () => {
      loadRequests();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleLocalStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleLocalStorageChange);
    };
  }, []);
  
  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Solicitação de Folga</h1>
              <p className="text-muted-foreground">Preencha o formulário para solicitar um período de folga</p>
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
            <RequestForm 
              type="time-off" 
              onSuccess={() => {
                // Recarregar solicitações após envio bem-sucedido
                const savedRequests = JSON.parse(localStorage.getItem('requests') || '[]');
                setRequests(savedRequests.filter(req => req.type === 'time-off'));
              }}
            />
            
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Histórico de Solicitações</h2>
                <button
                  onClick={() => navigate('/requests')}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center"
                >
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {requests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="p-4 rounded-lg border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium">Solicitação de Folga</span>
                      </div>
                      <StatusBadge status={request.status as any} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(request.date), "yyyy-MM-dd", { locale: pt })}
                      {request.endDate && ` - ${format(new Date(request.endDate), "yyyy-MM-dd", { locale: pt })}`}
                    </p>
                    <p className="text-sm">{request.reason}</p>
                  </motion.div>
                ))}
                
                {requests.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Nenhuma solicitação de folga.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Informações Importantes</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                  <li>Solicitações devem ser feitas com pelo menos 3 dias de antecedência</li>
                  <li>Folgas aprovadas não podem ser canceladas no mesmo dia</li>
                  <li>O saldo de folgas é atualizado automaticamente</li>
                  <li>Entre em contato com RH para mais informações</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </>
  );
};

export default TimeOff;
