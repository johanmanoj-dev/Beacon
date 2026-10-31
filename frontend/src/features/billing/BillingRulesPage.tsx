import React, { useState, useEffect } from 'react';
import {
  Percent, Tag, Plus, RefreshCw, AlertCircle,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import type { TaxRate, Discount, DiscountType, DiscountScope } from '../../types';

export function BillingRulesPage() {
  const [activeTab, setActiveTab] = useState<'taxes' | 'discounts'>('taxes');
  const [taxes, setTaxes] = useState<TaxRate[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Tax Form State
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('18.00');

  // New Discount Form State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discCode, setDiscCode] = useState('');
  const [discType, setDiscType] = useState<DiscountType>('PERCENTAGE');
  const [discValue, setDiscValue] = useState('10.00');
  const [discMinQty, setDiscMinQty] = useState('5');
  const [discMinPurchase, setDiscMinPurchase] = useState('0.00');
  const [discScope, setDiscScope] = useState<DiscountScope>('SUBSCRIPTION');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [taxRes, discRes] = await Promise.all([
        api.get<TaxRate[]>('/taxes'),
        api.get<Discount[]>('/discounts')
      ]);
      setTaxes(taxRes.data);
      setDiscounts(discRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch billing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxName.trim()) {
      setError('Tax name is required');
      return;
    }

    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0) {
      setError('Rate percent must be zero or positive');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/taxes', {
        name: taxName.trim(),
        ratePercent: rate,
        isActive: true
      });
      setSuccessMsg(`Tax rate "${taxName}" created successfully!`);
      setShowTaxModal(false);
      setTaxName('');
      setTaxRate('18.00');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create tax rate');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discCode.trim()) {
      setError('Discount code is required');
      return;
    }

    const val = parseFloat(discValue);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than zero');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/discounts', {
        code: discCode.trim().toUpperCase(),
        discountType: discType,
        value: val,
        minQuantity: parseInt(discMinQty, 10) || 1,
        minPurchaseAmount: parseFloat(discMinPurchase) || 0,
        appliesTo: discScope,
        usageLimit: 100
      });
      setSuccessMsg(`Discount rule "${discCode.toUpperCase()}" created successfully!`);
      setShowDiscountModal(false);
      setDiscCode('');
      setDiscValue('10.00');
      setDiscMinQty('5');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Taxes & Promotional Discount Rules</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Track 2 • Elsa</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure statutory taxes (GST 18%) and automated tiered promotional rules (e.g. 10% volume discount for 5+ seats).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'taxes' ? (
            <button
              onClick={() => setShowTaxModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Tax Rate
            </button>
          ) : (
            <button
              onClick={() => setShowDiscountModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Discount Rule
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('taxes')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'taxes'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Percent className="w-4 h-4" />
          Statutory Tax Rates ({taxes.length})
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'discounts'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          Promotional Discounts ({discounts.length})
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* TAB 1: TAX RATES */}
      {activeTab === 'taxes' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Active Tax Configurations</h3>
            <span className="text-xs text-slate-400">Applied automatically during recurring billing runs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tax Name</th>
                  <th className="py-3 px-4 text-center">Rate (%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Policy Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {taxes.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-indigo-600" />
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {t.ratePercent.toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4">
                      {t.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Disabled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      Standard Goods & Services Tax added to all taxable lines
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTIONAL DISCOUNTS */}
      {activeTab === 'discounts' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Automated Discount Rules (Scene 5)</h3>
            <span className="text-xs text-slate-400">Volume and promotional price deductions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Discount Code</th>
                  <th className="py-3 px-4">Benefit</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Trigger Condition</th>
                  <th className="py-3 px-4">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 text-xs">
                      {d.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {d.discountType === 'PERCENTAGE' ? `${d.value.toFixed(1)}% OFF` : `-$${d.value.toFixed(2)}`}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {d.discountType}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {d.minQuantity > 1 && (
                        <div>Minimum {d.minQuantity} seats / units required</div>
                      )}
                      {d.minPurchaseAmount > 0 && (
                        <div>Min purchase: ${d.minPurchaseAmount.toFixed(2)}</div>
                      )}
                      {d.minQuantity <= 1 && d.minPurchaseAmount <= 0 && (
                        <div>All qualifying orders</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {d.appliesTo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TAX MODAL */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Add Statutory Tax Rate</h3>
              <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTax} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard GST 18%"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Percent (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="18.00"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save Tax Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Add Promotional Discount Rule</h3>
              <button onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VOLUME10"
                  value={discCode}
                  onChange={(e) => setDiscCode(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as DiscountType)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.00"
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Seats</label>
                  <input
                    type="number"
                    value={discMinQty}
                    onChange={(e) => setDiscMinQty(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discMinPurchase}
                    onChange={(e) => setDiscMinPurchase(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scope</label>
                  <select
                    value={discScope}
                    onChange={(e) => setDiscScope(e.target.value as DiscountScope)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="PRODUCT">PRODUCT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save Discount Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
