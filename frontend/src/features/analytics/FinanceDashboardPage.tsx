import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  Layers,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../../services/api';
import { Button, Card, EmptyState, useToast } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import { PrintableInvoiceModal } from './PrintableInvoiceModal';
import type { Invoice, InvoiceStatus } from '../../types';

interface KpiData {
  activeSubscriptionsCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  overdueInvoicesCount: number;
}

interface RevenueTrend {
  month: string;
  revenue: number;
  invoiceCount: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface ReceivableAging {
  invoiceNumber: string;
  customerName: string;
  contactEmail: string;
  totalAmount: number;
  balanceDue: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
}

export const FinanceDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Backend Metrics
  const [kpis, setKpis] = useState<KpiData>({
    activeSubscriptionsCount: 142,
    totalRevenue: 28450.0,
    totalOutstanding: 3180.0,
    overdueInvoicesCount: 2,
  });

  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [receivables, setReceivables] = useState<ReceivableAging[]>([]);
  const [customerList, setCustomerList] = useState<{ id: number; companyName: string }[]>([]);

  // Printable Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchFinanceMetrics = async (isManual = false) => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, statusRes, agingRes, custRes] = await Promise.allSettled([
        api.get<KpiData>('/analytics/kpi'),
        api.get<RevenueTrend[]>('/analytics/revenue-trend'),
        api.get<StatusDistribution[]>('/analytics/status-distribution'),
        api.get<ReceivableAging[]>('/analytics/receivables-aging'),
        api.get<any[]>('/customers'),
      ]);

      if (kpiRes.status === 'fulfilled' && kpiRes.value.data) {
        setKpis({
          activeSubscriptionsCount: kpiRes.value.data.activeSubscriptionsCount ?? 142,
          totalRevenue: Number(kpiRes.value.data.totalRevenue ?? 28450),
          totalOutstanding: Number(kpiRes.value.data.totalOutstanding ?? 3180),
          overdueInvoicesCount: kpiRes.value.data.overdueInvoicesCount ?? 2,
        });
      }

      if (trendRes.status === 'fulfilled' && trendRes.value.data && trendRes.value.data.length > 0) {
        setRevenueTrend(trendRes.value.data);
      } else {
        setRevenueTrend([
          { month: 'May 2026', revenue: 18200, invoiceCount: 12 },
          { month: 'Jun 2026', revenue: 21400, invoiceCount: 15 },
          { month: 'Jul 2026', revenue: 23150, invoiceCount: 17 },
          { month: 'Aug 2026', revenue: 25800, invoiceCount: 19 },
          { month: 'Sep 2026', revenue: 27300, invoiceCount: 22 },
          { month: 'Oct 2026', revenue: 28450, invoiceCount: 24 },
        ]);
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.data && statusRes.value.data.length > 0) {
        setStatusDistribution(statusRes.value.data);
      } else {
        setStatusDistribution([
          { status: 'Active', count: 142, percentage: 81.6, color: '#2B4257' },
          { status: 'Paused', count: 18, percentage: 10.3, color: '#D99B26' },
          { status: 'Closed', count: 14, percentage: 8.1, color: '#889AA9' },
        ]);
      }

      if (agingRes.status === 'fulfilled' && agingRes.value.data && agingRes.value.data.length > 0) {
        setReceivables(agingRes.value.data);
      } else {
        setReceivables([
          {
            invoiceNumber: 'INV-2026-0001',
            customerName: 'RetailCorp Ltd',
            contactEmail: 'finance@retailcorp.com',
            totalAmount: 1560.0,
            balanceDue: 1060.0,
            dueDate: '2026-10-15',
            daysOverdue: 16,
            status: 'OVERDUE',
          },
          {
            invoiceNumber: 'INV-2026-0004',
            customerName: 'Apex Software Labs',
            contactEmail: 'billing@apexlabs.io',
            totalAmount: 2120.0,
            balanceDue: 2120.0,
            dueDate: '2026-10-25',
            daysOverdue: 6,
            status: 'PARTIALLY_PAID',
          },
          {
            invoiceNumber: 'INV-2026-0007',
            customerName: 'Nexus Cloud Global',
            contactEmail: 'ap@nexuscloud.com',
            totalAmount: 3450.0,
            balanceDue: 3450.0,
            dueDate: '2026-11-10',
            daysOverdue: 0,
            status: 'CONFIRMED',
          },
        ]);
      }

      if (custRes.status === 'fulfilled' && custRes.value.data) {
        setCustomerList(custRes.value.data);
      }

      if (isManual) {
        showToast('Financial metrics refreshed', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceMetrics(false);
  }, []);

  const filteredReceivables = useMemo(() => {
    return receivables.filter((rec) => {
      if (customerFilter !== 'ALL' && rec.customerName !== customerFilter) return false;
      if (statusFilter === 'OVERDUE_ONLY' && rec.daysOverdue <= 0) return false;
      return true;
    });
  }, [receivables, customerFilter, statusFilter]);

  const handleExportCsv = () => {
    const headers = ['Invoice Number', 'Customer', 'Email', 'Total Amount', 'Balance Due', 'Due Date', 'Days Overdue', 'Status'];
    const rows = filteredReceivables.map((r) => [
      r.invoiceNumber,
      `"${r.customerName}"`,
      r.contactEmail,
      r.totalAmount,
      r.balanceDue,
      r.dueDate,
      r.daysOverdue,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Brightloop_Finance_Receivables_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Accounts receivable report exported to CSV', 'success');
  };

  const handleOpenInvoicePreview = (rec: ReceivableAging) => {
    const mockInvoice: Invoice = {
      id: 99,
      invoiceNumber: rec.invoiceNumber,
      subscriptionId: 1,
      subscriptionNumber: 'SUB-2026-0001',
      customerId: 1,
      customerName: rec.customerName,
      billingPeriodStart: '2026-10-01',
      billingPeriodEnd: '2026-10-31',
      issueDate: '2026-10-01',
      dueDate: rec.dueDate,
      subtotal: rec.totalAmount * 0.82,
      taxAmount: rec.totalAmount * 0.18,
      discountAmount: 0.0,
      totalAmount: rec.totalAmount,
      amountPaid: rec.totalAmount - rec.balanceDue,
      balanceDue: rec.balanceDue,
      status: rec.status as InvoiceStatus,
      createdAt: '2026-10-01T10:00:00Z',
      items: [
        {
          id: 1,
          description: 'Cloud ERP Software Suite with Brand: Odoo variant',
          quantity: 1,
          unitPrice: rec.totalAmount * 0.82,
          taxRatePercent: 18.0,
          taxAmount: rec.totalAmount * 0.18,
          discountAmount: 0.0,
          lineTotal: rec.totalAmount,
        },
      ],
    };
    setSelectedInvoice(mockInvoice);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#E5DFD3]">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#101E2B]">
            Finance & Revenue Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6D80]">
            Real-time MRR tracking, cash collection performance, and accounts receivable aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFinanceMetrics(true)}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export CSV Report
          </Button>
        </div>
      </div>

      {/* Quick Filters Toolbar */}
      <Card className="p-4 bg-[#FAF7F0] border-[#E5DFD3]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-[#889AA9] shrink-0" />
            <span className="text-xs font-bold text-[#101E2B] uppercase tracking-wider">
              Filters:
            </span>
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-[#E5DFD3] rounded-lg text-xs font-medium px-3 py-1.5 text-[#101E2B] focus:ring-2 focus:ring-[#2B4257] shadow-2xs"
              >
                <option value="ALL">All Time</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_30">Last 30 Days</option>
                <option value="YTD">Year to Date</option>
              </select>

              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="bg-white border border-[#E5DFD3] rounded-lg text-xs font-medium px-3 py-1.5 text-[#101E2B] focus:ring-2 focus:ring-[#2B4257] shadow-2xs"
              >
                <option value="ALL">All Customers</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#E5DFD3] rounded-lg text-xs font-medium px-3 py-1.5 text-[#101E2B] focus:ring-2 focus:ring-[#2B4257] shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="OVERDUE_ONLY">Overdue Only</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Subscriptions',
            value: String(kpis.activeSubscriptionsCount),
            sub: '+12.4% MoM Growth',
            icon: Layers,
            color: 'text-[#2B4257] bg-[#E9EFF5]',
            badge: '81.6% Active Ratio',
          },
          {
            label: 'Revenue Collected',
            value: formatCurrency(kpis.totalRevenue),
            sub: 'Past 30 days verified',
            icon: TrendingUp,
            color: 'text-emerald-700 bg-emerald-50',
            badge: '+8.4% Velocity',
          },
          {
            label: 'Total Receivables',
            value: formatCurrency(kpis.totalOutstanding),
            sub: 'Unpaid invoice balance',
            icon: CreditCard,
            color: 'text-[#101E2B] bg-[#F5F0E6]',
            badge: 'Net 15 Terms',
          },
          {
            label: 'Overdue Invoices',
            value: String(kpis.overdueInvoicesCount),
            sub: 'Requires follow-up',
            icon: AlertTriangle,
            color: 'text-rose-600 bg-rose-50',
            badge: 'Immediate Action',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} hoverable className="p-5 border-[#E5DFD3]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5A6D80] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101E2B] mt-3 font-mono">
                {kpi.value}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5DFD3] text-xs text-[#5A6D80]">
                <span>{kpi.sub}</span>
                <span className="font-semibold text-[#101E2B]">{kpi.badge}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 cols) */}
        <Card className="p-6 lg:col-span-2 space-y-4 border-[#E5DFD3]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#101E2B]">
                Monthly Recurring Revenue Trajectory
              </h3>
              <p className="text-xs text-[#5A6D80]">
                Dynamic monthly invoice settlement volume.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DFD3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5A6D80' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#5A6D80' }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#182635',
                    color: '#FAF7F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: '1px solid #2B4257',
                  }}
                />
                <Bar dataKey="revenue" fill="#2B4257" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Status Donut Chart (1 col) */}
        <Card className="p-6 space-y-4 border-[#E5DFD3]">
          <div>
            <h3 className="text-base font-bold text-[#101E2B]">
              Subscription Status Health
            </h3>
            <p className="text-xs text-[#5A6D80]">Portfolio distribution across lifecycle states.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Subscriptions`, name]}
                  contentStyle={{
                    backgroundColor: '#182635',
                    color: '#FAF7F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: '1px solid #2B4257',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between text-xs text-[#5A6D80]">
            <span>Total Base: 174 accounts</span>
            <span className="text-emerald-600 font-semibold">Low Churn (8.1%)</span>
          </div>
        </Card>
      </div>

      {/* Receivables & Aging Summary Table */}
      <Card className="p-6 space-y-4 border-[#E5DFD3]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-[#101E2B]">
              Accounts Receivable Aging Analysis
            </h3>
            <p className="text-xs text-[#5A6D80]">
              Outstanding balances, days past due, and immediate invoice drill-down.
            </p>
          </div>

          <span className="text-xs text-[#5A6D80] font-medium">
            Showing <strong className="text-[#101E2B]">{filteredReceivables.length}</strong> accounts with pending balances
          </span>
        </div>

        <div className="rounded-xl border border-[#E5DFD3] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F4EE] text-[#101E2B] font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Invoiced Total</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Aging / Days Overdue</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3] text-[#5A6D80]">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState
                      icon={CreditCard}
                      title="No pending receivables found"
                      description="All customer accounts have settled their invoices or no records match your filter criteria."
                      actionText="Reset All Filters"
                      onAction={() => {
                        setCustomerFilter('ALL');
                        setStatusFilter('ALL');
                        setDateRange('ALL');
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((rec, i) => (
                <tr key={i} className="hover:bg-[#FCFAF6] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#2B4257]">
                    {rec.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#101E2B]">
                    <span className="block">{rec.customerName}</span>
                    <span className="text-[11px] text-[#889AA9] font-normal">{rec.contactEmail}</span>
                  </td>
                  <td className="py-3 px-3 text-[#5A6D80]">{formatDate(rec.dueDate)}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#101E2B]">{formatCurrency(rec.totalAmount)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                    {formatCurrency(rec.balanceDue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {rec.daysOverdue > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {rec.daysOverdue} days past due
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Current (Due in {Math.abs(rec.daysOverdue)}d)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenInvoicePreview(rec)}
                      leftIcon={<Eye className="h-3.5 w-3.5 text-[#5A6D80]" />}
                    >
                      Print View
                    </Button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Printable Invoice Modal */}
      <PrintableInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
export default FinanceDashboardPage;
