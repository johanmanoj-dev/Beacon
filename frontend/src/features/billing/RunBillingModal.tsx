import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import api from '../../services/api';
import { Button, Input, Modal, Badge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export interface RunBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

interface BillingRunResult {
  invoicesGenerated: number;
  skippedCount: number;
  totalAmountBilled: number;
  generatedInvoiceNumbers: string[];
  message: string;
}

export const RunBillingModal: React.FC<RunBillingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<BillingRunResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunBilling = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const url = asOfDate ? `/billing/run?asOfDate=${asOfDate}` : '/billing/run';
      const res = await api.post<BillingRunResult>(url);
      setResult(res.data);
      onCompleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Billing run failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handlePresetDate = (presetDate: string) => {
    setAsOfDate(presetDate);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Play className="h-5 w-5 text-[#2B4257]" />
          <span>Execute Recurring Billing Run</span>
        </div>
      }
      description="Evaluates all active subscriptions, generates snapshot invoices, and advances billing cycles."
      size="md"
    >
      <div className="space-y-4">
        {/* Explanation Card */}
        <div className="p-3 bg-[#E9EFF5] border border-[#C8D7E5] rounded-xl text-xs text-[#101E2B] leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 mb-1 text-[#2B4257]">
            <Layers className="h-4 w-4 text-[#2B4257]" />
            Automated Idempotent Engine
          </p>
          Subscriptions with <code className="bg-[#D8E2EC] px-1 py-0.5 rounded text-[11px] font-mono text-[#2B4257]">next_billing_date &le; asOfDate</code> are evaluated. Any subscription already billed for the active cycle is safely skipped.
        </div>

        {/* Date Selector & Presets */}
        <div>
          <label className="block text-xs font-semibold text-[#2B4257] mb-1">Evaluation Cutoff Date (As of Date)</label>
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-[#7189A0]">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handlePresetDate(new Date().toISOString().split('T')[0])}
              className="text-[11px] px-2.5 py-1 rounded bg-[#F5F0E6] hover:bg-[#EAE3D6] text-[#2B4257] font-medium border border-[#E5DFD3] cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('2026-11-20')}
              className="text-[11px] px-2.5 py-1 rounded bg-[#E9EFF5] hover:bg-[#D8E2EC] text-[#2B4257] font-medium border border-[#C8D7E5] cursor-pointer transition-colors"
            >
              Cycle 1 (Nov 20, 2026)
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('2026-12-31')}
              className="text-[11px] px-2.5 py-1 rounded bg-[#F3EFF8] hover:bg-[#E6DEEE] text-[#553C7B] font-medium border border-[#D9CEE8] cursor-pointer transition-colors"
            >
              Year-End (Dec 31, 2026)
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-[#FDECEE] border border-[#F8BFC7] text-[#93152A] rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div className="p-4 bg-[#EBF5EE] border border-[#BDE3CA] rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-[#1E5638] font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#1E5638]" />
              <span>Billing Run Complete!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-[#BDE3CA]">
                <span className="text-[10px] text-[#7189A0] block uppercase">Invoices Created</span>
                <span className="text-base font-bold text-[#1E5638]">{result.invoicesGenerated}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#BDE3CA]">
                <span className="text-[10px] text-[#7189A0] block uppercase">Skipped (Idempotent)</span>
                <span className="text-base font-bold text-[#8C4800]">{result.skippedCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-[#BDE3CA]">
                <span className="text-[10px] text-[#7189A0] block uppercase">Total Billed</span>
                <span className="text-base font-bold text-[#101E2B]">{formatCurrency(result.totalAmountBilled)}</span>
              </div>
            </div>

            {result.generatedInvoiceNumbers.length > 0 && (
              <div className="text-xs text-[#2B4257]">
                <span className="font-semibold block mb-1">Generated Invoices:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.generatedInvoiceNumbers.map((num) => (
                    <Badge key={num} variant="info" size="sm">{num}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#E5DFD3]">
          <Button variant="ghost" onClick={onClose} disabled={isRunning}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleRunBilling}
            isLoading={isRunning}
            disabled={isRunning}
            leftIcon={<Play className="h-4 w-4" />}
          >
            Execute Run
          </Button>
        </div>
      </div>
    </Modal>
  );
};
