import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomTexts } from '@/hooks/useCustomTexts';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { user } = useAuth();
  const { getText, isLoading: textsLoading } = useCustomTexts();
  const { currentLanguage } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col mt-20"
      >
        <Hero />
        
        <section className="py-16 bg-gradient-to-b from-white to-blue-50">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">{textsLoading ? 'Gerencie seu tempo com eficiência' : getText('home.sectionTitle', currentLanguage, 'Gerencie seu tempo com eficiência')}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              {textsLoading ? 'O TimeManager permite que você gerencie folgas, atrasos e saídas antecipadas de forma simples e eficiente.' : getText('home.sectionSubtitle', currentLanguage, 'O TimeManager permite que você gerencie folgas, atrasos e saídas antecipadas de forma simples e eficiente.')}
            </p>
            
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full font-medium px-8">
                  {textsLoading ? 'Acessar Dashboard' : getText('home.accessDashboard', currentLanguage, 'Acessar Dashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="rounded-full font-medium px-8">
                  {textsLoading ? 'Começar agora' : getText('home.getStarted', currentLanguage, 'Começar agora')}
                </Button>
              </Link>
            )}
          </div>
        </section>
      </motion.main>
      
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} {textsLoading ? 'OTICS TimeManager. Todos os direitos reservados.' : getText('home.footerCopyright', currentLanguage, 'OTICS TimeManager. Todos os direitos reservados.')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
