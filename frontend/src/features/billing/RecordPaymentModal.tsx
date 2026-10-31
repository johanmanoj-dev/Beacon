import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import type { Invoice, PaymentMethod } from '../../types';
import { Button, Input, Select, Modal } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invoice && isOpen) {
      setAmount(String(invoice.balanceDue));
      setPaymentMethod('UPI');
      setReferenceNumber(`REF-${Date.now().toString().slice(-6)}`);
      setNotes('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const numericAmount = parseFloat(amount) || 0;
  const balanceDue = Number(invoice.balanceDue);
  const isOverpaying = numericAmount > balanceDue;
  const isInvalidAmount = numericAmount <= 0 || isNaN(numericAmount);
  const remainingAfterPayment = Math.max(0, balanceDue - numericAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidAmount) {
      setErrorMessage('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (isOverpaying) {
      setErrorMessage(`Payment amount cannot exceed the outstanding balance of ${formatCurrency(balanceDue)}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.post('/payments/manual', {
        invoiceId: invoice.id,
        amount: numericAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(`Payment of ${formatCurrency(numericAmount)} successfully recorded!`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record payment.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Record Staff Payment</span>
        </div>
      }
      description={`Record an incoming manual settlement for Invoice ${invoice.invoiceNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Balance Snapshot */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Customer: <strong className="text-slate-800">{invoice.customerName || `Customer #${invoice.customerId}`}</strong></span>
            <span>Invoice: <strong className="text-slate-800">{invoice.invoiceNumber}</strong></span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Total Billed</p>
              <p className="text-sm font-bold text-slate-800">{formatCurrency(invoice.totalAmount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Already Paid</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(invoice.amountPaid)}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Balance Due</p>
              <p className="text-sm font-extrabold text-amber-600">{formatCurrency(balanceDue)}</p>
            </div>
          </div>
        </div>

        {/* Amount Input with Quick Full Pay Button */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Payment Amount ($)</label>
            <button
              type="button"
              onClick={() => setAmount(String(balanceDue))}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Set Full Balance ({formatCurrency(balanceDue)})
            </button>
          </div>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            max={balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className={isOverpaying ? 'border-rose-400 focus:ring-rose-400' : ''}
          />
          {/* Realtime Remaining Calculation */}
          <div className="flex justify-between items-center mt-1 text-xs">
            <span className="text-slate-500">
              Remaining after payment:
            </span>
            <span className={`font-semibold ${isOverpaying ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatCurrency(remainingAfterPayment)}
            </span>
          </div>
        </div>

        {/* Overpayment Warning Guard */}
        {isOverpaying && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Overpayment rejected: amount cannot exceed the balance due of {formatCurrency(balanceDue)}.</span>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: 'UPI', label: 'UPI (Instant / QR)' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS/ACH)' },
              { value: 'CASH', label: 'Cash / Counter Receipt' },
              { value: 'CREDIT_CARD', label: 'Manual Credit/Debit Card' },
            ]}
          />
        </div>

        {/* Reference / Transaction Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / UTR Number</label>
          <Input
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. UPI/2026/849202 or Cheque #10294"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Verified by finance officer against bank statement"
          />
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isOverpaying || isInvalidAmount || isSubmitting}
          >
            Record {formatCurrency(numericAmount)}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
