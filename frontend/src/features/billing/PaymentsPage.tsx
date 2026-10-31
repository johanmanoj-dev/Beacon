import { useState, useEffect } from 'react';
import {
  CreditCard, RefreshCw, AlertCircle,
  Search, Building
} from 'lucide-react';
import api from '../../services/api';
import type { Payment, PaymentMethod } from '../../types';

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Payment[]>('/payments');
      setPayments(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'UPI':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">UPI</span>;
      case 'SIMULATED_GATEWAY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">Gateway Checkout</span>;
      case 'CREDIT_CARD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">Credit Card</span>;
      case 'BANK_TRANSFER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">Bank Wire / NEFT</span>;
      case 'CASH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">Cash / Cheque</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{method}</span>;
    }
  };

  const filteredPayments = payments.filter(p => {
    if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
      (p.customerName && p.customerName.toLowerCase().includes(q)) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Gateway Audit</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Track 2 • Elsa</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dual payment verification: staff manual entries and automated customer simulated gateway settlements.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments Settled</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">${totalCollected.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{payments.length} transactions processed</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Transactions</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {payments.filter(p => p.paymentMethod === 'SIMULATED_GATEWAY').length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5">Self-service portal checkouts</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manual Staff Entries</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {payments.filter(p => p.paymentMethod !== 'SIMULATED_GATEWAY').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">UPI, wire transfer & cash</div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice#, reference, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Method:</span>
          {(['ALL', 'UPI', 'SIMULATED_GATEWAY', 'BANK_TRANSFER', 'CREDIT_CARD'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                methodFilter === m
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'SIMULATED_GATEWAY' ? 'GATEWAY' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading && payments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
            Loading payment ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Payments Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Record a payment from the Invoices tab or simulate a customer checkout in the Customer Portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt / ID</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      #{p.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-700 font-semibold">
                      {p.invoiceNumber || `Invoice #${p.invoiceId}`}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.customerName || 'Retail Customer'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getMethodBadge(p.paymentMethod)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {p.paymentDate?.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                      +${p.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
