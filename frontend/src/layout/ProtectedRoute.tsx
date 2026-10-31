import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import type { Role } from '../types';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If a customer tries to access admin views, redirect to customer portal
    if (role === 'CUSTOMER') {
      return <Navigate to="/portal" replace />;
    }
    // If staff/admin tries to access a route reserved for someone else, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};
