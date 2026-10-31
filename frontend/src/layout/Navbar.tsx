import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserCheck, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context';
import { Badge } from '../components/ui';
import type { Role } from '../types';

export interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
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

  const activeBadge = (role && roleBadges[role]) ? roleBadges[role] : { variant: 'info' as const, label: role || 'User' };

  return (
    <header className="h-16 bg-white border-b border-[#E5DFD3] px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
      {/* Breadcrumb / Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-1.5 -ml-1 text-[#5A6D80] hover:text-[#101E2B] hover:bg-[#F5F0E6] rounded-lg md:hidden cursor-pointer"
            title="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="text-xs font-semibold text-[#7189A0] uppercase tracking-wider hidden sm:inline">
          Brightloop
        </span>
        <span className="text-[#C4D3E0] hidden sm:inline">/</span>
        <h1 className="text-sm sm:text-base font-bold text-[#101E2B] capitalize tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Fast Role Switcher */}
        <div className="flex items-center gap-1 bg-[#F5F0E6] p-1 rounded-lg text-xs font-medium border border-[#E5DFD3]">
          <span className="text-[#5A6D80] px-2 hidden md:flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider">
            <UserCheck className="h-3.5 w-3.5 text-[#2B4257]" />
            Switch View:
          </span>
          {(['ADMIN', 'STAFF', 'CUSTOMER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleSwitch(r)}
              className={`px-2.5 py-1 rounded text-xs transition-all font-medium cursor-pointer ${
                role === r
                  ? 'bg-[#2B4257] text-[#FAF7F0] shadow-xs font-bold'
                  : 'text-[#5A6D80] hover:text-[#101E2B] hover:bg-[#EAE3D6]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* User Info & Logout Button */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#E5DFD3]">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-[#101E2B] block leading-tight">
              {user?.fullName || 'User'}
            </span>
            <div className="mt-0.5">
              <Badge variant={activeBadge.variant} size="sm" withDot>
                {activeBadge.label}
              </Badge>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-[#7189A0] hover:text-rose-600 hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
