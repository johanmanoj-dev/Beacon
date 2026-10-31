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
  const todayStr = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState<string>(todayStr);
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
      setErrorMessage(err.response?.data?.message || err.message || 'Billing run failed.');
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
          <Play className="h-5 w-5 text-blue-600" />
          <span>Execute Recurring Billing Run</span>
        </div>
      }
      description="Evaluates all active subscriptions, generates snapshot invoices, and advances billing cycles."
      size="md"
    >
      <div className="space-y-4">
        {/* Explanation Card */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 mb-1">
            <Layers className="h-4 w-4 text-blue-600" />
            Automated Idempotent Engine
          </p>
          Subscriptions with <code className="bg-blue-100 px-1 py-0.5 rounded text-[11px]">next_billing_date &le; asOfDate</code> are evaluated. Any subscription already billed for the active cycle is safely skipped.
        </div>

        {/* Date Selector & Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluation Cutoff Date (As of Date)</label>
          <Input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-500">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handlePresetDate(todayStr)}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('2026-11-20')}
              className="text-[11px] px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium cursor-pointer"
            >
              Cycle 1 (Nov 20, 2026)
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('2026-12-31')}
              className="text-[11px] px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium cursor-pointer"
            >
              Year-End (Dec 31, 2026)
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Billing Run Complete!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Invoices Created</span>
                <span className="text-base font-bold text-emerald-700">{result.invoicesGenerated}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Skipped (Idempotent)</span>
                <span className="text-base font-bold text-amber-700">{result.skippedCount}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block uppercase">Total Billed</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(result.totalAmountBilled)}</span>
              </div>
            </div>

            {result.generatedInvoiceNumbers.length > 0 && (
              <div className="text-xs text-slate-600">
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
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isRunning}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handleRunBilling}
            isLoading={isRunning}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Execute Run
          </Button>
        </div>
      </div>
    </Modal>
  );
};
