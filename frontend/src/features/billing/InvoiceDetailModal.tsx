import React, { useState, useEffect } from 'react';
import {
  Printer,
  Receipt,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import type { Invoice, Payment } from '../../types';
import { Button, Badge, Modal } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';

export interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onOpenRecordPayment?: (invoice: Invoice) => void;
  onOpenGateway?: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
  onOpenGateway,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(false);

  useEffect(() => {
    if (invoice && isOpen) {
      setIsLoadingPayments(true);
      api
        .get<Payment[]>(`/payments/invoice/${invoice.id}`)
        .then((res) => {
          setPayments(res.data || []);
        })
        .catch(() => {
          setPayments([]);
        })
        .finally(() => {
          setIsLoadingPayments(false);
        });
    } else {
      setPayments([]);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="md" withDot>PAID</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" size="md" withDot>PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" size="md" withDot>OVERDUE</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info" size="md" withDot>CONFIRMED</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" size="md">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          <span>Invoice Details — {invoice.invoiceNumber}</span>
        </div>
      }
      description={`Billing interval: ${formatDate(invoice.billingPeriodStart)} to ${formatDate(invoice.billingPeriodEnd)}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Top Info Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Customer</span>
            <p className="text-sm font-bold text-slate-800">{invoice.customerName || `Customer #${invoice.customerId}`}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Issue Date</span>
            <p className="text-sm font-medium text-slate-700">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Due Date</span>
            <p className="text-sm font-medium text-slate-700">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Status</span>
            <div className="mt-0.5">{getStatusBadge(invoice.status)}</div>
          </div>
        </div>

        {/* Snapshot Items Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Item Snapshot Lines</h4>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Tax (%)</th>
                  <th className="py-2.5 px-3 text-right">Tax ($)</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{it.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{it.taxRatePercent}%</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">{formatCurrency(it.taxAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(it.lineTotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400 italic">No line item snapshots recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Balance Breakdown */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1 text-xs text-slate-500 space-y-1">
            <p><strong>Subscription:</strong> {invoice.subscriptionNumber || `SUB #${invoice.subscriptionId}`}</p>
            <p><strong>Idempotency Window:</strong> {invoice.billingPeriodStart} to {invoice.billingPeriodEnd}</p>
          </div>

          <div className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Taxes:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Applied Discount:</span>
                <span className="font-mono">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Amount:</span>
              <span className="font-mono">{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600 font-semibold">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-amber-600 pt-1 border-t border-slate-200">
              <span>Balance Due:</span>
              <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Payment History for this Invoice */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Receipts History</h4>
          {isLoadingPayments ? (
            <div className="flex items-center justify-center p-4 text-xs text-slate-500 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading payment ledger...</span>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Receipt / ID</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">PAY-{p.id}</td>
                      <td className="py-2 px-3">
                        <Badge variant="neutral" size="sm">{p.paymentMethod}</Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{p.referenceNumber || p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
              No payments recorded yet for this invoice.
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={handlePrint} className="text-xs">
            <Printer className="h-4 w-4 mr-1.5" />
            Print Receipt
          </Button>

          <div className="flex items-center gap-2">
            {invoice.balanceDue > 0 && invoice.status !== 'CANCELLED' && onOpenRecordPayment && (
              <Button
                variant="secondary"
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
                className="text-xs"
              >
                Record Payment
              </Button>
            )}

            {invoice.balanceDue > 0 && invoice.status !== 'CANCELLED' && onOpenGateway && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onOpenGateway(invoice);
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                Simulate Pay Now
              </Button>
            )}

            <Button variant="ghost" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
