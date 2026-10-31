import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Layers,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  Percent,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context';
import { Modal, Button } from '../components/ui';
import type { Role } from '../types';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  role: Role[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, role: ['ADMIN', 'STAFF'] },
  { name: 'Finance Analytics', path: '/analytics', icon: TrendingUp, role: ['ADMIN', 'STAFF'], badge: 'Finance Lead' },
  { name: 'Subscriptions', path: '/subscriptions', icon: Layers, role: ['ADMIN', 'STAFF'] },
  { name: 'Customers', path: '/customers', icon: Users, role: ['ADMIN', 'STAFF'] },
  { name: 'Products & Plans', path: '/catalogue', icon: Package, role: ['ADMIN'] },
  { name: 'Quotations', path: '/quotations', icon: FileText, role: ['ADMIN', 'STAFF'] },
  { name: 'Invoices', path: '/invoices', icon: Receipt, role: ['ADMIN', 'STAFF'] },
  { name: 'Payments', path: '/payments', icon: CreditCard, role: ['ADMIN', 'STAFF'] },
  { name: 'Taxes & Discounts', path: '/rules', icon: Percent, role: ['ADMIN'] },
  { name: 'Customer Portal', path: '/portal', icon: Shield, badge: 'Self-Service', role: ['CUSTOMER', 'ADMIN'] },
];

export interface SidebarProps {
  backendStatus: { connected: boolean; message: string };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ backendStatus, isMobileOpen = false, onCloseMobile }) => {
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const filteredNavItems = navItems.filter((item) => item.role.includes(role));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close mobile navigation backdrop"
          className="fixed inset-0 bg-[#101E2B]/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onCloseMobile?.();
            }
          }}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#182635] text-[#C4D3E0] flex flex-col border-r border-[#223447] shrink-0 select-none transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#223447]">
          <Link
            to={role === 'CUSTOMER' ? '/portal' : '/'}
            onClick={onCloseMobile}
            className="flex items-center gap-2.5"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#2B4257] to-[#486581] border border-[#3E5A73] flex items-center justify-center font-black text-[#FAF7F0] shadow-md text-base">
              B
            </div>
            <div>
              <span className="font-bold text-[#FAF7F0] text-base tracking-tight block">
                Brightloop
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-[#97ABBD]">
                Subscription Engine
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-md text-[#97ABBD] hover:text-[#FAF7F0] md:hidden cursor-pointer"
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-[#7189A0]">
            Main Navigation
          </div>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2B4257] text-[#FAF7F0] border border-[#3E5A73]/60 shadow-sm'
                    : 'text-[#C4D3E0] hover:bg-[#223447] hover:text-[#FAF7F0]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-[#FAF7F0]/15 text-[#FAF7F0] px-1.5 py-0.5 rounded font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Quick Logout */}
        <div className="p-3 border-t border-[#223447] bg-[#14202C]/60">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#223447]/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-[#2B4257] text-[#FAF7F0] border border-[#3E5A73] flex items-center justify-center text-xs font-bold shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[#FAF7F0] block truncate">
                  {user?.fullName || 'User'}
                </span>
                <span className="text-[10px] text-[#97ABBD] block truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded text-[#97ABBD] hover:text-rose-400 hover:bg-[#182635] transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* System Health Status in Sidebar Footer */}
        <div className="p-3.5 border-t border-[#223447] text-xs bg-[#14202C]/90">
          <div className="flex items-center gap-2">
            {backendStatus.connected ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
            <span
              className={`font-medium ${
                backendStatus.connected ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {backendStatus.connected ? 'MySQL Connected' : 'Backend Standby'}
            </span>
          </div>
          <span className="text-[11px] text-[#7189A0] mt-1 block truncate">
            {backendStatus.message}
          </span>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Sign Out"
        description="Are you sure you want to end your current session?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Log Out
            </Button>
          </div>
        }
      >
        <div className="py-2 text-sm text-[#5A6D80]">
          You are currently signed in as <strong className="text-[#101E2B]">{user?.fullName || user?.email || 'User'}</strong>. Any unsaved changes in progress may be lost upon logging out.
        </div>
      </Modal>
    </>
  );
};
