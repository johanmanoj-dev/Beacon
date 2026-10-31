import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Printer,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { Button, Badge, Card, Modal, Input, DataTable, type Column } from '../../components/ui';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import type { Invoice, InvoiceStatus, Customer, Subscription } from '../../types';

interface BillingRunResponse {
  executionDate: string;
  targetCutoffDate: string;
  totalSubscriptionsScanned: number;
  invoicesGenerated: number;
  invoicesSkipped: number;
  totalAmountBilled: number;
  generatedInvoiceNumbers: string[];
  messages: string[];
}

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  // Modals & Active Selections
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Billing Run Form State
  const [targetCutoffDate, setTargetCutoffDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [forceBilling, setForceBilling] = useState<boolean>(false);
  const [isExecutingRun, setIsExecutingRun] = useState(false);
  const [lastBillingResult, setLastBillingResult] = useState<BillingRunResponse | null>(null);

  const fetchInvoicesAndData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [invRes, custRes, subRes] = await Promise.allSettled([
        api.get<Invoice[]>('/invoices'),
        api.get<Customer[]>('/customers'),
        api.get<Subscription[]>('/subscriptions'),
      ]);

      if (invRes.status === 'fulfilled' && invRes.value.data) {
        setInvoices(invRes.value.data);
      }
      if (custRes.status === 'fulfilled' && custRes.value.data) {
        setCustomers(custRes.value.data);
      }
      if (subRes.status === 'fulfilled' && subRes.value.data) {
        setSubscriptions(subRes.value.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesAndData();
  }, []);

  const handleExecuteBillingRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingRun(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        targetDate: targetCutoffDate || undefined,
        subscriptionId: selectedSubId ? Number(selectedSubId) : undefined,
        force: forceBilling,
      };

      const res = await api.post<BillingRunResponse>('/billing/run', payload);
      setLastBillingResult(res.data);
      setSuccessMessage(
        `Billing run complete: ${res.data.invoicesGenerated} invoices generated (${formatCurrency(res.data.totalAmountBilled)}), ${res.data.invoicesSkipped} skipped.`
      );
      setIsBillingModalOpen(false);
      await fetchInvoicesAndData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Billing run failed');
    } finally {
      setIsExecutingRun(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId: number) => {
    setActionLoadingId(invoiceId);
    setErrorMessage(null);
    try {
      await api.post(`/invoices/${invoiceId}/confirm`);
      setSuccessMessage('Invoice confirmed successfully.');
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => prev ? { ...prev, status: 'CONFIRMED' } : null);
      }
      await fetchInvoicesAndData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This action is permanent.')) {
      return;
    }
    setActionLoadingId(invoiceId);
    setErrorMessage(null);
    try {
      await api.post(`/invoices/${invoiceId}/cancel`);
      setSuccessMessage('Invoice cancelled successfully.');
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => prev ? { ...prev, status: 'CANCELLED', balanceDue: 0 } : null);
      }
      await fetchInvoicesAndData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPIs calculation
  const totalBilled = invoices.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + (Number(curr.balanceDue) || 0), 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  // Filtered invoices (status & customer dropdown)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
        return false;
      }
      if (customerFilter !== 'ALL' && String(inv.customerId) !== customerFilter) {
        return false;
      }
      return true;
    });
  }, [invoices, statusFilter, customerFilter]);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="info" size="sm" withDot>Confirmed</Badge>;
      case 'PAID':
        return <Badge variant="success" size="sm" withDot>Paid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" size="sm" withDot>Partial</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" size="sm" withDot>Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="sm" withDot>Cancelled</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="neutral" size="sm" withDot>Draft</Badge>;
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (row) => (
        <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">
            {row.customerName || 'Customer #' + row.customerId}
          </span>
          <span className="text-[11px] text-slate-400">
            Due: {formatDate(row.dueDate)}
          </span>
        </div>
      ),
    },
    {
      header: 'Subscription Cycle',
      accessorKey: 'subscriptionNumber',
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-700 block">
            {row.subscriptionNumber || 'SUB-DIRECT'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {formatDate(row.billingPeriodStart)} → {formatDate(row.billingPeriodEnd)}
          </span>
        </div>
      ),
    },
    {
      header: 'Total Amount',
      accessorKey: 'totalAmount',
      align: 'right',
      cell: (row) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Balance Due',
      accessorKey: 'balanceDue',
      align: 'right',
      cell: (row) => (
        <span
          className={cn(
            'font-mono font-bold',
            row.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
          )}
        >
          {formatCurrency(row.balanceDue)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'center',
      cell: (row) => getStatusBadge(row.status),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => {
        const isActionLoading = actionLoadingId === row.id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInvoice(row)}
              title="View Invoice Details"
              leftIcon={<Eye className="h-3.5 w-3.5" />}
            >
              Details
            </Button>
            {row.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirmInvoice(row.id)}
                disabled={isActionLoading}
                title="Confirm Invoice"
              >
                Confirm
              </Button>
            )}
            {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => handleCancelInvoice(row.id)}
                disabled={isActionLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Cancel Invoice"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200/60">
              Track 2 • Elsa
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active DB Connected
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            Invoices & Recurring Billing Engine
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated billing runs, idempotent line snapshots, and invoice status transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoicesAndData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBillingModalOpen(true)}
            leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
          >
            Run Billing Engine
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Invoiced Amount
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {formatCurrency(totalBilled)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {invoices.length} historical invoices
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
            Pending Receivables
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {formatCurrency(totalOutstanding)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Awaiting settlement by customers
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
            Settled Invoices
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {paidCount} Paid
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Zero balance outstanding
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
            Overdue Invoices
          </span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            {overdueCount} Overdue
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Exceeded Net 15 credit terms
          </span>
        </Card>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Billing Run Execution Log Banner (if recently executed) */}
      {lastBillingResult && (
        <Card className="p-5 border-blue-200 bg-blue-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Latest Billing Engine Execution Summary
            </div>
            <span className="text-xs text-blue-700 font-mono">
              Cutoff: {lastBillingResult.targetCutoffDate}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block">Scanned Contracts</span>
              <strong className="text-slate-800 text-sm">{lastBillingResult.totalSubscriptionsScanned}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block">Invoices Generated</span>
              <strong className="text-emerald-700 text-sm">{lastBillingResult.invoicesGenerated}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block">Invoices Skipped (Idempotent)</span>
              <strong className="text-slate-700 text-sm">{lastBillingResult.invoicesSkipped}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block">Total New Billed</span>
              <strong className="text-blue-700 text-sm">{formatCurrency(lastBillingResult.totalAmountBilled)}</strong>
            </div>
          </div>

          {lastBillingResult.messages && lastBillingResult.messages.length > 0 && (
            <div className="text-[11px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-blue-100 max-h-32 overflow-y-auto space-y-1">
              {lastBillingResult.messages.map((m, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold">›</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold overflow-x-auto max-w-full">
          {['ALL', 'CONFIRMED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'DRAFT', 'CANCELLED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded transition-colors whitespace-nowrap',
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Customer Select Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Invoices DataTable */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
        searchPlaceholder="Search by invoice #, customer name, subscription..."
        emptyMessage="No invoices match the selected filters."
        onRowClick={(row) => setSelectedInvoice(row)}
      />

      {/* MODAL: RUN BILLING ENGINE */}
      <Modal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        title="Execute Recurring Billing Engine"
        description="Scans active subscriptions, verifies idempotency, takes itemized pricing snapshots, and advances next billing dates."
        size="md"
      >
        <form onSubmit={handleExecuteBillingRun} className="space-y-4 py-2">
          <Input
            label="Target Cutoff Date"
            type="date"
            value={targetCutoffDate}
            onChange={(e) => setTargetCutoffDate(e.target.value)}
            helperText="All active subscriptions due on or before this date will be invoiced."
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1">
              Target Subscription (Optional)
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- All Due Subscriptions --</option>
              {subscriptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.subscriptionNumber} ({s.customerName}) — Next: {formatDate(s.nextBillingDate)}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Leave blank to automatically scan and bill all customer subscriptions.
            </span>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="forceBilling"
              checked={forceBilling}
              onChange={(e) => setForceBilling(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="forceBilling" className="text-xs text-slate-700 font-medium cursor-pointer">
              Force Run (Bill future cycles immediately for hackathon evaluation)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsBillingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isExecutingRun}
              leftIcon={<Play className="h-4 w-4 fill-current" />}
            >
              Start Billing Run
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INVOICE DETAILS & ITEM SNAPSHOTS */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Official Invoice Details — ${selectedInvoice.invoiceNumber}`}
          description={`Customer: ${selectedInvoice.customerName} | Issued: ${formatDate(selectedInvoice.issueDate)}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="md"
                onClick={() => window.print()}
                leftIcon={<Printer className="h-4 w-4" />}
              >
                Print Invoice
              </Button>

              <div className="flex items-center gap-2">
                {selectedInvoice.status === 'DRAFT' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleConfirmInvoice(selectedInvoice.id)}
                  >
                    Confirm Invoice
                  </Button>
                )}
                {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleCancelInvoice(selectedInvoice.id)}
                  >
                    Cancel Invoice
                  </Button>
                )}
                <Button variant="outline" size="md" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 py-2">
            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Subscription</span>
                <span className="font-mono font-bold text-slate-800 mt-1 block">
                  {selectedInvoice.subscriptionNumber || 'Direct'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Billing Period</span>
                <span className="text-slate-700 mt-1 block font-mono text-[11px]">
                  {formatDate(selectedInvoice.billingPeriodStart)} → {formatDate(selectedInvoice.billingPeriodEnd)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Payment Due Date</span>
                <span className="font-bold text-blue-700 mt-1 block">
                  {formatDate(selectedInvoice.dueDate)}
                </span>
              </div>
            </div>

            {/* Line Items Snapshot Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 uppercase font-bold text-slate-700 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item & Specification</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax (18%)</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-mono font-medium">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                {Number(selectedInvoice.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                  <span>Total Amount:</span>
                  <span className="font-mono text-blue-700">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                  <span>Amount Paid:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(selectedInvoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm bg-slate-50 p-2 rounded-lg">
                  <span>Balance Due:</span>
                  <span className={cn('font-mono', selectedInvoice.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700')}>
                    {formatCurrency(selectedInvoice.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default InvoicesPage;
