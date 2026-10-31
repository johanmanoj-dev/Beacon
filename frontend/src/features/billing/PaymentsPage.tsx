import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  QrCode,
  Building,
  DollarSign,
  Search,
  RefreshCw,
  Plus,
} from 'lucide-react';
import api from '../../services/api';
import type { Payment, PaymentMethod, Invoice } from '../../types';
import { Button, Badge, DataTable, type Column } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Manual payment modal state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchPaymentsAndInvoices = async () => {
    setIsLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        api.get<Payment[]>('/payments'),
        api.get<Invoice[]>('/invoices'),
      ]);
      setPayments(payRes.data || []);
      setInvoices(invRes.data || []);
    } catch (err: any) {
      console.error('Error fetching payments ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndInvoices();
  }, []);

  // Quick lookup invoice number by id
  const invoiceMap = useMemo(() => {
    const map = new Map<number, Invoice>();
    for (const inv of invoices) {
      map.set(inv.id, inv);
    }
    return map;
  }, [invoices]);

  // Metric cards
  const metrics = useMemo(() => {
    let totalCollected = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let bankTotal = 0;

    for (const p of payments) {
      const amt = Number(p.amount || 0);
      totalCollected += amt;
      if (p.paymentMethod === 'UPI') upiTotal += amt;
      else if (p.paymentMethod === 'CREDIT_CARD' || p.paymentMethod === 'SIMULATED_GATEWAY') cardTotal += amt;
      else if (p.paymentMethod === 'BANK_TRANSFER') bankTotal += amt;
    }

    return {
      totalCollected,
      totalCount: payments.length,
      upiTotal,
      cardTotal,
      bankTotal,
    };
  }, [payments]);

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesMethod = selectedMethod === 'ALL' || p.paymentMethod === selectedMethod;
      const q = searchQuery.toLowerCase();
      const inv = invoiceMap.get(p.invoiceId);
      const invNum = inv?.invoiceNumber?.toLowerCase() || '';
      const custName = inv?.customerName?.toLowerCase() || '';
      const ref = (p.referenceNumber || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();

      const matchesSearch =
        !q ||
        invNum.includes(q) ||
        custName.includes(q) ||
        ref.includes(q) ||
        notes.includes(q);

      return matchesMethod && matchesSearch;
    });
  }, [payments, selectedMethod, searchQuery, invoiceMap]);

  const renderMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'UPI':
        return (
          <Badge variant="purple" size="sm" className="font-semibold">
            <QrCode className="h-3 w-3 mr-1" />
            UPI
          </Badge>
        );
      case 'CREDIT_CARD':
      case 'SIMULATED_GATEWAY':
        return (
          <Badge variant="info" size="sm" className="font-semibold">
            <CreditCard className="h-3 w-3 mr-1" />
            {method === 'SIMULATED_GATEWAY' ? 'Simulated Gateway' : 'Credit/Debit Card'}
          </Badge>
        );
      case 'BANK_TRANSFER':
        return (
          <Badge variant="neutral" size="sm" className="font-semibold">
            <Building className="h-3 w-3 mr-1" />
            Bank Transfer
          </Badge>
        );
      case 'CASH':
        return (
          <Badge variant="success" size="sm" className="font-semibold">
            <DollarSign className="h-3 w-3 mr-1" />
            Cash
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{method}</Badge>;
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Txn / Receipt',
      cell: (p) => (
        <div>
          <span className="font-mono font-bold text-[#101E2B] block">PAY-{p.id}</span>
          <span className="text-[11px] text-[#5A6D80] font-mono">
            {p.referenceNumber || 'No UTR Reference'}
          </span>
        </div>
      ),
    },
    {
      header: 'Invoice #',
      cell: (p) => {
        const inv = invoiceMap.get(p.invoiceId);
        return (
          <div>
            <span className="font-mono font-semibold text-[#2B4257] block">
              {inv ? inv.invoiceNumber : `INV #${p.invoiceId}`}
            </span>
            <span className="text-[11px] text-[#5A6D80]">
              {inv?.customerName || 'Customer'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Method',
      cell: (p) => renderMethodBadge(p.paymentMethod),
    },
    {
      header: 'Amount Collected',
      align: 'right',
      cell: (p) => (
        <span className="font-mono font-extrabold text-emerald-600">
          +{formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      header: 'Payment Date',
      cell: (p) => (
        <span className="text-xs text-[#101E2B] font-medium">
          {formatDate(p.paymentDate)}
        </span>
      ),
    },
    {
      header: 'Notes & Verification',
      cell: (p) => (
        <span className="text-xs text-[#5A6D80] italic truncate max-w-xs block">
          {p.notes || '—'}
        </span>
      ),
    },
  ];

  // Eligible invoices for staff payment recording
  const payableInvoices = useMemo(() => {
    return invoices.filter((i) => (i.balanceDue ?? 0) > 0 && i.status !== 'CANCELLED');
  }, [invoices]);

  const handleLaunchPaymentModal = () => {
    if (payableInvoices.length > 0) {
      setSelectedInvoice(payableInvoices[0]);
      setIsRecordModalOpen(true);
    } else {
      alert('No outstanding invoices available for payment recording.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD3] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2B4257] text-[#FAF7F0] shadow-sm">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#101E2B] tracking-tight">
                Payments Engine & Ledger
              </h1>
            </div>
            <p className="text-sm text-[#5A6D80] mt-0.5">
              Unified payment journal across manual staff collections and simulated online checkout gateway.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchPaymentsAndInvoices}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {payableInvoices.length > 0 && (
            <Button
              variant="primary"
              onClick={handleLaunchPaymentModal}
              className="text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Record Staff Payment
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#5A6D80] uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(metrics.totalCollected)}</p>
          <p className="text-[11px] text-[#889AA9] mt-0.5">{metrics.totalCount} transactions settled</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#5A6D80] uppercase tracking-wider">UPI / QR Settle</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{formatCurrency(metrics.upiTotal)}</p>
          <p className="text-[11px] text-[#889AA9] mt-0.5">Instant mobile settlement</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#5A6D80] uppercase tracking-wider">Card & Gateway</p>
          <p className="text-xl font-bold text-[#2B4257] mt-1">{formatCurrency(metrics.cardTotal)}</p>
          <p className="text-[11px] text-[#889AA9] mt-0.5">Simulated / Online checkout</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E5DFD3] shadow-2xs">
          <p className="text-[11px] font-semibold text-[#5A6D80] uppercase tracking-wider">Bank Transfer</p>
          <p className="text-xl font-bold text-[#101E2B] mt-1">{formatCurrency(metrics.bankTotal)}</p>
          <p className="text-[11px] text-[#889AA9] mt-0.5">Direct NEFT/RTGS</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5DFD3]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Methods' },
            { id: 'UPI', label: 'UPI' },
            { id: 'CREDIT_CARD', label: 'Credit Card' },
            { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
            { id: 'CASH', label: 'Cash' },
            { id: 'SIMULATED_GATEWAY', label: 'Simulated Gateway' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMethod(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedMethod === m.id
                  ? 'bg-[#2B4257] text-[#FAF7F0] shadow-xs'
                  : 'text-[#5A6D80] hover:bg-[#F5F0E6] hover:text-[#101E2B]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-[#889AA9] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference, invoice..."
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-[#E5DFD3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4257] bg-[#FBF9F5] focus:bg-white text-[#101E2B]"
          />
        </div>
      </div>

      {/* Master Payments DataTable */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        searchable={false}
        emptyMessage="No payment transactions recorded for the selected filter."
      />

      {/* Record Payment Modal if opened from top */}
      {selectedInvoice && (
        <RecordPaymentModal
          isOpen={isRecordModalOpen}
          onClose={() => {
            setIsRecordModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSuccess={fetchPaymentsAndInvoices}
        />
      )}
    </div>
  );
};