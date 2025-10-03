
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPermissions } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: keyof UserPermissions;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if the user has the required permission
  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" state={{ from: location, requiredPermission }} replace />;
  }

  // If the user is authenticated and has the required permission, render the children
  return <>{children}</>;
}
