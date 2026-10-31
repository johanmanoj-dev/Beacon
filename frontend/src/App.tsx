import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck
} from 'lucide-react';
import api from './services/api';

// Navigation Item Definition
interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  role: ('ADMIN' | 'STAFF' | 'CUSTOMER')[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, role: ['ADMIN', 'STAFF'] },
  { name: 'Subscriptions', path: '/subscriptions', icon: Layers, role: ['ADMIN', 'STAFF'] },
  { name: 'Customers', path: '/customers', icon: Users, role: ['ADMIN', 'STAFF'] },
  { name: 'Products & Plans', path: '/catalogue', icon: Package, role: ['ADMIN'] },
  { name: 'Quotations', path: '/quotations', icon: FileText, role: ['ADMIN', 'STAFF'] },
  { name: 'Invoices', path: '/invoices', icon: Receipt, role: ['ADMIN', 'STAFF'] },
  { name: 'Payments', path: '/payments', icon: CreditCard, role: ['ADMIN', 'STAFF'] },
  { name: 'Taxes & Discounts', path: '/rules', icon: Percent, role: ['ADMIN'] },
  { name: 'Customer Portal', path: '/portal', icon: Shield, badge: 'Self-Service', role: ['CUSTOMER', 'ADMIN'] },
];

function AppLayout({ children, currentRole, onRoleChange, backendStatus }: {
  children: React.ReactNode;
  currentRole: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  onRoleChange: (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => void;
  backendStatus: { connected: boolean; message: string };
}) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              B
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Brightloop</span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">Subscription Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.role.includes(currentRole))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* System Health Status in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            {backendStatus.connected ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className={backendStatus.connected ? 'text-emerald-300' : 'text-amber-300'}>
              {backendStatus.connected ? 'Backend: MySQL Connected' : 'Backend: Standby'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block truncate">
            {backendStatus.message}
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Brightloop Platform</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800 capitalize">
              {location.pathname.replace('/', '') || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Role Switcher for Hackathon Demonstrations */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <span className="text-slate-500 px-2 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                Active View:
              </span>
              {(['ADMIN', 'STAFF', 'CUSTOMER'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onRoleChange(role)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    currentRole === role
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
              {currentRole[0]}
            </div>
          </div>
        </header>

        {/* Dynamic Route View Container */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Placeholder starter views for the 3 tracks
function DashboardOverview({ backendStatus }: { backendStatus: { connected: boolean; message: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Brightloop Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time metrics, active subscriptions, and cash flow status.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            backendStatus.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {backendStatus.connected ? 'MySQL Active' : 'Connecting...'}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Phase 0 Initialized
          </span>
        </div>
      </div>

      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Subscriptions', value: '142', change: '+12% this month' },
          { label: 'Monthly Recurring Revenue', value: '$28,450', change: '+8.4%' },
          { label: 'Pending Receivables', value: '$3,180', change: '5 invoices' },
          { label: 'Overdue Invoices', value: '2', change: 'Action required' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">{card.value}</div>
            <span className="text-xs text-slate-500 mt-1 block">{card.change}</span>
          </div>
        ))}
      </div>

      {/* Phase Status Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900">System Readiness Checklist (Phase 0)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800">Track 1: Johan</span>
            <p className="text-xs text-slate-500">Products, Variants (+560 bump), Plans, Quotes & Subscriptions.</p>
            <span className="text-xs text-blue-600 font-medium">Ready in /catalogue</span>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800">Track 2: Elsa</span>
            <p className="text-xs text-slate-500">Taxes, Discounts, Recurring Billing, Invoices & Payments.</p>
            <span className="text-xs text-blue-600 font-medium">Ready in /invoices</span>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800">Track 3: Goutham</span>
            <p className="text-xs text-slate-500">UI Shell, Design System, Customer Portal & KPI Analytics.</p>
            <span className="text-xs text-emerald-600 font-medium">Layout Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericModuleView({ title, description, track, assignedTo }: {
  title: string;
  description: string;
  track: string;
  assignedTo: string;
}) {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
          Assigned to: {assignedTo} ({track})
        </span>
      </div>
      <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-400">
        Module scaffolded. Dynamic database-backed views will render here.
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'CUSTOMER'>('ADMIN');
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    message: 'Checking local backend...',
  });

  useEffect(() => {
    api.get('/health')
      .then((res) => {
        setBackendStatus({
          connected: true,
          message: `${res.data.database || 'OK'} (${res.data.users_count ?? 0} users)`,
        });
      })
      .catch((err) => {
        setBackendStatus({
          connected: false,
          message: err.message || 'Cannot connect to http://localhost:8080/api/v1',
        });
      });
  }, []);

  return (
    <BrowserRouter>
      <AppLayout currentRole={role} onRoleChange={setRole} backendStatus={backendStatus}>
        <Routes>
          <Route path="/" element={<DashboardOverview backendStatus={backendStatus} />} />
          <Route
            path="/catalogue"
            element={
              <GenericModuleView
                title="Products, Variants & Plans Catalogue"
                description="Manage products, custom price variant adjustments, and billing frequency intervals."
                track="Track 1"
                assignedTo="Johan"
              />
            }
          />
          <Route
            path="/quotations"
            element={
              <GenericModuleView
                title="Quotation Templates & Quotes"
                description="Create quotation offers and convert confirmed quotes to active subscriptions."
                track="Track 1"
                assignedTo="Johan"
              />
            }
          />
          <Route
            path="/subscriptions"
            element={
              <GenericModuleView
                title="Subscriptions Management"
                description="Subscription lifecycle state machine (Active, Paused, Closed, Renewed)."
                track="Track 1"
                assignedTo="Johan"
              />
            }
          />
          <Route
            path="/invoices"
            element={
              <GenericModuleView
                title="Invoices & Recurring Billing"
                description="Automated billing engine, idempotent runs, and historical price snapshots."
                track="Track 2"
                assignedTo="Elsa"
              />
            }
          />
          <Route
            path="/payments"
            element={
              <GenericModuleView
                title="Payments & Gateway Simulator"
                description="Manual payment recording, partial payments, and simulated checkout flow."
                track="Track 2"
                assignedTo="Elsa"
              />
            }
          />
          <Route
            path="/rules"
            element={
              <GenericModuleView
                title="Taxes & Discount Rules"
                description="Admin-configured tax rates and volume/percentage discount rules."
                track="Track 2"
                assignedTo="Elsa"
              />
            }
          />
          <Route
            path="/customers"
            element={
              <GenericModuleView
                title="Customer Accounts"
                description="Customer directory and portal account linking."
                track="Track 1"
                assignedTo="Johan"
              />
            }
          />
          <Route
            path="/portal"
            element={
              <GenericModuleView
                title="Customer Self-Service Portal"
                description="Customers view their own subscriptions, invoices, and pay online."
                track="Track 3"
                assignedTo="Goutham"
              />
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
