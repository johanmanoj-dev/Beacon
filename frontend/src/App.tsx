import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  Layers,
  AlertTriangle,
  Package,
} from 'lucide-react';
import api from './services/api';
import { AuthProvider } from './context';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './features/auth';
import { AppShell, ProtectedRoute } from './layout';
import { CataloguePage, CustomerListPage, QuotationsPage, SubscriptionsPage } from './features/catalogue';
import { CustomerPortalPage } from './features/portal';
import { FinanceDashboardPage, DemoScenarioModal } from './features/analytics';
import { BillingConfigPage } from './features/billing';
import {
  Button,
  Input,
  Badge,
  Select,
  Card,
  Modal,
  DataTable,
  ToastProvider,
  type Column,
} from './components/ui';
import { formatCurrency } from './lib/utils';

// Executive Dashboard Overview for Admin & Staff
function DashboardOverview({
  backendStatus,
}: {
  backendStatus: { connected: boolean; message: string };
}) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [kpis, setKpis] = useState({
    activeSubscriptionsCount: 142,
    totalRevenue: 28450,
    totalOutstanding: 3180,
    overdueInvoicesCount: 2,
  });

  useEffect(() => {
    api
      .get('/analytics/kpi')
      .then((res) => {
        if (res.data) {
          setKpis({
            activeSubscriptionsCount: res.data.activeSubscriptionsCount ?? 142,
            totalRevenue: Number(res.data.totalRevenue ?? 28450),
            totalOutstanding: Number(res.data.totalOutstanding ?? 3180),
            overdueInvoicesCount: res.data.overdueInvoicesCount ?? 2,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sample data to test DataTable component
  interface AuditItem {
    id: number;
    module: string;
    action: string;
    status: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'CONFIRMED';
    owner: string;
    time: string;
  }

  const sampleAuditItems: AuditItem[] = [
    {
      id: 1,
      module: 'Catalogue',
      action: 'Odoo Variant (+$560) base price configured',
      status: 'CONFIRMED',
      owner: 'Johan (Admin)',
      time: '10 mins ago',
    },
    {
      id: 2,
      module: 'Billing',
      action: '18% GST Tax Rule registered',
      status: 'CONFIRMED',
      owner: 'Elsa (Billing Lead)',
      time: '25 mins ago',
    },
    {
      id: 3,
      module: 'Subscriptions',
      action: 'SUB-2026-0001 Monthly Pro billing interval set',
      status: 'ACTIVE',
      owner: 'Johan',
      time: '1 hour ago',
    },
    {
      id: 4,
      module: 'Invoices',
      action: 'INV-2026-0001 generated with price snapshot',
      status: 'PENDING',
      owner: 'Elsa',
      time: '2 hours ago',
    },
    {
      id: 5,
      module: 'Security',
      action: 'Live password policy compliance validator armed',
      status: 'CONFIRMED',
      owner: 'Goutham (UI Lead)',
      time: 'Just now',
    },
    {
      id: 6,
      module: 'Receivables',
      action: 'RetailCorp account invoice balance due',
      status: 'OVERDUE',
      owner: 'Finance System',
      time: '1 day ago',
    },
  ];

  const auditColumns: Column<AuditItem>[] = [
    {
      header: 'Module',
      accessorKey: 'module',
      cell: (row) => (
        <span className="font-semibold text-slate-800">{row.module}</span>
      ),
    },
    {
      header: 'Event Description',
      accessorKey: 'action',
      cell: (row) => (
        <span className="text-slate-600 text-xs sm:text-sm">{row.action}</span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => {
        const variantMap = {
          ACTIVE: 'success',
          CONFIRMED: 'info',
          PENDING: 'warning',
          OVERDUE: 'danger',
        } as const;
        return (
          <Badge variant={variantMap[row.status]} size="sm" withDot>
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Operator',
      accessorKey: 'owner',
      cell: (row) => (
        <span className="text-xs text-slate-500 font-medium">{row.owner}</span>
      ),
    },
    {
      header: 'Time',
      accessorKey: 'time',
      align: 'right',
      cell: (row) => (
        <span className="text-xs text-slate-400 font-mono">{row.time}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Brightloop Executive Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time metrics, active subscriptions, and cash flow status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={backendStatus.connected ? 'success' : 'warning'}
            size="md"
            withDot
          >
            {backendStatus.connected ? 'MySQL Active' : 'Connecting DB...'}
          </Badge>
          <Link to="/analytics">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<TrendingUp className="h-3.5 w-3.5" />}
            >
              Finance Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScenarioModalOpen(true)}
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
          >
            Demo Guide & Seed DB
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDemoModalOpen(true)}
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-blue-600" />}
          >
            UI Kit Dialog Demo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Subscriptions',
            value: String(kpis.activeSubscriptionsCount),
            icon: Layers,
            sub: '+12% this month',
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Monthly Recurring Rev',
            value: formatCurrency(kpis.totalRevenue),
            icon: TrendingUp,
            sub: '+8.4% vs last period',
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'Pending Receivables',
            value: formatCurrency(kpis.totalOutstanding),
            icon: CreditCard,
            sub: 'Invoices awaiting settlement',
            color: 'text-amber-600 bg-amber-50',
          },
          {
            label: 'Overdue Invoices',
            value: String(kpis.overdueInvoicesCount),
            icon: AlertTriangle,
            sub: 'Action required (Net 15)',
            color: 'text-rose-600 bg-rose-50',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} hoverable className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-3 font-mono">
                {kpi.value}
              </div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">
                {kpi.sub}
              </span>
            </Card>
          );
        })}
      </div>

      {/* Track & Phase Checklist Banner */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              System Architecture & Workstream Status
            </h2>
            <p className="text-xs text-slate-500">
              Strict compliance with rules.md (Local MySQL, zero cloud BaaS, modular segregation).
            </p>
          </div>
          <Badge variant="purple" size="sm">
            Phase 4: Integration & Seeding Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Track 1: Johan</span>
              <Badge variant="success" size="sm">Phase 3 Complete</Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auth backend, Products, Variants (+$560 Odoo bump), Plans, Quotes, Subscriptions lifecycle, and Customers.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <Link to="/catalogue" className="text-xs font-semibold text-blue-600 hover:underline">
                Open Catalogue →
              </Link>
              <Link to="/subscriptions" className="text-xs font-semibold text-blue-600 hover:underline">
                Subscriptions →
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Track 2: Elsa</span>
              <Badge variant="neutral" size="sm">Billing & Pay</Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Taxes, Discount rules, Recurring billing engine with idempotency & snapshot tables, Dual payment processing.
            </p>
            <div className="pt-1">
              <Link to="/invoices" className="text-xs font-semibold text-blue-600 hover:underline">
                View Invoicing Module →
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950">Track 3: Goutham</span>
              <Badge variant="success" size="sm">Phase 5 Complete</Badge>
            </div>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Design System UI, Mobile Responsive Shell, Customer Portal, Empty States & Toasts, Finance Analytics, PDF Invoice Engine, and Pitch Rehearsal Navigator.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <Link to="/analytics" className="text-xs font-semibold text-blue-700 hover:underline">
                Finance Analytics →
              </Link>
              <Link to="/portal" className="text-xs font-semibold text-blue-700 hover:underline">
                Customer Portal →
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Reusable DataTable Component Showcase */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Audit Activity Stream
            </h3>
            <p className="text-xs text-slate-500">
              Powered by Goutham's dynamic DataTable component with live search and pagination.
            </p>
          </div>
        </div>

        <DataTable
          columns={auditColumns}
          data={sampleAuditItems}
          searchPlaceholder="Search audit events, operators, or modules..."
          searchKeys={['module', 'action', 'owner', 'status']}
          defaultPageSize={5}
        />
      </Card>

      {/* Modal Dialog Demo */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Interactive UI Dialog Test"
        description="Goutham's UI kit modal with backdrop, smooth transition, and form controls."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDemoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsDemoModalOpen(false)}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-600">
            This dialog demonstrates how modals in Brightloop are constructed with accessible keyboard escape handling, click-outside detection, and standardized action buttons.
          </p>
          <Input
            label="Sample Input with Validation"
            placeholder="Type anything here..."
            helperText="Form elements integrate seamlessly into dialog overlays."
          />
          <Select
            label="Sample Selection Field"
            options={[
              { label: 'Option A: High Priority', value: 'high' },
              { label: 'Option B: Standard Priority', value: 'standard' },
              { label: 'Option C: Low Priority', value: 'low' },
            ]}
          />
        </div>
      </Modal>

      {/* Demo Scenarios & Seeder Modal */}
      <DemoScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </div>
  );
}

// Module View Placeholder for remaining Phase 2/3 tracks
function GenericModuleView({
  title,
  description,
  track,
  assignedTo,
  badgeText,
}: {
  title: string;
  description: string;
  track: string;
  assignedTo: string;
  badgeText?: string;
}) {
  return (
    <Card className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            {badgeText && (
              <Badge variant="info" size="sm">
                {badgeText}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            {track}
          </Badge>
          <Badge variant="neutral" size="md">
            Owner: {assignedTo}
          </Badge>
        </div>
      </div>

      <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50/50 space-y-3">
        <Package className="h-10 w-10 text-slate-400 mx-auto stroke-[1.5]" />
        <h4 className="text-base font-bold text-slate-700">Module Workspace Ready</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          This feature module is reserved for {assignedTo}. Goutham has initialized the layout, navigation routing, and design system components.
        </p>
      </div>
    </Card>
  );
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    message: 'Checking local backend...',
  });

  useEffect(() => {
    api
      .get('/health')
      .then((res) => {
        setBackendStatus({
          connected: true,
          message: `${res.data.database || 'MySQL Active'} (${res.data.users_count ?? 0} users)`,
        });
      })
      .catch((err) => {
        setBackendStatus({
          connected: false,
          message: err.message || 'Cannot reach http://localhost:8080/api/v1',
        });
      });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Application Routes with AppShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <DashboardOverview backendStatus={backendStatus} />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Goutham's Phase 3: Finance Lead Executive Analytics */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <FinanceDashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Johan's Features: Catalogue, Customers, Quotes & Subscriptions */}
          <Route
            path="/catalogue"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <CataloguePage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <CustomerListPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quotations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <QuotationsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <SubscriptionsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Elsa's Features: Invoices, Payments & Rules */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <GenericModuleView
                    title="Invoices & Recurring Billing Engine"
                    description="Automated billing runs, idempotent line snapshots, and invoice status transitions."
                    track="Track 2"
                    assignedTo="Elsa"
                    badgeText="Elsa Workspace"
                  />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <GenericModuleView
                    title="Payments Engine & Gateway Simulator"
                    description="Record manual staff payments, balance calculation, and simulated gateway checkout."
                    track="Track 2"
                    assignedTo="Elsa"
                    badgeText="Elsa Workspace"
                  />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rules"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppShell backendStatus={backendStatus}>
                  <BillingConfigPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Goutham's Customer Portal */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <AppShell backendStatus={backendStatus}>
                  <CustomerPortalPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
