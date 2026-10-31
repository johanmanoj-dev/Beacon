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
      setActionAlert({ message: err.message || 'Failed to confirm invoice', type: 'danger' });
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
      setActionAlert({ message: err.message || 'Failed to cancel invoice', type: 'danger' });
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
          className="font-mono font-bold text-[#2B4257] hover:underline cursor-pointer text-left"
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
          <p className="font-semibold text-[#101E2B]">{inv.customerName || `Customer #${inv.customerId}`}</p>
          <p className="text-[11px] text-[#7189A0] font-mono">{inv.subscriptionNumber || `Sub #${inv.subscriptionId}`}</p>
        </div>
      ),
    },
    {
      header: 'Billing Period',
      cell: (inv) => (
        <div className="text-[11px] text-[#5A6D80]">
          <span>{formatDate(inv.billingPeriodStart)}</span>
          <span className="text-[#889AA9] mx-1">→</span>
          <span>{formatDate(inv.billingPeriodEnd)}</span>
        </div>
      ),
    },
    {
      header: 'Total Billed',
      align: 'right',
      cell: (inv) => (
        <span className="font-mono font-semibold text-[#101E2B]">
          {formatCurrency(inv.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Amount Paid',
      align: 'right',
      cell: (inv) => (
        <span className="font-mono font-medium text-[#1E5638]">
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
            (inv.balanceDue ?? 0) > 0 ? 'text-[#8C4800]' : 'text-[#889AA9]'
          }`}
        >
          {formatCurrency(inv.balanceDue)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      cell: (inv) => (
        <span className="text-xs text-[#2B4257] font-medium">
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
            className="p-1 rounded text-[#5A6D80] hover:text-[#101E2B] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {inv.status === 'DRAFT' && (
            <button
              type="button"
              onClick={() => handleConfirmInvoice(inv.id)}
              className="px-2 py-0.5 text-[11px] rounded bg-[#E9EFF5] text-[#2B4257] hover:bg-[#D8E2EC] font-medium transition-colors cursor-pointer"
            >
              Confirm
            </button>
          )}

          {(inv.balanceDue ?? 0) > 0 && inv.status !== 'CANCELLED' && (
            <>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(inv)}
                className="px-2 py-0.5 text-[11px] rounded bg-[#EBF5EE] text-[#1E5638] hover:bg-[#DBEFE1] font-semibold transition-colors cursor-pointer"
                title="Staff Manual Settlement"
              >
                Pay
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForGateway(inv)}
                className="px-2 py-0.5 text-[11px] rounded bg-[#E9EFF5] text-[#2B4257] hover:bg-[#D8E2EC] font-semibold transition-colors cursor-pointer"
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
              className="p-1 rounded text-[#7189A0] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD3] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2B4257] text-[#FAF7F0] shadow-sm">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#101E2B] tracking-tight">
                Invoices & Recurring Billing
              </h1>
            </div>
            <p className="text-sm text-[#5A6D80] mt-0.5">
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
            className="text-xs"
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
              ? 'bg-[#EBF5EE] border-[#BDE3CA] text-[#1E5638]'
              : actionAlert.type === 'danger'
              ? 'bg-[#FDECEE] border-[#F8BFC7] text-[#93152A]'
              : 'bg-[#E9EFF5] border-[#C8D7E5] text-[#2B4257]'
          }`}
        >
          <span>{actionAlert.message}</span>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-[#7189A0] hover:text-[#101E2B] text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#7189A0] uppercase tracking-wider">Total Invoices</p>
          <p className="text-xl font-bold text-[#101E2B] mt-1">{kpis.totalInvoices}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#7189A0] uppercase tracking-wider">Total Billed</p>
          <p className="text-xl font-bold text-[#101E2B] mt-1">{formatCurrency(kpis.totalBilled)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#7189A0] uppercase tracking-wider">Total Collected</p>
          <p className="text-xl font-bold text-[#1E5638] mt-1">{formatCurrency(kpis.totalPaid)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#7189A0] uppercase tracking-wider">Outstanding Due</p>
          <p className="text-xl font-extrabold text-[#8C4800] mt-1">{formatCurrency(kpis.totalOutstanding)}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#7189A0] uppercase tracking-wider">Overdue Invoices</p>
          <p className="text-xl font-bold text-[#93152A] mt-1">{kpis.overdueCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5DFD3]">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'DRAFT', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#2B4257] text-[#FAF7F0] shadow-xs'
                  : 'text-[#5A6D80] hover:bg-[#F5F0E6]'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-[#7189A0] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-[#E5DFD3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4257] bg-[#FBF9F5] focus:bg-white text-[#101E2B]"
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
