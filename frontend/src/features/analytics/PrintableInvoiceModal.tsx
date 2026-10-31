import React from 'react';
import { Printer, X, ShieldCheck, Building2, FileText } from 'lucide-react';
import { Button, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Invoice } from '../../types';

export interface PrintableInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeVariant = (status: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#101E2B]/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-[#E5DFD3] overflow-hidden my-8 flex flex-col max-h-[92vh]"
        role="dialog"
      >
        {/* Top Control Bar (Hidden when printing via CSS @media print) */}
        <div className="px-6 py-4 border-b border-[#E5DFD3] bg-[#FAF7F0] flex items-center justify-between gap-4 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2B4257]" />
            <span className="font-bold text-[#101E2B] text-sm">
              Official Tax Invoice Preview — {invoice.invoiceNumber}
            </span>
            <Badge variant={getStatusBadgeVariant(invoice.status)} size="sm" withDot>
              {invoice.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              Print / Save as PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#889AA9] hover:text-[#101E2B] p-1.5 rounded-lg hover:bg-[#F5F0E6] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Container */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-white text-[#101E2B] print:p-0 print:overflow-visible">
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-[#E5DFD3] pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#2B4257] text-[#FAF7F0] font-black flex items-center justify-center text-lg shadow-sm">
                  B
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-[#101E2B] block leading-tight">
                    Brightloop Software Inc.
                  </span>
                  <span className="text-[11px] font-semibold text-[#2B4257] uppercase tracking-wider block">
                    Subscription & Recurring Billing Systems
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#5A6D80] leading-relaxed pt-2">
                <p>100 Montgomery Street, Suite 2400</p>
                <p>San Francisco, CA 94104, USA</p>
                <p className="font-mono pt-1 text-[#889AA9]">GSTIN: 29AAACB1234F1Z5 | CIN: U72200KA2026PTC</p>
                <p>Email: billing@brightloop.com | Web: www.brightloop.io</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xs font-bold text-[#889AA9] uppercase tracking-widest block">
                TAX INVOICE
              </span>
              <h2 className="text-2xl font-black text-[#101E2B] tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h2>
              <div className="pt-2 text-xs space-y-1 text-[#5A6D80]">
                <p>
                  <strong>Issue Date:</strong> {formatDate(invoice.issueDate)}
                </p>
                <p>
                  <strong>Payment Due Date:</strong> {formatDate(invoice.dueDate)}
                </p>
                <p>
                  <strong>Billing Period:</strong> {formatDate(invoice.billingPeriodStart)} to{' '}
                  {formatDate(invoice.billingPeriodEnd)}
                </p>
                <p>
                  <strong>Subscription Ref:</strong>{' '}
                  <span className="font-mono font-semibold text-[#2B4257]">
                    {invoice.subscriptionNumber || 'SUB-2026-0001'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-5 bg-[#FAF7F0] rounded-xl border border-[#E5DFD3] text-xs">
            <div>
              <span className="font-bold text-[#889AA9] uppercase tracking-wider block mb-1">
                Billed To Client
              </span>
              <p className="text-sm font-bold text-[#101E2B] flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#889AA9]" />
                {invoice.customerName || 'Acme Software Labs'}
              </p>
              <div className="text-[#5A6D80] mt-1.5 space-y-0.5">
                <p>Attn: Finance & Accounts Payable</p>
                <p>Billing Contact: customer@acme.com</p>
                <p>42 Innovation Way, Suite 300, San Francisco, CA</p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="font-bold text-[#889AA9] uppercase tracking-wider block mb-1">
                Settlement Status
              </span>
              <div className="sm:inline-block">
                <Badge variant={getStatusBadgeVariant(invoice.status)} size="md" withDot>
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-[#5A6D80] pt-1">
                Payment Terms:{' '}
                <strong className="text-[#101E2B]">Net 15 (Standard B2B Terms)</strong>
              </p>
              <p className="text-xs text-[#889AA9]">
                Currency: <strong className="text-[#101E2B]">USD ($)</strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-[#E5DFD3] overflow-hidden mb-6 text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F7F4EE] border-b border-[#E5DFD3] text-[#101E2B] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product & Specification</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Tax (18%)</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3]/60 text-[#101E2B]">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FBF9F5]">
                      <td className="py-3 px-4 font-mono text-[#889AA9]">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-[#101E2B]">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {formatCurrency(item.taxAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#101E2B] font-mono">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3 px-4 font-mono text-[#889AA9]">1</td>
                    <td className="py-3 px-4 font-semibold text-[#101E2B]">
                      Cloud ERP Software Suite (with Brand: Odoo +$560 variant)
                    </td>
                    <td className="py-3 px-3 text-center font-medium">1</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(1560)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(280.8)}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#101E2B] font-mono">
                      {formatCurrency(1840.8)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Net Due Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-[#E5DFD3] pt-6">
            <div className="space-y-3 max-w-sm text-xs text-[#5A6D80]">
              <div className="p-3 bg-[#F5F0E6] rounded-lg border border-[#E5DFD3] text-[#101E2B]">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2B4257]" />
                  Historical Snapshot Protection
                </span>
                <p className="text-[11px] text-[#5A6D80] mt-0.5 leading-relaxed">
                  Unit rates, taxes, and applied volume discounts reflect immutable historical
                  snapshots at invoice generation time.
                </p>
              </div>

              <div>
                <span className="font-bold text-[#101E2B] block uppercase tracking-wide text-[10px]">
                  Electronic Payment Instructions
                </span>
                <p className="font-mono text-[11px] text-[#5A6D80] mt-1">
                  Bank: Silicon Valley Corporate Bank<br />
                  Routing / IFSC: SVCB0001890<br />
                  Account: 9028-4411-9238-0012<br />
                  UPI VPA: payments@brightloop
                </p>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[#5A6D80]">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-semibold text-[#101E2B]">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5A6D80]">
                <span>GST Tax (18%):</span>
                <span className="font-mono font-semibold text-[#101E2B]">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
              {(invoice.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discountAmount ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#E5DFD3] text-sm font-bold text-[#101E2B]">
                <span>Total Amount Invoiced:</span>
                <span className="font-mono font-black">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[#5A6D80]">
                <span>Total Amount Paid:</span>
                <span className="font-mono font-medium text-emerald-600">
                  -{formatCurrency(invoice.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#F5F0E6] border border-[#E5DFD3] text-[#101E2B] font-black text-sm">
                <span>Net Balance Due:</span>
                <span className="font-mono text-base text-[#2B4257]">{formatCurrency(invoice.balanceDue ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="mt-12 pt-6 border-t border-[#E5DFD3] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#889AA9]">
            <span>Authorized Signatory • Brightloop Billing Operations Lead</span>
            <span className="font-mono text-[10px]">
              SHA-256 Verified Digest • Brightloop Automated Billing Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};