import React, { useState, useEffect } from 'react';
import {
  Layers, RefreshCw, AlertCircle, CheckCircle2, Pause, Play,
  XCircle, RotateCw, ChevronDown, ChevronRight, Search
} from 'lucide-react';
import api from '../../services/api';
import type { Subscription, SubscriptionStatus } from '../../types';

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter !== 'ALL' ? `/subscriptions?status=${statusFilter}` : '/subscriptions';
      const res = await api.get<Subscription[]>(url);
      setSubscriptions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const handleAction = async (subId: number, action: 'pause' | 'resume' | 'close' | 'renew') => {
    setActionLoadingId(subId);
    setError(null);
    try {
      const res = await api.post<Subscription>(`/subscriptions/${subId}/${action}`);
      const actionText = {
        pause: 'paused',
        resume: 'resumed to active',
        close: 'closed',
        renew: 'renewed and advanced to next billing cycle'
      }[action];
      setSuccessMsg(`Subscription ${res.data.subscriptionNumber} ${actionText}!`);
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${action} subscription`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.subscriptionNumber.toLowerCase().includes(q) ||
      (sub.customerName && sub.customerName.toLowerCase().includes(q)) ||
      (sub.planName && sub.planName.toLowerCase().includes(q))
    );
  });

  // KPI Computations
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const pausedCount = subscriptions.filter(s => s.status === 'PAUSED').length;
  const closedCount = subscriptions.filter(s => s.status === 'CLOSED').length;
  const totalValue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">● Active</span>;
      case 'PAUSED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">❚❚ Paused</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">✕ Closed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Track 1 • Johan</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete lifecycle state machine for recurring customer subscriptions: manage active contracts, pauses, and renewals.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Subscriptions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All customer contracts ({closedCount} closed)</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Contracts</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Invoicing on recurring schedule</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Paused Contracts</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{pausedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Billing temporarily suspended</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Contract Value</div>
          <div className="text-2xl font-bold text-indigo-900 mt-1">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Gross recurring revenue</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-rose-800">Action Failed</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 text-sm">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-emerald-800">Operation Successful</h4>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 text-sm">✕</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SUB#, customer, or plan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          {(['ALL', 'ACTIVE', 'PAUSED', 'CLOSED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
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

      {/* Master Subscriptions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading && subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading active subscriptions...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-800">No Subscriptions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {subscriptions.length === 0
                ? 'Create a quotation and convert it into an active subscription to see it here.'
                : 'No subscriptions match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subscription #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Interval</th>
                  <th className="py-3 px-4">Next Billing Date</th>
                  <th className="py-3 px-4 text-right">Recurring Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSubs.map(sub => {
                  const isExpanded = expandedSubId === sub.id;
                  const isProcessing = actionLoadingId === sub.id;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                            className="text-slate-400 hover:text-slate-600 text-xs p-1 rounded hover:bg-slate-100"
                            title="Toggle line items"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-indigo-950 font-bold">{sub.subscriptionNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{sub.customerName || 'Customer #' + sub.customerId}</div>
                          <div className="text-xs text-slate-400">{sub.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800">{sub.planName}</span>
                          <span className="ml-1.5 text-xs text-slate-500 font-mono">({sub.billingInterval})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                          <div className="font-semibold text-slate-900">{sub.nextBillingDate}</div>
                          <div className="text-[10px] text-slate-400">Terms: {sub.paymentTerms}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ${Number(sub.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(sub.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* ACTIVE ACTIONS */}
                            {sub.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => handleAction(sub.id, 'pause')}
                                  disabled={isProcessing || sub.canPause === false}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                    sub.canPause === false
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                  }`}
                                  title={sub.canPause === false ? 'This plan does not permit pausing' : 'Pause subscription'}
                                >
                                  <Pause className="w-3 h-3" /> Pause
                                </button>
                                <button
                                  onClick={() => handleAction(sub.id, 'close')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                                  title="Close subscription contract"
                                >
                                  <XCircle className="w-3 h-3" /> Close
                                </button>
                              </>
                            )}

                            {/* PAUSED ACTIONS */}
                            {sub.status === 'PAUSED' && (
                              <>
                                <button
                                  onClick={() => handleAction(sub.id, 'resume')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                                  title="Resume subscription"
                                >
                                  <Play className="w-3 h-3" /> Resume
                                </button>
                                <button
                                  onClick={() => handleAction(sub.id, 'close')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                                  title="Close subscription contract"
                                >
                                  <XCircle className="w-3 h-3" /> Close
                                </button>
                              </>
                            )}

                            {/* CLOSED ACTIONS */}
                            {sub.status === 'CLOSED' && (
                              <button
                                onClick={() => handleAction(sub.id, 'renew')}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
                                title="Reactivate and renew subscription"
                              >
                                <RotateCw className="w-3 h-3" /> Renew
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Line Items Snapshot Accordion */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                  Snapshotted Contract Items ({sub.items?.length || 0})
                                </span>
                                <div className="text-xs space-x-3 text-slate-500 font-mono">
                                  <span>Subtotal: ${Number(sub.subtotal || 0).toFixed(2)}</span>
                                  <span>Taxes: ${Number(sub.taxAmount || 0).toFixed(2)}</span>
                                  <span className="font-bold text-slate-900">Total: ${Number(sub.totalAmount || 0).toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="divide-y divide-slate-100 text-xs">
                                {sub.items?.map((item, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-800">{item.productName || 'Product #' + item.productId}</span>
                                      {item.variantName && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                          Variant: {item.variantName}
                                        </span>
                                      )}
                                      <span className="text-slate-400">Qty: {item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-slate-700">
                                      ${Number(item.unitPrice).toFixed(2)} ea × {item.quantity} = <span className="font-semibold text-slate-900">${Number(item.lineTotal).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
