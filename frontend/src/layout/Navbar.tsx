import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context';
import { Badge } from '../components/ui';
import type { Role } from '../types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, switchRole, logout } = useAuth();

  const handleRoleSwitch = (newRole: Role) => {
    switchRole(newRole);
    if (newRole === 'CUSTOMER') {
      navigate('/portal');
    } else if (location.pathname === '/portal') {
      navigate('/');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Dashboard';
    if (path === '/analytics') return 'Finance Lead Analytics';
    if (path === '/subscriptions') return 'Subscriptions';
    if (path === '/customers') return 'Customer Accounts';
    if (path === '/catalogue') return 'Products & Plans';
    if (path === '/quotations') return 'Quotations';
    if (path === '/invoices') return 'Invoices & Billing';
    if (path === '/payments') return 'Payments Engine';
    if (path === '/rules') return 'Taxes & Discounts';
    if (path === '/portal') return 'Customer Self-Service Portal';
    return path.replace('/', '').replace(/-/g, ' ');
  };

  const roleBadges: Record<Role, { variant: 'info' | 'purple' | 'success'; label: string }> = {
    ADMIN: { variant: 'purple', label: 'Admin' },
    STAFF: { variant: 'info', label: 'Staff' },
    CUSTOMER: { variant: 'success', label: 'Customer' },
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
          Brightloop
        </span>
        <span className="text-slate-300 hidden sm:inline">/</span>
        <h1 className="text-sm sm:text-base font-bold text-slate-900 capitalize tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Fast Role Switcher for Hackathon Demonstration */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200/60">
          <span className="text-slate-500 px-2 hidden md:flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider">
            <UserCheck className="h-3.5 w-3.5" />
            Switch View:
          </span>
          {(['ADMIN', 'STAFF', 'CUSTOMER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSwitch(r)}
              className={`px-2.5 py-1 rounded text-xs transition-all font-medium ${
                role === r
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-slate-800 block leading-tight">
              {user?.fullName || 'User'}
            </span>
            <div className="mt-0.5">
              <Badge variant={roleBadges[role].variant} size="sm" withDot>
                {roleBadges[role].label}
              </Badge>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
