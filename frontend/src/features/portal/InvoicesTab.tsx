import React, { useState, useEffect } from 'react';
import {
  Receipt,
  RefreshCw,
  Eye,
  CreditCard,
  Printer,
  CheckCircle2,
  Building,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { Button, Badge, Modal, Input } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceStatus } from '../../types';

const FALLBACK_CUSTOMER_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'INV-2026-0001',
    subscriptionId: 1,
    subscriptionNumber: 'SUB-2026-0001',
    customerId: 3,
    customerName: 'Acme Software Labs',
    billingPeriodStart: '2026-10-01',
    billingPeriodEnd: '2026-10-31',
    issueDate: '2026-10-01',
    dueDate: '2026-10-16',
    subtotal: 8150.0,
    taxAmount: 1467.0,
    discountAmount: 0.0,
    totalAmount: 9617.0,
    amountPaid: 0.0,
    balanceDue: 9617.0,
    status: 'CONFIRMED',
    createdAt: '2026-10-01T10:00:00Z',
    items: [
      {
        id: 1,
        description: 'Cloud ERP Software Suite with Brand: Odoo (5 seats)',
        quantity: 5,
        unitPrice: 1560.0,
        taxRatePercent: 18.0,
        taxAmount: 1404.0,
        discountAmount: 0.0,
        lineTotal: 9204.0,
      },
      {
        id: 2,
        description: 'Priority 24/7 SLA Support Add-on',
        quantity: 1,
        unitPrice: 350.0,
        taxRatePercent: 18.0,
        taxAmount: 63.0,
        discountAmount: 0.0,
        lineTotal: 413.0,
      },
    ],
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-0002',
    subscriptionId: 2,
    subscriptionNumber: 'SUB-2026-0002',
    customerId: 3,
    customerName: 'Acme Software Labs',
    billingPeriodStart: '2026-09-15',
    billingPeriodEnd: '2026-10-14',
    issueDate: '2026-09-15',
    dueDate: '2026-09-30',
    subtotal: 400.0,
    taxAmount: 72.0,
    discountAmount: 0.0,
    totalAmount: 472.0,
    amountPaid: 472.0,
    balanceDue: 0.0,
    status: 'PAID',
    createdAt: '2026-09-15T09:30:00Z',
    items: [
      {
        id: 3,
        description: 'API Connector & Webhooks Engine (2 endpoints)',
        quantity: 2,
        unitPrice: 200.0,
        taxRatePercent: 18.0,
        taxAmount: 72.0,
        discountAmount: 0.0,
        lineTotal: 472.0,
      },
    ],
  },
];

export interface InvoicesTabProps {
  customerEmail?: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ customerEmail }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Preview & Payment Modals
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  // Simulated Checkout Gateway State
  const [payMethod, setPayMethod] = useState<'UPI' | 'CREDIT_CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('alice@okaxis');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<Invoice[]>('/invoices');
      if (res.data && res.data.length > 0) {
        setInvoices(res.data);
      } else {
        setInvoices(FALLBACK_CUSTOMER_INVOICES);
      }
    } catch {
      setInvoices(FALLBACK_CUSTOMER_INVOICES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [customerEmail]);

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'UNPAID') return inv.balanceDue > 0;
    if (filter === 'PAID') return inv.status === 'PAID' || inv.balanceDue === 0;
    return true;
  });

  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'OVERDUE':
        return 'danger';
      case 'CONFIRMED':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const handleSimulatePayment = () => {
    if (!paymentInvoice) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(`Payment of ${formatCurrency(paymentInvoice.balanceDue)} confirmed successfully via ${payMethod}!`);

      // Update local invoice state to PAID
      setInvoices((prev) =>
        prev.map((item) =>
          item.id === paymentInvoice.id
            ? {
                ...item,
                amountPaid: item.totalAmount,
                balanceDue: 0,
                status: 'PAID' as InvoiceStatus,
              }
            : item
        )
      );

      setTimeout(() => {
        setPaymentInvoice(null);
        setPaymentSuccess(null);
      }, 1500);
    }, 1000);
  };

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Billing Statements & Invoices</h2>
          <p className="text-xs text-slate-500">
            Download official tax invoices, check outstanding balances, and pay due amounts online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            {(['ALL', 'UNPAID', 'PAID'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  filter === opt
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt === 'ALL' ? 'All Invoices' : opt === 'UNPAID' ? 'Pending Payment' : 'Settled'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-5">Invoice Number</th>
                <th className="py-3 px-4">Billing Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <span className="font-medium text-sm text-slate-500">No invoices matching current filter</span>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      {inv.subscriptionNumber && (
                        <span className="block text-[11px] text-slate-400 font-sans font-normal">
                          For {inv.subscriptionNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(inv.billingPeriodStart)} – {formatDate(inv.billingPeriodEnd)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{formatDate(inv.dueDate)}</span>
                      {inv.balanceDue > 0 && new Date(inv.dueDate) < today && (
                        <span className="block text-[10px] text-rose-600 font-bold">Past Due</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={inv.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {formatCurrency(inv.balanceDue)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(inv.status)} size="sm" withDot>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewInvoice(inv)}
                        title="View printable invoice"
                        leftIcon={<Eye className="h-3.5 w-3.5 text-slate-500" />}
                      >
                        View
                      </Button>

                      {inv.balanceDue > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setPaymentInvoice(inv)}
                          leftIcon={<CreditCard className="h-3.5 w-3.5" />}
                        >
                          Pay Now
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Document Preview Modal (Print-ready HTML) */}
      {previewInvoice && (
        <Modal
          isOpen={!!previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-400">Official Brightloop Invoicing System</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="h-4 w-4" />}
                >
                  Print Invoice
                </Button>
                <Button variant="primary" size="md" onClick={() => setPreviewInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="p-4 sm:p-6 space-y-6 text-slate-800">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                    B
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-slate-900">
                    Brightloop Software
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tax Invoice & Subscription Billing Statement<br />
                  GSTIN: 29AAACB1234F1Z5 | Support: billing@brightloop.com
                </p>
              </div>

              <div className="text-right">
                <h3 className="text-xl font-black text-slate-900">{previewInvoice.invoiceNumber}</h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Issued: {formatDate(previewInvoice.issueDate)}
                </span>
                <span className="text-xs text-slate-500 block">
                  Due Date: {formatDate(previewInvoice.dueDate)}
                </span>
                <div className="mt-2">
                  <Badge variant={getStatusBadgeVariant(previewInvoice.status)} size="sm" withDot>
                    Status: {previewInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Billed To / Account info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Billed To
                </span>
                <span className="font-bold text-slate-900 text-sm block">
                  {previewInvoice.customerName || 'Client Organization'}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Subscription Ref: {previewInvoice.subscriptionNumber || 'SUB-2026-0001'}
                </span>
              </div>

              <div className="text-right">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Payment Summary
                </span>
                <span className="text-slate-600 block">
                  Total Invoiced: <strong>{formatCurrency(previewInvoice.totalAmount)}</strong>
                </span>
                <span className="text-slate-600 block">
                  Amount Paid: <strong>{formatCurrency(previewInvoice.amountPaid)}</strong>
                </span>
                <span className="text-sm font-black text-blue-700 block mt-1">
                  Balance Due: {formatCurrency(previewInvoice.balanceDue)}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax (18%)</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-slate-800">{it.description}</td>
                      <td className="py-3 px-3 text-center">{it.quantity}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(it.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(it.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Subtotal and Taxes Calculation */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(previewInvoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (18% GST):</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(previewInvoice.taxAmount)}
                  </span>
                </div>
                {previewInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span className="font-semibold">
                      -{formatCurrency(previewInvoice.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(previewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-blue-700 font-bold">
                  <span>Outstanding Balance:</span>
                  <span>{formatCurrency(previewInvoice.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Simulated Checkout Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => !isProcessingPayment && setPaymentInvoice(null)}
          title="Brightloop Payment Gateway Simulator"
          description={`Settling invoice ${paymentInvoice.invoiceNumber} | Balance: ${formatCurrency(paymentInvoice.balanceDue)}`}
          size="md"
        >
          <div className="space-y-5 py-2">
            {paymentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Payment Completed!</h4>
                <p className="text-xs text-emerald-700">{paymentSuccess}</p>
              </div>
            ) : (
              <>
                {/* Method selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Choose Simulated Payment Rail
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'UPI', label: 'Instant UPI', sub: 'GPay/PhonePe' },
                      { id: 'CREDIT_CARD', label: 'Test Card', sub: 'Visa/Mastercard' },
                      { id: 'NET_BANKING', label: 'Net Banking', sub: 'HDFC/ICICI' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayMethod(m.id as any)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          payMethod === m.id
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-bold">{m.label}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields based on payment method */}
                {payMethod === 'UPI' && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <Input
                      label="Virtual Payment Address (VPA / UPI ID)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      Mock UPI simulation: requests are approved immediately in sandbox.
                    </span>
                  </div>
                )}

                {payMethod === 'CREDIT_CARD' && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                    <Input
                      label="Test Card Number"
                      value="4111 2222 3333 4444"
                      disabled
                      helperText="Pre-configured sandbox test card"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Expiry" value="12/28" disabled />
                      <Input label="CVV" value="888" disabled />
                    </div>
                  </div>
                )}

                {payMethod === 'NET_BANKING' && (
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Selected Simulated Bank
                    </span>
                    <div className="p-2.5 rounded bg-white border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      Brightloop Sandbox Corporate Bank (Direct Debit)
                    </div>
                  </div>
                )}

                {/* Amount to pay */}
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-800 block font-medium">Payment Amount</span>
                    <span className="text-xs text-blue-600">Full invoice balance settlement</span>
                  </div>
                  <span className="text-xl font-black text-blue-950">
                    {formatCurrency(paymentInvoice.balanceDue)}
                  </span>
                </div>

                {/* Submit action */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentInvoice(null)}
                    disabled={isProcessingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleSimulatePayment}
                    isLoading={isProcessingPayment}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Simulate Payment ({formatCurrency(paymentInvoice.balanceDue)})
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
