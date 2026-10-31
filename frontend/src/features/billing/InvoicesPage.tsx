import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  DollarSign,
  Eye,
  Building,
  Layers,
  Check,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceStatus, PaymentMethod } from '../../types';

interface BillingRunResult {
  runDate: string;
  invoicesCreated: number;
  invoicesSkipped: number;
  totalAmountBilled: number;
  generatedInvoiceNumbers: string[];
  message: string;
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Run Billing Modal / Trigger
  const [showRunBillingModal, setShowRunBillingModal] = useState(false);
  const [billingDate, setBillingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingRunResult, setBillingRunResult] = useState<BillingRunResult | null>(null);

  // View Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Record Manual Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [recordingPay, setRecordingPay] = useState(false);

  // Invoice Confirmation & Cancellation
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const url = `/invoices${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get<Invoice[]>(url);
      setInvoices(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleRunBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningBilling(true);
    setError(null);
    setBillingRunResult(null);
    try {
      const res = await api.post<BillingRunResult>(`/billing/run?targetDate=${billingDate}`);
      setBillingRunResult(res.data);
      setSuccessMsg(res.data.message);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Billing run failed');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId: number) => {
    setActionLoadingId(invoiceId);
    setError(null);
    try {
      await api.post(`/invoices/${invoiceId}/confirm`);
      setSuccessMsg('Invoice confirmed successfully.');
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'CONFIRMED' } : null));
      }
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvoice = async (invoiceId: number) => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This action is permanent.')) {
      return;
    }
    setActionLoadingId(invoiceId);
    setError(null);
    try {
      await api.post(`/invoices/${invoiceId}/cancel`);
      setSuccessMsg('Invoice cancelled successfully.');
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: 'CANCELLED', balanceDue: 0 } : null));
      }
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel invoice');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRecordPaymentModal = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPayAmount(String(inv.balanceDue));
    setPayMethod('UPI');
    setPayRef('UPI/AXIS/' + Math.floor(10000000 + Math.random() * 90000000));
    setPayNotes('Manual payment recorded by staff');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment amount greater than zero');
      return;
    }
    if (amt > paymentInvoice.balanceDue) {
      setError(`Payment cannot exceed current balance due ($${paymentInvoice.balanceDue.toFixed(2)})`);
      return;
    }

    setRecordingPay(true);
    setError(null);
    try {
      await api.post('/payments/manual', {
        invoiceId: paymentInvoice.id,
        amount: amt,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
        recordedByUserId: 2, // Staff Bob Jenkins
      });

      setSuccessMsg(`Payment of $${amt.toFixed(2)} recorded for ${paymentInvoice.invoiceNumber}`);
      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setRecordingPay(false);
    }
  };

  // KPI calculations
  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);
  const overdueCount = invoices.filter(
    (inv) => inv.status === 'OVERDUE' || (inv.balanceDue > 0 && new Date(inv.dueDate) < new Date())
  ).length;

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Partially Paid
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Confirmed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
      (inv.subscriptionNumber && inv.subscriptionNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Recurring Billing</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Track 2 • Elsa</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated billing engine, GST tax calculation, line-item snapshotting, and strict idempotency enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRunBillingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> Run Recurring Billing
          </button>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalBilled)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{invoices.length} total invoices</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Total Collected</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalPaid)}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Live cleared revenue</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Outstanding Receivables</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totalOutstanding)}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Pending collection</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Overdue Invoices</div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{overdueCount}</div>
          <div className="text-[11px] text-rose-500 mt-0.5">Exceeded Net 15 terms</div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Idempotency Demonstration Banner */}
      {billingRunResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-indigo-950 text-sm">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Billing Run Summary (Target Date: {billingRunResult.runDate})</span>
            </div>
            <button onClick={() => setBillingRunResult(null)} className="text-indigo-400 hover:text-indigo-600 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
              <span className="text-slate-500">Invoices Generated:</span>{' '}
              <strong className="text-indigo-700 font-bold">{billingRunResult.invoicesCreated}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
              <span className="text-slate-500">Skipped (Idempotent):</span>{' '}
              <strong className="text-amber-700 font-bold">{billingRunResult.invoicesSkipped}</strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
              <span className="text-slate-500">Total Billed:</span>{' '}
              <strong className="text-emerald-700 font-bold">{formatCurrency(billingRunResult.totalAmountBilled)}</strong>
            </div>
          </div>
          {billingRunResult.generatedInvoiceNumbers && billingRunResult.generatedInvoiceNumbers.length > 0 && (
            <div className="text-xs text-indigo-800">
              Generated Invoices: <span className="font-mono">{billingRunResult.generatedInvoiceNumbers.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by INV#, customer, or SUB#..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          {(['ALL', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading && invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            Loading invoices from brightloop_db...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Invoices Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Trigger "Run Recurring Billing" to automatically generate invoices from active customer subscriptions.
            </p>
            <button
              onClick={() => setShowRunBillingModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Run Billing Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Period & Due Date</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax (18%)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {inv.invoiceNumber}
                      {inv.subscriptionNumber && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          {inv.subscriptionNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.customerName || `Customer #${inv.customerId}`}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{formatDate(inv.billingPeriodStart)} to {formatDate(inv.billingPeriodEnd)}</div>
                      <div className="text-[11px] text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs">
                      {formatCurrency(inv.subtotal)}
                      {inv.discountAmount > 0 && (
                        <div className="text-[10px] text-emerald-600">-{formatCurrency(inv.discountAmount)} disc</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                      {formatCurrency(inv.taxAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 text-xs">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-700">{formatCurrency(inv.balanceDue)}</span>
                      ) : (
                        <span className="text-emerald-600">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="View Line Items"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => handleConfirmInvoice(inv.id)}
                          disabled={actionLoadingId === inv.id}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Confirm Invoice"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {inv.balanceDue > 0 && inv.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => openRecordPaymentModal(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                            title="Record Staff Payment"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(inv.id)}
                            disabled={actionLoadingId === inv.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Cancel Invoice"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RUN BILLING MODAL */}
      {showRunBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Run Recurring Billing Engine</h3>
              </div>
              <button onClick={() => setShowRunBillingModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRunBilling} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Scans all active customer subscriptions where <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">next_billing_date &le; target_date</code>, captures frozen line snapshots, calculates 18% GST, and enforces idempotency.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Billing Date *</label>
                <input
                  type="date"
                  required
                  value={billingDate}
                  onChange={(e) => setBillingDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 space-y-1">
                <div className="font-semibold">Scene 4 Demonstration Tip:</div>
                <div>Run once to generate today's invoices. Then click run again to show judges that <strong>0 duplicate invoices</strong> are created!</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRunBillingModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={runningBilling}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  {runningBilling ? 'Executing Run...' : 'Execute Billing Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MANUAL PAYMENT MODAL */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Record Manual Payment</h3>
              </div>
              <button onClick={() => setPaymentInvoice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800">{paymentInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoice:</span>
                  <span className="font-mono text-slate-700">{formatCurrency(paymentInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-sm font-bold">
                  <span className="text-slate-700">Balance Due:</span>
                  <span className="font-mono text-amber-700">{formatCurrency(paymentInvoice.balanceDue)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Payment Amount ($) *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(paymentInvoice.balanceDue))}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports partial payments (e.g. $500 manual UPI payment for Scene 6).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="UPI">UPI (Unified Payments Interface)</option>
                  <option value="BANK_TRANSFER">Bank Wire / NEFT / RTGS</option>
                  <option value="CREDIT_CARD">Corporate Credit Card</option>
                  <option value="CASH">Cash / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPay}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                >
                  {recordingPay ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-400">Created: {formatDate(selectedInvoice.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500">Billed To:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedInvoice.customerName}</div>
                  <div className="text-slate-400">Customer #{selectedInvoice.customerId}</div>
                </div>
                <div>
                  <span className="text-slate-500">Billing Period:</span>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {formatDate(selectedInvoice.billingPeriodStart)} to {formatDate(selectedInvoice.billingPeriodEnd)}
                  </div>
                  <div className="text-slate-400">Due Date: {formatDate(selectedInvoice.dueDate)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Frozen Line Item Snapshots</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Tax (18%)</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-900">{item.description}</td>
                          <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono text-slate-500">{formatCurrency(item.taxAmount)}</td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promotional Discount:</span>
                      <span className="font-mono">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax (18%):</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                    <span>Total Amount:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(selectedInvoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-amber-700 border-t border-slate-100 pt-1">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.balanceDue)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicesPage;
