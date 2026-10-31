import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  Building,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Layers,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import type { Invoice } from '../../types';
import { Button, Badge, Modal } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export interface SimulatedGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

type GatewayMethod = 'UPI' | 'CREDIT_CARD' | 'NET_BANKING';

export const SimulatedGatewayModal: React.FC<SimulatedGatewayModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<GatewayMethod>('UPI');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<'IDLE' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [replayCount, setReplayCount] = useState<number>(0);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const cardHolder = 'Brightloop Customer';
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const cardCvc = '123';

  // UPI state
  const [upiId, setUpiId] = useState('customer@okhdfcbank');

  // Net banking state
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const initializeCheckout = async () => {
    if (!invoice) return;
    setIsInitializing(true);
    setOutcome('IDLE');
    setOutcomeMessage(null);
    setReplayCount(0);

    const generatedKey = `IDEM-CHK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setIdempotencyKey(generatedKey);

    try {
      const res = await api.post('/gateway/checkout', {
        invoiceId: invoice.id,
        amount: invoice.balanceDue,
        paymentMethod: selectedMethod,
        idempotencyKey: generatedKey,
      });

      setTransactionId(res.data.transactionId);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize checkout session.';
      setOutcomeMessage(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen && invoice) {
      initializeCheckout();
    } else {
      setTransactionId(null);
      setOutcome('IDLE');
      setOutcomeMessage(null);
    }
  }, [isOpen, invoice]);

  if (!invoice) return null;

  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILED') => {
    if (!transactionId) return;
    setIsConfirming(true);
    setOutcomeMessage(null);

    try {
      const failureReason = status === 'FAILED' ? 'Simulated issuer decline (insufficient funds)' : undefined;
      const res = await api.post('/gateway/confirm', {
        transactionId,
        simulatedStatus: status,
        simulatedFailureReason: failureReason,
      });

      if (res.data.status === 'SUCCESS') {
        setOutcome('SUCCESS');
        setOutcomeMessage(
          `Payment of ${formatCurrency(res.data.amountPaid)} successfully captured! Invoice ${invoice.invoiceNumber} is now ${res.data.updatedInvoiceStatus}.`
        );
        onSuccess();
      } else {
        setOutcome('FAILED');
        setOutcomeMessage(
          `Transaction declined: ${failureReason}. The outstanding balance remains ${formatCurrency(invoice.balanceDue)}.`
        );
      }
    } catch (err: unknown) {
      setOutcome('FAILED');
      const errorMsg = err instanceof Error ? err.message : 'Simulation execution failed.';
      setOutcomeMessage(errorMsg);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReplayConfirmation = async () => {
    if (!transactionId) return;
    setIsConfirming(true);

    try {
      const res = await api.post('/gateway/confirm', {
        transactionId,
        simulatedStatus: outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      });

      setReplayCount((prev) => prev + 1);
      setOutcomeMessage(
        `[Idempotent Replay Verified #${replayCount + 1}] Server returned original outcome: ${res.data.status}. Zero duplicate ledger records created.`
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Replay verification error.';
      setOutcomeMessage(`Replay error: ${errorMsg}`);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#2B4257]" />
          <span className="text-[#101E2B] font-bold">Checkout Gateway Simulator</span>
        </div>
      }
      description={`Simulated self-hosted payment session for Invoice ${invoice.invoiceNumber}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Banner: Zero 3rd Party BaaS */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F0E6] border border-[#E5DFD3] text-xs text-[#101E2B]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#2B4257] shrink-0" />
            <div>
              <p className="font-bold text-[#101E2B]">Brightloop Native Gateway Engine</p>
              <p className="text-[11px] text-[#5A6D80]">Strictly isolated local gateway simulator — zero 3rd-party BaaS dependencies.</p>
            </div>
          </div>
          <Badge variant="info" size="sm">Local Testnet</Badge>
        </div>

        {/* Invoice Summary Ribbon */}
        <div className="flex justify-between items-center p-3 rounded-lg bg-[#FAF7F0] border border-[#E5DFD3]">
          <div>
            <span className="text-[11px] text-[#5A6D80] uppercase tracking-wider block font-semibold">Customer Bill</span>
            <span className="text-sm font-bold text-[#101E2B]">{invoice.customerName || `Customer #${invoice.customerId}`}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#5A6D80] uppercase tracking-wider block font-semibold">Amount Due</span>
            <span className="text-base font-extrabold text-[#2B4257]">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>

        {/* Session Metadata Details */}
        {isInitializing ? (
          <div className="flex items-center justify-center p-2 text-xs text-[#5A6D80] gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#2B4257]" />
            <span>Initializing checkout session...</span>
          </div>
        ) : transactionId ? (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6D80] px-1">
            <span>TXN: <strong className="text-[#101E2B]">{transactionId}</strong></span>
            <span>IDEM: <strong className="text-[#101E2B]">{idempotencyKey.slice(0, 16)}...</strong></span>
          </div>
        ) : null}

        {/* Payment Method Selector Tabs */}
        <div>
          <div className="flex border-b border-[#E5DFD3] gap-4 mb-4">
            <button
              type="button"
              onClick={() => setSelectedMethod('UPI')}
              className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                selectedMethod === 'UPI'
                  ? 'border-[#2B4257] text-[#2B4257]'
                  : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
              }`}
            >
              <QrCode className="h-4 w-4" />
              UPI / QR Code
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('CREDIT_CARD')}
              className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                selectedMethod === 'CREDIT_CARD'
                  ? 'border-[#2B4257] text-[#2B4257]'
                  : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Debit / Credit Card
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('NET_BANKING')}
              className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                selectedMethod === 'NET_BANKING'
                  ? 'border-[#2B4257] text-[#2B4257]'
                  : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
              }`}
            >
              <Building className="h-4 w-4" />
              Net Banking
            </button>
          </div>

          {/* Tab 1: UPI */}
          {selectedMethod === 'UPI' && (
            <div className="bg-[#FAF7F0] rounded-xl p-4 border border-[#E5DFD3] text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-xl shadow-xs border border-[#E5DFD3]">
                <div className="w-32 h-32 bg-[#182635] rounded-lg flex flex-col items-center justify-center p-2 text-white text-[10px] space-y-1">
                  <QrCode className="h-16 w-16 text-[#F5F0E6]" />
                  <span className="font-mono text-[9px] text-[#E5DFD3]">SCAN & PAY</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Simulated VPA / UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-64 text-center font-mono text-xs px-3 py-1.5 border border-[#E5DFD3] rounded-lg bg-white text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Test Card */}
          {selectedMethod === 'CREDIT_CARD' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#182635] via-[#223447] to-[#182635] text-white p-4 rounded-xl shadow-md border border-[#2B4257] space-y-3 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-xs text-[#E5DFD3]">
                  <span className="font-bold tracking-wider">BRIGHTLOOP TEST CARD</span>
                  <CreditCard className="h-5 w-5 text-[#F5F0E6]" />
                </div>
                <div className="font-mono text-lg tracking-widest pt-2 text-[#FAF7F0]">
                  {cardNumber}
                </div>
                <div className="flex justify-between items-end text-[11px] text-[#E5DFD3] pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-[#889AA9]">Card Holder</span>
                    <span className="font-semibold text-white">{cardHolder}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-[#889AA9]">Expires / CVC</span>
                    <span className="font-mono text-white">{cardExpiry} • {cardCvc}</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-[#5A6D80] text-[11px]">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4242 4242 4242 4242');
                    setCardExpiry('12/28');
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#F5F0E6] hover:bg-[#E5DFD3] text-[#101E2B] font-medium text-[11px] transition-colors cursor-pointer"
                >
                  Success Card (4242)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber('4000 0000 0000 0002');
                    setCardExpiry('01/24');
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#F5F0E6] hover:bg-[#E5DFD3] text-[#101E2B] font-medium text-[11px] transition-colors cursor-pointer"
                >
                  Expired Card
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Net Banking */}
          {selectedMethod === 'NET_BANKING' && (
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={() => setSelectedBank(bank)}
                  className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all cursor-pointer ${
                    selectedBank === bank
                      ? 'border-[#2B4257] bg-[#F5F0E6] text-[#101E2B] shadow-xs'
                      : 'border-[#E5DFD3] hover:border-[#D5CDC0] bg-white text-[#5A6D80] hover:text-[#101E2B]'
                  }`}
                >
                  <Building className={`h-4 w-4 mb-1 ${selectedBank === bank ? 'text-[#2B4257]' : 'text-[#889AA9]'}`} />
                  {bank}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outcome Feedback Banner */}
        {outcomeMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              outcome === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : outcome === 'FAILED'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-[#F5F0E6] border-[#E5DFD3] text-[#101E2B]'
            }`}
          >
            {outcome === 'SUCCESS' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : outcome === 'FAILED' ? (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-[#2B4257] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{outcomeMessage}</div>
          </div>
        )}

        {/* Action Controls & Simulation Buttons */}
        <div className="pt-3 border-t border-[#E5DFD3] space-y-2">
          <div className="text-[11px] font-medium text-[#5A6D80] text-center">
            Click an outcome below to simulate bank authorization response:
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReplayConfirmation}
              disabled={outcome === 'IDLE' || isConfirming}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isConfirming ? 'animate-spin' : ''}`} />
              Replay Idempotency
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="danger"
                onClick={() => handleSimulatePayment('FAILED')}
                disabled={isConfirming || outcome === 'SUCCESS'}
                isLoading={isConfirming}
                className="text-xs"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Simulate FAILED
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => handleSimulatePayment('SUCCESS')}
                disabled={isConfirming || outcome === 'SUCCESS'}
                isLoading={isConfirming}
                className="text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Simulate SUCCESS
              </Button>
            </div>
          </div>
        </div>

        {/* Close Button when done */}
        {outcome === 'SUCCESS' && (
          <div className="pt-2 text-center">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full">
              Close & Return to Invoices
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
