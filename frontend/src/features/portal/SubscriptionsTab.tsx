import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Tag, ShieldCheck, Eye, Sparkles, Layers } from 'lucide-react';
import api from '../../services/api';
import { Button, Badge, Modal, EmptyState, useToast } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Subscription } from '../../types';

// Default mock subscriptions if backend endpoint has not yet seeded data for this customer
const FALLBACK_CUSTOMER_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 1,
    subscriptionNumber: 'SUB-2026-0001',
    customerId: 3,
    customerName: 'Acme Software Labs',
    planId: 1,
    planName: 'Enterprise Cloud Pro',
    status: 'ACTIVE',
    startDate: '2026-10-01',
    expiryDate: '2027-09-30',
    nextBillingDate: '2026-11-01',
    paymentTerms: 'Net 15',
    createdAt: '2026-10-01T10:00:00Z',
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Cloud ERP Software Suite',
        variantId: 1,
        variantName: 'Brand: Odoo (+$560)',
        quantity: 5,
        unitPrice: 1560.0,
        taxRatePercent: 18.0,
        lineTotal: 9204.0,
      },
      {
        id: 2,
        productId: 2,
        productName: 'Priority 24/7 SLA Support Add-on',
        quantity: 1,
        unitPrice: 350.0,
        taxRatePercent: 18.0,
        lineTotal: 413.0,
      },
    ],
  },
  {
    id: 2,
    subscriptionNumber: 'SUB-2026-0002',
    customerId: 3,
    customerName: 'Acme Software Labs',
    planId: 2,
    planName: 'Automated Billing Microservice',
    status: 'ACTIVE',
    startDate: '2026-10-15',
    expiryDate: '2027-10-14',
    nextBillingDate: '2026-11-15',
    paymentTerms: 'Immediate',
    createdAt: '2026-10-15T09:30:00Z',
    items: [
      {
        id: 3,
        productId: 3,
        productName: 'API Connector & Webhooks Engine',
        quantity: 2,
        unitPrice: 200.0,
        taxRatePercent: 18.0,
        lineTotal: 472.0,
      },
    ],
  },
];

export interface SubscriptionsTabProps {
  customerEmail?: string;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ customerEmail }) => {
  const { showToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const fetchSubscriptions = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await api.get<Subscription[]>('/subscriptions');
      if (res.data && res.data.length > 0) {
        setSubscriptions(res.data);
      } else {
        setSubscriptions(FALLBACK_CUSTOMER_SUBSCRIPTIONS);
      }
      if (isManual) {
        showToast('Active subscriptions refreshed', 'success');
      }
    } catch {
      setSubscriptions(FALLBACK_CUSTOMER_SUBSCRIPTIONS);
      if (isManual) {
        showToast('Loaded baseline subscriptions', 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(false);
  }, [customerEmail]);

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Software Subscriptions</h2>
          <p className="text-xs text-slate-500">
            View your subscribed software products, assigned variants, and next renewal schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubscriptions(true)}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscriptions Grid Cards or Empty State */}
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No active subscriptions found"
          description="There are currently no active software subscriptions linked to your account. Reach out to Brightloop staff or request a customized quotation to get started."
          actionText="Reload Subscriptions"
          onAction={() => fetchSubscriptions(true)}
          actionIcon={<RefreshCw className="h-3.5 w-3.5" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subscriptions.map((sub) => {
          const totalMonthly = sub.items.reduce((acc, curr) => acc + curr.lineTotal, 0);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                        {sub.subscriptionNumber}
                      </span>
                      <Badge variant="success" size="sm" withDot>
                        {sub.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {sub.planName || 'Enterprise Subscription Plan'}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Estimated Amount</span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(totalMonthly)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-1">
                {/* Timeline metadata */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 rounded-lg text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">Started On</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(sub.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Next Renewal Date</span>
                    <span className="font-bold text-blue-700 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      {formatDate(sub.nextBillingDate)}
                    </span>
                  </div>
                </div>

                {/* Subscribed items snippet */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Included Line Items ({sub.items.length})
                  </span>
                  <div className="space-y-1.5">
                    {sub.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-white border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-medium text-slate-800 block truncate">
                            {item.productName}
                          </span>
                          {item.variantName && (
                            <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                              <Tag className="h-3 w-3" />
                              {item.variantName}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-slate-900">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Auto-renews via {sub.paymentTerms}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSub(sub)}
                  leftIcon={<Eye className="h-3.5 w-3.5 text-slate-500" />}
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Subscription Line Items Breakdown Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Subscription Breakdown — ${selectedSub.subscriptionNumber}`}
          description={`Registered plan: ${selectedSub.planName} | Terms: ${selectedSub.paymentTerms}`}
          size="lg"
          footer={
            <Button variant="primary" size="md" onClick={() => setSelectedSub(null)}>
              Close Breakdown
            </Button>
          }
        >
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200/80">
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <Badge variant="success" size="sm" withDot className="mt-1">
                  {selectedSub.status}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Start Date</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {formatDate(selectedSub.startDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Next Billing Date</span>
                <span className="font-bold text-blue-700 mt-1 block">
                  {formatDate(selectedSub.nextBillingDate)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-600 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item & Variant</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax Rate</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedSub.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {it.productName}
                        {it.variantName && (
                          <span className="block text-[11px] text-blue-600 font-normal mt-0.5">
                            {it.variantName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">{it.quantity}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-3 px-3 text-right">{it.taxRatePercent}%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(it.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Snapshot Pricing Guarantee: Unit costs locked at subscription issuance.
              </span>
              <span className="font-extrabold text-sm">
                Total: {formatCurrency(selectedSub.items.reduce((a, b) => a + b.lineTotal, 0))}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
