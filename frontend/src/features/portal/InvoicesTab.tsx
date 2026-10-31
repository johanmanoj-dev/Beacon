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
import { useAuth } from '../../context';
import { Button, Badge, Modal, Input, EmptyState, useToast } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice, InvoiceStatus } from '../../types';

export interface InvoicesTabProps {
  customerEmail?: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ customerEmail }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
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

  const fetchInvoices = async (isManual = false) => {
    setLoading(true);
    try {
      const res = await api.get<Invoice[]>('/invoices');
      if (res.data) {
        const lower = (customerEmail || user?.email || '').toLowerCase();
        const currentCustomerId = user?.customerId;

        const userInvoices = res.data.filter((inv) => {
          // Demo customer Acme
          if (lower.includes('acme') || currentCustomerId === 1) {
            return inv.customerId === 1 || inv.customerName?.toLowerCase().includes('acme');
          }
          // Demo customer RetailCorp
          if (lower.includes('retail') || lower.includes('alice@retailcorp') || currentCustomerId === 2) {
            return inv.customerId === 2 || inv.customerName?.toLowerCase().includes('retail');
          }
          // Any other customer / new account: strictly their own customerId
          if (currentCustomerId) {
            return inv.customerId === currentCustomerId;
          }
          return false;
        });
        setInvoices(userInvoices);
      }
      if (isManual) {
        showToast('Billing statements refreshed', 'success');
      }
    } catch {
      showToast('Could not load billing statements from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(false);
  }, [customerEmail]);

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'UNPAID') return (inv.balanceDue ?? 0) > 0;
    if (filter === 'PAID') return inv.status === 'PAID' || (inv.balanceDue ?? 0) === 0;
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

  const handleSimulatePayment = async () => {
    if (!paymentInvoice) return;
    setIsProcessingPayment(true);
    setPaymentSuccess(null);

    try {
      // 1. Initiate checkout session via real backend API
      const checkoutRes = await api.post('/payments/gateway/checkout', {
        invoiceId: paymentInvoice.id,
        amount: paymentInvoice.balanceDue,
        paymentMethod: payMethod,
        idempotencyKey: `sim-checkout-${paymentInvoice.id}-${Date.now()}`,
      });

      const txnId = checkoutRes.data.transactionId;

      // 2. Confirm payment on the backend gateway
      await api.post('/payments/gateway/confirm', {
        transactionId: txnId,
        simulatedOutcome: 'SUCCESS',
        paymentMethod: payMethod,
      });

      const paidMsg = `Payment of ${formatCurrency(paymentInvoice.balanceDue)} confirmed via ${payMethod} (Ref: ${txnId})!`;
      setPaymentSuccess(paidMsg);
      showToast(paidMsg, 'success');

      // 3. Immediately re-fetch verified invoice state from database
      await fetchInvoices(false);

      setTimeout(() => {
        setPaymentInvoice(null);
        setPaymentSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment processing failed';
      showToast(msg, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#101E2B]">Billing Statements & Invoices</h2>
          <p className="text-xs text-[#5A6D80]">
            Download official tax invoices, check outstanding balances, and pay due amounts online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="inline-flex rounded-lg border border-[#E5DFD3] bg-white p-1 text-xs">
            {(['ALL', 'UNPAID', 'PAID'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  filter === opt
                    ? 'bg-[#2B4257] text-[#FAF7F0] shadow-2xs'
                    : 'text-[#5A6D80] hover:text-[#101E2B]'
                }`}
              >
                {opt === 'ALL' ? 'All Invoices' : opt === 'UNPAID' ? 'Pending Payment' : 'Settled'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInvoices(true)}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white rounded-xl border border-[#E5DFD3] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F4EE] border-b border-[#E5DFD3] text-[#101E2B] uppercase font-semibold tracking-wider">
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
            <tbody className="divide-y divide-[#E5DFD3] text-[#5A6D80]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <EmptyState
                      icon={Receipt}
                      title="No invoices found"
                      description={
                        filter === 'UNPAID'
                          ? 'All billing invoices for this account are fully settled. No outstanding balances due.'
                          : 'No invoice statements found matching the current status filter.'
                      }
                      actionText={filter !== 'ALL' ? 'Show All Invoices' : 'Refresh Invoices'}
                      onAction={() => {
                        if (filter !== 'ALL') setFilter('ALL');
                        else fetchInvoices(true);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FCFAF6] transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#101E2B]">
                      {inv.invoiceNumber}
                      {inv.subscriptionNumber && (
                        <span className="block text-[11px] text-[#889AA9] font-sans font-normal">
                          For {inv.subscriptionNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#5A6D80] font-medium">
                      {formatDate(inv.billingPeriodStart)} – {formatDate(inv.billingPeriodEnd)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#101E2B]">{formatDate(inv.dueDate)}</span>
                      {(inv.balanceDue ?? 0) > 0 && inv.dueDate && new Date(inv.dueDate).getTime() < Date.now() && (
                        <span className="block text-[10px] text-rose-600 font-bold">Past Due</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#101E2B]">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={(inv.balanceDue ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
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
                        leftIcon={<Eye className="h-3.5 w-3.5 text-[#5A6D80]" />}
                      >
                        View
                      </Button>

                      {(inv.balanceDue ?? 0) > 0 && (
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
              <span className="text-xs text-[#889AA9]">Official Brightloop Invoicing System</span>
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
          <div className="p-4 sm:p-6 space-y-6 text-[#101E2B]">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start border-b border-[#E5DFD3] pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#2B4257] text-[#FAF7F0] font-black flex items-center justify-center text-sm">
                    B
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-[#101E2B]">
                    Brightloop Software
                  </span>
                </div>
                <p className="text-xs text-[#5A6D80] mt-1 leading-relaxed">
                  Tax Invoice & Subscription Billing Statement<br />
                  GSTIN: 29AAACB1234F1Z5 | Support: billing@brightloop.com
                </p>
              </div>

              <div className="text-right">
                <h3 className="text-xl font-black text-[#101E2B]">{previewInvoice.invoiceNumber}</h3>
                <span className="text-xs text-[#5A6D80] mt-0.5 block">
                  Issued: {formatDate(previewInvoice.issueDate)}
                </span>
                <span className="text-xs text-[#5A6D80] block">
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
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF7F0] border border-[#E5DFD3] text-xs">
              <div>
                <span className="font-bold text-[#5A6D80] uppercase tracking-wider block mb-1">
                  Billed To
                </span>
                <span className="font-bold text-[#101E2B] text-sm block">
                  {previewInvoice.customerName || 'Client Organization'}
                </span>
                <span className="text-[#889AA9] block mt-0.5">
                  Subscription Ref: {previewInvoice.subscriptionNumber || 'SUB-2026-0001'}
                </span>
              </div>

              <div className="text-right">
                <span className="font-bold text-[#5A6D80] uppercase tracking-wider block mb-1">
                  Payment Summary
                </span>
                <span className="text-[#5A6D80] block">
                  Total Invoiced: <strong>{formatCurrency(previewInvoice.totalAmount)}</strong>
                </span>
                <span className="text-[#5A6D80] block">
                  Amount Paid: <strong>{formatCurrency(previewInvoice.amountPaid)}</strong>
                </span>
                <span className="text-sm font-black text-[#2B4257] block mt-1">
                  Balance Due: {formatCurrency(previewInvoice.balanceDue)}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-xl border border-[#E5DFD3] overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F7F4EE] text-[#101E2B] border-b border-[#E5DFD3] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Tax (18%)</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3]">
                  {previewInvoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-[#FCFAF6]">
                      <td className="py-3 px-4 font-medium text-[#101E2B]">{it.description}</td>
                      <td className="py-3 px-3 text-center">{it.quantity}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-3 px-3 text-right">{formatCurrency(it.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#101E2B]">
                        {formatCurrency(it.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Subtotal and Taxes Calculation */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs text-[#5A6D80]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-[#101E2B]">
                    {formatCurrency(previewInvoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (18% GST):</span>
                  <span className="font-semibold text-[#101E2B]">
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
                <div className="flex justify-between pt-2 border-t border-[#E5DFD3] text-sm font-black text-[#101E2B]">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(previewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[#2B4257] font-bold">
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
                  <label className="block text-xs font-semibold text-[#101E2B] uppercase tracking-wide">
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
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          payMethod === m.id
                            ? 'border-[#2B4257] bg-[#F5F0E6] text-[#101E2B] ring-2 ring-[#2B4257]/20 shadow-xs'
                            : 'border-[#E5DFD3] bg-white text-[#5A6D80] hover:bg-[#FAF7F0] hover:text-[#101E2B]'
                        }`}
                      >
                        <span className="block text-xs font-bold">{m.label}</span>
                        <span className="block text-[10px] text-[#889AA9] mt-0.5">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields based on payment method */}
                {payMethod === 'UPI' && (
                  <div className="p-3.5 rounded-lg bg-[#FAF7F0] border border-[#E5DFD3] space-y-2">
                    <Input
                      label="Virtual Payment Address (VPA / UPI ID)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@bank"
                    />
                    <span className="text-[11px] text-[#889AA9] block">
                      Mock UPI simulation: requests are approved immediately in sandbox.
                    </span>
                  </div>
                )}

                {payMethod === 'CREDIT_CARD' && (
                  <div className="p-3.5 rounded-lg bg-[#FAF7F0] border border-[#E5DFD3] space-y-3">
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
                  <div className="p-3.5 rounded-lg bg-[#FAF7F0] border border-[#E5DFD3]">
                    <span className="text-xs font-semibold text-[#101E2B] block mb-1.5">
                      Selected Simulated Bank
                    </span>
                    <div className="p-2.5 rounded bg-white border border-[#E5DFD3] text-xs font-medium text-[#101E2B] flex items-center gap-2">
                      <Building className="h-4 w-4 text-[#2B4257]" />
                      Brightloop Sandbox Corporate Bank (Direct Debit)
                    </div>
                  </div>
                )}

                {/* Amount to pay */}
                <div className="p-4 rounded-xl bg-[#F5F0E6] border border-[#E5DFD3] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#101E2B] block font-semibold">Payment Amount</span>
                    <span className="text-xs text-[#5A6D80]">Full invoice balance settlement</span>
                  </div>
                  <span className="text-xl font-black text-[#2B4257]">
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
export default InvoicesTab;
