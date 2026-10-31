import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  CreditCard,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import api from './services/api';
import { AuthProvider } from './context';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './features/auth';
import { AppShell, ProtectedRoute } from './layout';
import { CataloguePage, CustomerListPage, QuotationsPage, SubscriptionsPage } from './features/catalogue';
import { CustomerPortalPage } from './features/portal';
import { FinanceDashboardPage } from './features/analytics';
import { InvoicesPage, PaymentsPage, BillingRulesPage } from './features/billing';
import {
  Button,
  Badge,
  Card,
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
      owner: 'Operations Admin',
      time: '10 mins ago',
    },
    {
      id: 2,
      module: 'Billing',
      action: '18% GST Tax Rule registered',
      status: 'CONFIRMED',
      owner: 'Billing Specialist',
      time: '25 mins ago',
    },
    {
      id: 3,
      module: 'Subscriptions',
      action: 'SUB-2026-0001 Monthly Pro billing interval set',
      status: 'ACTIVE',
      owner: 'Sales Specialist',
      time: '1 hour ago',
    },
    {
      id: 4,
      module: 'Invoices',
      action: 'INV-2026-0001 generated with price snapshot',
      status: 'PENDING',
      owner: 'Billing Lead',
      time: '2 hours ago',
    },
    {
      id: 5,
      module: 'Security',
      action: 'Live password policy compliance validator armed',
      status: 'CONFIRMED',
      owner: 'Security System',
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

      {/* System Audit Activity Stream */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Audit Activity Stream
            </h3>
            <p className="text-xs text-slate-500">
              Live audit stream of administrative actions, billing updates, and account events.
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
    </div>
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

          {/* Finance Analytics */}
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

          {/* Catalogue, Customers, Quotes & Subscriptions */}
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

          {/* Invoices, Payments & Rules */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <InvoicesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <AppShell backendStatus={backendStatus}>
                  <PaymentsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rules"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppShell backendStatus={backendStatus}>
                  <BillingRulesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Customer Portal */}
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
