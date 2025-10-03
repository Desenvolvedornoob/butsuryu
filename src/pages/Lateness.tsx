
import React from 'react';
import Navbar from '@/components/Navbar';
import AnimatedTransition from '@/components/AnimatedTransition';
import RequestForm from '@/components/RequestForm';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';

// Mock data
const latenessRequests = [
  { id: 1, status: 'pending', date: new Date(), arrivalTime: '09:15', reason: 'Trânsito intenso' },
  { id: 2, status: 'approved', date: addDays(new Date(), -5), arrivalTime: '09:30', reason: 'Problema com transporte público' },
  { id: 3, status: 'approved', date: addDays(new Date(), -12), arrivalTime: '09:45', reason: 'Consulta médica de emergência' },
];

const Lateness = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Navbar />
      <AnimatedTransition className="pt-24 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Registro de Atraso</h1>
              <p className="text-muted-foreground">Informe quando chegar após o horário normal</p>
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
            <RequestForm type="lateness" />
            
            <div className="glass-panel rounded-xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Histórico de Atrasos</h2>
                <button
                  onClick={() => navigate('/requests')}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center"
                >
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {latenessRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="p-4 rounded-lg border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        <span className="font-medium">Registro de Atraso</span>
                      </div>
                      <StatusBadge status={request.status as any} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(request.date), "yyyy-MM-dd", { locale: pt })} chegada às {request.arrivalTime}
                    </p>
                    <p className="text-sm">{request.reason}</p>
                  </motion.div>
                ))}
                
                {latenessRequests.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Nenhum registro de atraso.</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Informações Importantes</h3>
                <ul className="text-sm text-purple-700 space-y-1 list-disc pl-5">
                  <li>Registre o atraso assim que chegar ao trabalho</li>
                  <li>Atrasos frequentes podem afetar sua avaliação de desempenho</li>
                  <li>Quando possível, avise seu gestor com antecedência</li>
                  <li>Forneça uma explicação clara do motivo do atraso</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AnimatedTransition>
    </>
  );
};

export default Lateness;
