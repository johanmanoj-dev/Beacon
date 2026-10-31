import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Play,
  Search,
  Eye,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import type { Invoice, InvoiceStatus } from '../../types';
import { Button, Badge, DataTable, type Column } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';
import { SimulatedGatewayModal } from './SimulatedGatewayModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RunBillingModal } from './RunBillingModal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isRunBillingOpen, setIsRunBillingOpen] = useState<boolean>(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForGateway, setSelectedInvoiceForGateway] = useState<Invoice | null>(null);

  // Live action alert
  const [actionAlert, setActionAlert] = useState<{ message: string; type: 'success' | 'info' | 'danger' } | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Invoice[]>('/invoices');
      setInvoices(res.data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleConfirmInvoice = async (id: number) => {
    try {
      await api.post(`/invoices/${id}/confirm`);
      setActionAlert({ message: `Invoice #${id} confirmed successfully!`, type: 'success' });
      fetchInvoices();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ message: err.response?.data?.message || 'Failed to confirm invoice', type: 'danger' });
    }
  };

  const handleCancelInvoice = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await api.post(`/invoices/${id}/cancel`);
      setActionAlert({ message: `Invoice #${id} cancelled.`, type: 'info' });
      fetchInvoices();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (err: any) {
      setActionAlert({ message: err.response?.data?.message || 'Failed to cancel invoice', type: 'danger' });
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      if (inv.status !== 'CANCELLED') {
        totalBilled += Number(inv.totalAmount || 0);
        totalPaid += Number(inv.amountPaid || 0);
        totalOutstanding += Number(inv.balanceDue || 0);
      }
      if (inv.status === 'OVERDUE') {
        overdueCount++;
      }
    }

    return {
      totalInvoices: invoices.length,
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueCount,
    };
  }, [invoices]);

  // Filtered dataset
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.subscriptionNumber && inv.subscriptionNumber.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [invoices, selectedStatus, searchQuery]);

  const renderStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm" withDot>PAID</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" size="sm" withDot>PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" size="sm" withDot>OVERDUE</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="sm" withDot>CONFIRMED</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral" size="sm">DRAFT</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (inv) => (
        <button
          type="button"
          onClick={() => setSelectedInvoiceForDetail(inv)}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
        >
          {inv.invoiceNumber}
        </button>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (inv) => (
        <div>
          <p className="font-semibold text-slate-900">{inv.customerName || `Customer #${inv.customerId}`}</p>
          <p className="text-[11px] text-slate-500 font-mono">{inv.subscriptionNumber || `Sub #${inv.subscriptionId}`}</p>
        </div>
      ),
    },
    {
      header: 'Billing Period',
      cell: (inv) => (
        <div className="text-[11px] text-slate-600">
          <span>{formatDate(inv.billingPeriodStart)}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span>{formatDate(inv.billingPeriodEnd)}</span>
        </div>
      ),
    },
    {
      header: 'Total Billed',
      align: 'right',
      cell: (inv) => (
        <span className="font-mono font-semibold text-slate-900">
          {formatCurrency(inv.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Amount Paid',
      align: 'right',
      cell: (inv) => (
        <span className="font-mono font-medium text-emerald-600">
          {formatCurrency(inv.amountPaid)}
        </span>
      ),
    },
    {
      header: 'Balance Due',
      align: 'right',
      cell: (inv) => (
        <span
          className={`font-mono font-bold ${
            inv.balanceDue > 0 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          {formatCurrency(inv.balanceDue)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (inv) => (
        <span className="text-xs text-slate-700 font-medium">
          {formatDate(inv.dueDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (inv) => renderStatusBadge(inv.status),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (inv) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedInvoiceForDetail(inv)}
            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {inv.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => handleConfirmInvoice(inv.id)}
              className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
            >
              Confirm
            </button>
          )}

          {inv.balanceDue > 0 && inv.status !== 'CANCELLED' && (
            <>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(inv)}
                className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-colors"
                title="Staff Manual Settlement"
              >
                Pay
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForGateway(inv)}
                className="px-2 py-0.5 text-[11px] rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-colors"
                title="Customer Gateway Simulator"
              >
                Simulate
              </button>
            </>
          )}

          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={() => handleCancelInvoice(inv.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Cancel Invoice"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Invoices & Recurring Billing
              </h1>
              <Badge variant="purple" size="sm">Track 2 • Elsa</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Automated recurring billing cycles, idempotent snapshot creation, and dual-track settlement engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchInvoices}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsRunBillingOpen(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Recurring Billing
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionAlert.type === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <span>{actionAlert.message}</span>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{kpis.totalInvoices}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Billed</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(kpis.totalBilled)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Collected</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(kpis.totalPaid)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</p>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{formatCurrency(kpis.totalOutstanding)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue Invoices</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{kpis.overdueCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DRAFT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Master DataTable */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No invoices match the selected filter."
      />

      {/* Modals */}
      <RunBillingModal
        isOpen={isRunBillingOpen}
        onClose={() => setIsRunBillingOpen(false)}
        onCompleted={fetchInvoices}
      />

      <RecordPaymentModal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
        onSuccess={fetchInvoices}
      />

      <SimulatedGatewayModal
        isOpen={!!selectedInvoiceForGateway}
        onClose={() => setSelectedInvoiceForGateway(null)}
        invoice={selectedInvoiceForGateway}
        onSuccess={fetchInvoices}
      />

      <InvoiceDetailModal
        isOpen={!!selectedInvoiceForDetail}
        onClose={() => setSelectedInvoiceForDetail(null)}
        invoice={selectedInvoiceForDetail}
        onOpenRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
        onOpenGateway={(inv) => setSelectedInvoiceForGateway(inv)}
      />
    </div>
  );
};

export default InvoicesPage;
