import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getText, isLoading: textsLoading } = useCustomTexts();
  const { currentLanguage } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 0.2
      }
    }
  };

  return (
    <section className="pt-28 pb-20 px-4 md:px-8">
      <motion.div 
        className="max-w-7xl mx-auto text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h5 className="inline-block text-sm uppercase tracking-wider font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            {textsLoading ? 'Simplifique a gestão do tempo' : getText('home.tagline', currentLanguage, 'Simplifique a gestão do tempo')}
          </h5>
        </motion.div>
        
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
          variants={itemVariants}
        >
          {textsLoading ? 'Gerencie folgas, saídas e atrasos com facilidade' : getText('home.title', currentLanguage, 'Gerencie folgas, saídas e atrasos com facilidade')}
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
          variants={itemVariants}
        >
          {textsLoading ? 'A solução elegante para gerenciar a disponibilidade da sua equipe, permitindo que você acompanhe folgas, saídas antecipadas e atrasos em um único lugar.' : getText('home.subtitle', currentLanguage, 'A solução elegante para gerenciar a disponibilidade da sua equipe, permitindo que você acompanhe folgas, saídas antecipadas e atrasos em um único lugar.')}
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          variants={itemVariants}
        >
          {user ? (
            <>
              <Button size="lg" onClick={() => navigate('/dashboard')} className="px-8 py-6">
                {textsLoading ? 'Acessar Dashboard' : getText('home.accessDashboard', currentLanguage, 'Acessar Dashboard')}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/calendar')} className="px-8 py-6">
                {textsLoading ? 'Ver Calendário' : getText('home.viewCalendar', currentLanguage, 'Ver Calendário')}
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => navigate('/auth')} className="px-8 py-6">
              {textsLoading ? 'Começar agora' : getText('home.getStarted', currentLanguage, 'Começar agora')}
            </Button>
          )}
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
        >
          <motion.div 
            className="glass-panel rounded-xl p-6 text-center"
            variants={cardVariants}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{textsLoading ? 'Solicitação de Folgas' : getText('home.leavesTitle', currentLanguage, 'Solicitação de Folgas')}</h3>
            <p className="text-muted-foreground">{textsLoading ? 'Solicite e acompanhe folgas com poucos cliques, facilitando o planejamento da sua equipe.' : getText('home.leavesDescription', currentLanguage, 'Solicite e acompanhe folgas com poucos cliques, facilitando o planejamento da sua equipe.')}</p>
          </motion.div>
          
          <motion.div 
            className="glass-panel rounded-xl p-6 text-center"
            variants={cardVariants}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <LogOut className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{textsLoading ? 'Saídas Antecipadas' : getText('home.earlyExitTitle', currentLanguage, 'Saídas Antecipadas')}</h3>
            <p className="text-muted-foreground">{textsLoading ? 'Registre saídas antecipadas de forma rápida e eficiente, mantendo todos informados.' : getText('home.earlyExitDescription', currentLanguage, 'Registre saídas antecipadas de forma rápida e eficiente, mantendo todos informados.')}</p>
          </motion.div>
          
          <motion.div 
            className="glass-panel rounded-xl p-6 text-center"
            variants={cardVariants}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">{textsLoading ? 'Registro de Atrasos' : getText('home.delaysTitle', currentLanguage, 'Registro de Atrasos')}</h3>
            <p className="text-muted-foreground">{textsLoading ? 'Documente atrasos de forma transparente, facilitando a comunicação e o acompanhamento.' : getText('home.delaysDescription', currentLanguage, 'Documente atrasos de forma transparente, facilitando a comunicação e o acompanhamento.')}</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
