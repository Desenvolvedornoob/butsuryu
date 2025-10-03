import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Calendar, LogOut, Menu, X, CheckCircle, User, BarChart3, Monitor, Users, UserMinus, Building, UserCheck, Settings } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { UserPermissions } from '@/types/user';
import { useCustomTexts } from '@/hooks/useCustomTexts';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, currentLanguage } = useLanguage();
  const {
    user,
    signOut,
    hasPermission
  } = useAuth();
  const { getText, isLoading: textsLoading } = useCustomTexts();



  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [{
    name: textsLoading ? t('navbar.dashboard') : getText('navbar.dashboard', currentLanguage, t('navbar.dashboard')),
    path: '/dashboard',
    icon: <CheckCircle className="h-4 w-4 mr-2" />,
    public: false
  }, {
    name: textsLoading ? t('calendar.title') : getText('calendar.title', currentLanguage, t('calendar.title')),
    path: '/calendar',
    icon: <Calendar className="h-4 w-4 mr-2" />,
    public: false
  }, {
    name: textsLoading ? t('navbar.requests') : getText('navbar.requests', currentLanguage, t('navbar.requests')),
    path: '/requests',
    icon: <CheckCircle className="h-4 w-4 mr-2" />,
    public: false,
    adminOnly: true
  }, {
    name: textsLoading ? t('navbar.employees') : getText('navbar.employees', currentLanguage, t('navbar.employees')),
    path: '/employees',
    icon: <UserCheck className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canManageEmployees'
  }, {
    name: textsLoading ? t('navbar.factories') : getText('navbar.factories', currentLanguage, t('navbar.factories')),
    path: '/factories',
    icon: <Building className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canManageFactories'
  }, {
    name: textsLoading ? 'Grupos' : getText('groups.title', currentLanguage, 'Grupos'),
    path: '/groups',
    icon: <Users className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canManageShifts'
  }, {
    name: textsLoading ? t('navbar.data') : getText('navbar.data', currentLanguage, t('navbar.data')),
    path: '/data',
    icon: <BarChart3 className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canApproveLeaves'
  }, {
    name: textsLoading ? t('navbar.monitoring') : getText('navbar.monitoring', currentLanguage, t('navbar.monitoring')),
    path: '/monitoring',
    icon: <Monitor className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canApproveLeaves'
  }, {
    name: textsLoading ? 'Desligamentos' : getText('dismissals.title', currentLanguage, 'Desligamentos'),
    path: '/dismissals',
    icon: <UserMinus className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canApproveLeaves'
  }, {
    name: textsLoading ? t('navbar.myData') : getText('navbar.myData', currentLanguage, t('navbar.myData')),
    path: '/my-data',
    icon: <BarChart3 className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canViewOwnLeaves'
  }, {
    name: textsLoading ? 'Configurações' : getText('settings.title', currentLanguage, 'Configurações'),
    path: '/site-settings',
    icon: <Settings className="h-4 w-4 mr-2" />,
    public: false,
    requiredPermission: 'canManageEmployees'
  }, {
    name: textsLoading ? t('navbar.profile') : getText('navbar.profile', currentLanguage, t('navbar.profile')),
    path: '/profile',
    icon: <User className="h-4 w-4 mr-2" />,
    public: false
  }];

  const filteredNavItems = navItems.filter(item => {
    if (item.public) return true;
    if (!user) return false;
    if (item.adminOnly) {
      return user?.role === 'admin' || user?.role === 'superuser' || user?.role === 'observador';
    }
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission as keyof UserPermissions);
    }
    return true;
  });

  return <nav className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-8", scrolled || isMenuOpen ? "bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3" : "py-5")}>
      <div className="w-full flex items-center bg-transparent overflow-x-auto gap-4">
        <Link to="/" className="font-semibold text-xl flex items-center">
          <span className="bg-primary p-1 rounded mr-2 text-white font-normal text-base">OTICS 西尾</span>
          
        </Link>



        {/* Desktop menu - Menu items */}
        <div className="hidden md:flex space-x-1 items-center flex-1">
          {filteredNavItems.map(item => <Link key={item.path} to={item.path} className={cn("px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center whitespace-nowrap", location.pathname === item.path ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-100")}>
              {item.icon}
              {item.name}
            </Link>)}
        </div>

        {/* User actions - Sempre à direita */}
        <div className="hidden md:flex items-center ml-auto space-x-2 flex-shrink-0">
          {user ? (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={signOut} 
              className="rounded-md transition-all duration-200 text-slate-700 hover:text-red-600 hover:bg-red-50"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link 
              to="/auth" 
              className={cn("p-2 rounded-md transition-all duration-200 flex items-center", location.pathname === "/auth" ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-100")}
              title="Login"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6 text-slate-700" /> : <Menu className="h-6 w-6 text-slate-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && <div className="md:hidden absolute left-0 right-0 top-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 animate-slide-down">
          <div className="px-4 py-3 space-y-1 max-w-7xl mx-auto">
            {filteredNavItems.map(item => <Link key={item.path} to={item.path} className={cn("block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center", location.pathname === item.path ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-100")}>
                {item.icon}
                {item.name}
              </Link>)}
            
            {user ? (
              <Button 
                variant="ghost" 
                onClick={signOut} 
                className="w-full justify-start px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center text-slate-700 hover:text-red-600 hover:bg-red-50"
                title={textsLoading ? t('navbar.logout') : getText('navbar.logout', currentLanguage, t('navbar.logout'))}
              >
                <LogOut className="h-5 w-5 mr-3" />
                {textsLoading ? t('navbar.logout') : getText('navbar.logout', currentLanguage, t('navbar.logout'))}
              </Button>
            ) : (
              <Link to="/auth" className={cn("block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center", location.pathname === "/auth" ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-100")} title={textsLoading ? t('common.login') : getText('common.login', currentLanguage, t('common.login'))}>
                <User className="h-5 w-5 mr-3" />
                {textsLoading ? t('common.login') : getText('common.login', currentLanguage, t('common.login'))}
              </Link>
            )}
          </div>
        </div>}
    </nav>
};

export default Navbar;
