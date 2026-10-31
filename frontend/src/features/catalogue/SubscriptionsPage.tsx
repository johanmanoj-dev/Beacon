import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, RefreshCw, AlertCircle, CheckCircle2, Pause, Play,
  XCircle, RotateCw, ChevronDown, ChevronRight, Search, Clock
} from 'lucide-react';
import api from '../../services/api';
import type { Subscription, SubscriptionStatus, Customer, Plan } from '../../types';

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSweeping, setIsSweeping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<number | ''>('');
  const [planFilter, setPlanFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);

  // Early Close Modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingSub, setClosingSub] = useState<Subscription | null>(null);
  const [closeReason, setCloseReason] = useState('Customer requested early termination');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (customerFilter) params.append('customerId', String(customerFilter));
      if (planFilter) params.append('planId', String(planFilter));

      const query = params.toString() ? `?${params.toString()}` : '';
      const [subsRes, custRes, planRes] = await Promise.all([
        api.get<Subscription[]>(`/subscriptions${query}`),
        api.get<Customer[]>('/customers'),
        api.get<Plan[]>('/plans')
      ]);

      setSubscriptions(subsRes.data);
      setCustomers(custRes.data);
      setPlans(planRes.data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load subscriptions';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, customerFilter, planFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleAction = async (subId: number, action: 'pause' | 'resume' | 'renew') => {
    setActionLoadingId(subId);
    setError(null);
    try {
      const res = await api.post<Subscription>(`/subscriptions/${subId}/${action}`);
      const actionText = {
        pause: 'paused',
        resume: 'resumed to active',
        renew: 'renewed and advanced to next billing cycle'
      }[action];
      setSuccessMsg(`Subscription ${res.data.subscriptionNumber} ${actionText}!`);
      fetchSubscriptions();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} subscription`;
      setError(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCloseModal = (sub: Subscription) => {
    setClosingSub(sub);
    setCloseReason('Customer requested early termination');
    setShowCloseModal(true);
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingSub) return;

    setActionLoadingId(closingSub.id);
    setError(null);
    try {
      const params = closeReason.trim() ? `?reason=${encodeURIComponent(closeReason.trim())}` : '';
      const res = await api.post<Subscription>(`/subscriptions/${closingSub.id}/close${params}`);
      setSuccessMsg(`Subscription ${res.data.subscriptionNumber} closed successfully (Reason: ${closeReason})!`);
      setShowCloseModal(false);
      setClosingSub(null);
      fetchSubscriptions();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to close subscription';
      setError(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAutoCloseSweep = async () => {
    setIsSweeping(true);
    setError(null);
    try {
      const res = await api.post<{ checkedCount: number; closedCount: number; message: string }>('/subscriptions/auto-close-check');
      setSuccessMsg(res.data.message || `Checked ${res.data.checkedCount} contracts. ${res.data.closedCount} expired subscriptions auto-closed.`);
      fetchSubscriptions();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Auto-close sweep check failed';
      setError(errorMsg);
    } finally {
      setIsSweeping(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sub.subscriptionNumber || '').toLowerCase().includes(q) ||
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#5A6D80] border border-[#E5DFD3]">✕ Closed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#101E2B]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#101E2B] tracking-tight">Subscriptions Management</h1>
          </div>
          <p className="text-sm text-[#5A6D80] mt-1">
            Complete lifecycle state machine for recurring customer subscriptions: manage active contracts, early closures, and auto-close sweeps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleAutoCloseSweep}
            disabled={isSweeping}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2B4257] bg-[#F5F0E6] border border-[#E5DFD3] rounded-lg hover:bg-[#EAE4D7] transition-colors shadow-2xs cursor-pointer"
            title="Scan active subscriptions and auto-close contracts reaching end dates"
          >
            <Clock className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
            {isSweeping ? 'Checking...' : 'Run Auto-Close Check'}
          </button>
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#101E2B] bg-white border border-[#E5DFD3] rounded-lg hover:bg-[#F5F0E6] transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#E5DFD3] rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-[#5A6D80] uppercase tracking-wider">Total Subscriptions</div>
          <div className="text-2xl font-bold text-[#101E2B] mt-1">{totalCount}</div>
          <div className="text-[11px] text-[#889AA9] mt-0.5">All customer contracts ({closedCount} closed)</div>
        </div>

        <div className="p-4 bg-white border border-[#E5DFD3] rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Contracts</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[11px] text-[#889AA9] mt-0.5">Invoicing on recurring schedule</div>
        </div>

        <div className="p-4 bg-white border border-[#E5DFD3] rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Paused Contracts</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{pausedCount}</div>
          <div className="text-[11px] text-[#889AA9] mt-0.5">Billing temporarily suspended</div>
        </div>

        <div className="p-4 bg-white border border-[#E5DFD3] rounded-xl shadow-2xs">
          <div className="text-xs font-semibold text-[#2B4257] uppercase tracking-wider">Active Contract Value</div>
          <div className="text-2xl font-bold text-[#101E2B] mt-1">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#889AA9] mt-0.5">Gross recurring revenue</div>
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
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-emerald-800">Operation Successful</h4>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* Multi-Filter Bar */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full lg:w-72">
            <Search className="w-4 h-4 text-[#889AA9] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SUB#, customer, or plan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] text-[#101E2B] placeholder:text-[#889AA9] focus:outline-hidden focus:ring-2 focus:ring-[#2B4257]"
            />
          </div>

          {/* Customer Dropdown Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select
              value={customerFilter}
              onChange={e => setCustomerFilter(e.target.value ? Number(e.target.value) : '')}
              className="text-xs rounded-lg border border-[#E5DFD3] px-3 py-1.5 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257] w-full sm:w-48"
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>

            {/* Plan Dropdown Filter */}
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value ? Number(e.target.value) : '')}
              className="text-xs rounded-lg border border-[#E5DFD3] px-3 py-1.5 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257] w-full sm:w-44"
            >
              <option value="">All Plans</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.billingInterval})</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <span className="text-[#5A6D80] font-medium">Status:</span>
            {(['ALL', 'ACTIVE', 'PAUSED', 'CLOSED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#2B4257] text-[#FAF7F0] shadow-2xs'
                    : 'bg-[#F5F0E6] text-[#5A6D80] hover:bg-[#EAE4D7] hover:text-[#101E2B]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Master Subscriptions Table */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
        {loading && subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#889AA9] mx-auto mb-3" />
            <p className="text-sm text-[#5A6D80]">Loading active subscriptions...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-[#889AA9] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-medium text-[#101E2B]">No Subscriptions Found</h3>
            <p className="text-xs text-[#5A6D80] max-w-sm mx-auto mt-1">
              {subscriptions.length === 0
                ? 'Create a quotation and convert it into an active subscription to see it here.'
                : 'No subscriptions match the selected customer, plan, or status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
              <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
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
              <tbody className="divide-y divide-[#E5DFD3] font-sans">
                {filteredSubs.map(sub => {
                  const isExpanded = expandedSubId === sub.id;
                  const isProcessing = actionLoadingId === sub.id;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr className="hover:bg-[#FCFAF6] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-[#101E2B] flex items-center gap-2">
                          <button
                            onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                            className="text-[#889AA9] hover:text-[#101E2B] text-xs p-1 rounded hover:bg-[#F5F0E6] cursor-pointer"
                            title="Toggle line items"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-[#2B4257] font-bold">{sub.subscriptionNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#101E2B]">{sub.customerName || 'Customer #' + sub.customerId}</div>
                          <div className="text-xs text-[#889AA9]">{sub.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#101E2B]">{sub.planName}</span>
                          <span className="ml-1.5 text-xs text-[#5A6D80] font-mono">({sub.billingInterval})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#5A6D80]">
                          <div className="font-semibold text-[#101E2B]">{sub.nextBillingDate}</div>
                          <div className="text-[10px] text-[#889AA9]">Terms: {sub.paymentTerms}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#101E2B]">
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
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                                    sub.canPause === false
                                      ? 'bg-[#F5F0E6] text-[#889AA9] cursor-not-allowed'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                  }`}
                                  title={sub.canPause === false ? 'This plan does not permit pausing' : 'Pause subscription'}
                                >
                                  <Pause className="w-3 h-3" /> Pause
                                </button>
                                <button
                                  onClick={() => openCloseModal(sub)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors cursor-pointer"
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Resume subscription"
                                >
                                  <Play className="w-3 h-3" /> Resume
                                </button>
                                <button
                                  onClick={() => openCloseModal(sub)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors cursor-pointer"
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B4257] bg-[#F5F0E6] border border-[#E5DFD3] rounded hover:bg-[#EAE4D7] transition-colors cursor-pointer"
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
                        <tr className="bg-[#FAF7F0] border-b border-[#E5DFD3]">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="bg-white border border-[#E5DFD3] rounded-lg p-4 shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-[#101E2B] uppercase tracking-wider">
                                  Snapshotted Contract Items ({sub.items?.length || 0})
                                </span>
                                <div className="text-xs space-x-3 text-[#5A6D80] font-mono">
                                  <span>Subtotal: ${Number(sub.subtotal || 0).toFixed(2)}</span>
                                  <span>Taxes: ${Number(sub.taxAmount || 0).toFixed(2)}</span>
                                  <span className="font-bold text-[#101E2B]">Total: ${Number(sub.totalAmount || 0).toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="divide-y divide-[#E5DFD3] text-xs">
                                {sub.items?.map((item, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-[#101E2B]">{item.productName || 'Product #' + item.productId}</span>
                                      {item.variantName && (
                                        <span className="px-1.5 py-0.5 rounded bg-[#F5F0E6] text-[#2B4257] border border-[#E5DFD3] font-medium">
                                          Variant: {item.variantName}
                                        </span>
                                      )}
                                      <span className="text-[#889AA9]">Qty: {item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-[#5A6D80]">
                                      ${Number(item.unitPrice ?? 0).toFixed(2)} ea × {item.quantity} = <span className="font-semibold text-[#101E2B]">${Number(item.lineTotal ?? 0).toFixed(2)}</span>
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

      {/* EARLY CLOSURE CONFIRMATION MODAL */}
      {showCloseModal && closingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-semibold text-[#101E2B]">Early Subscription Closure</h3>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleConfirmClose} className="p-6 space-y-4">
              <p className="text-xs text-[#5A6D80]">
                You are about to terminate subscription <strong className="text-[#101E2B] font-mono">{closingSub.subscriptionNumber}</strong> for <strong className="text-[#101E2B]">{closingSub.customerName}</strong> early.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">
                  Reason for Early Closure *
                </label>
                <select
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:outline-hidden focus:ring-2 focus:ring-[#2B4257] mb-2"
                >
                  <option value="Customer requested early termination">Customer requested early termination</option>
                  <option value="Upgraded to another enterprise tier">Upgraded to another enterprise tier</option>
                  <option value="Non-payment or overdue default">Non-payment or overdue default</option>
                  <option value="Contract agreement ended">Contract agreement ended</option>
                  <option value="Custom">Other (type custom reason below)</option>
                </select>

                <textarea
                  rows={2}
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  placeholder="Specify early closure notes..."
                  className="w-full text-xs rounded-lg border border-[#E5DFD3] p-2 text-[#101E2B] focus:outline-hidden focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === closingSub.id}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer"
                >
                  {actionLoadingId === closingSub.id ? 'Closing...' : 'Confirm Early Closure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
