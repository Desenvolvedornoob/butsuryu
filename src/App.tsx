
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PrivateRoute } from '@/components/PrivateRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import '@/i18n';
import Index from "@/pages/Index";
import { Dashboard } from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

import Absence from "@/pages/Absence";
import Calendar from "@/pages/Calendar";
import Requests from "@/pages/Requests";
import Employees from "@/pages/Employees";
import Holidays from "@/pages/Holidays";
import Factories from "@/pages/Factories";

import Groups from "@/pages/Groups";
import TimeOff from "@/pages/TimeOff";
import EarlyDeparture from "@/pages/EarlyDeparture";
import Lateness from "@/pages/Lateness";
import Data from "@/pages/Data";
import MyData from "@/pages/MyData";
import Monitoring from "@/pages/Monitoring";
import Dismissals from "@/pages/Dismissals";
import Profile from "@/pages/Profile";
import SiteSettings from "@/pages/SiteSettings";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const HomeRoute = () => <Index />;

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<Auth />} />
        {/* Remove the standalone login and register routes since Auth component handles both */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/absence" element={
          <ProtectedRoute requiredPermission="canApproveLeaves">
            <Absence />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/time-off" element={
          <PrivateRoute>
            <TimeOff />
          </PrivateRoute>
        } />
        <Route path="/early-departure" element={
          <PrivateRoute>
            <EarlyDeparture />
          </PrivateRoute>
        } />
        <Route path="/lateness" element={
          <PrivateRoute>
            <Lateness />
          </PrivateRoute>
        } />
        <Route path="/requests" element={
          <ProtectedRoute requiredPermission="canApproveLeaves">
            <Requests />
          </ProtectedRoute>
        } />
        <Route path="/employees" element={
          <ProtectedRoute requiredPermission="canManageEmployees">
            <Employees />
          </ProtectedRoute>
        } />
        <Route path="/holidays" element={
          <ProtectedRoute requiredPermission="canManageFactories">
            <Holidays />
          </ProtectedRoute>
        } />
        <Route path="/factories" element={
          <ProtectedRoute requiredPermission="canManageFactories">
            <Factories />
          </ProtectedRoute>
        } />

        <Route path="/groups" element={
          <ProtectedRoute requiredPermission="canManageShifts">
            <Groups />
          </ProtectedRoute>
        } />
        <Route path="/data" element={
          <ProtectedRoute requiredPermission="canApproveLeaves">
            <Data />
          </ProtectedRoute>
        } />
        <Route path="/monitoring" element={
          <ProtectedRoute requiredPermission="canApproveLeaves">
            <Monitoring />
          </ProtectedRoute>
        } />
        <Route path="/dismissals" element={
          <ProtectedRoute requiredPermission="canApproveLeaves">
            <Dismissals />
          </ProtectedRoute>
        } />
        <Route path="/my-data" element={
          <ProtectedRoute requiredPermission="canViewOwnLeaves">
            <MyData />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/site-settings" element={
          <ProtectedRoute requiredPermission="canManageEmployees">
            <SiteSettings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppWithNavigate = () => {
  const navigate = useNavigate();
  
  return (
    <LanguageProvider>
      <AuthProvider navigate={navigate}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
          <AnimatedRoutes />
          <Toaster />
          <Sonner />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppWithNavigate />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
