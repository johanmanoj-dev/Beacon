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
      setTaxes(taxRes.data || []);
      setDiscounts(discRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch billing rules');
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
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Rate percent must be between 0.00% and 100.00%');
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
      setError(err.message || 'Failed to create tax rate');
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
    if (discType === 'PERCENTAGE' && val > 100) {
      setError('Percentage discount cannot exceed 100%');
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
      setError(err.message || 'Failed to create discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#101E2B] tracking-tight">Taxes & Promotional Discount Rules</h1>
          </div>
          <p className="text-sm text-[#5A6D80] mt-1">
            Configure statutory taxes (GST 18%) and automated tiered promotional rules (e.g. 10% volume discount for 5+ seats).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'taxes' ? (
            <button
              type="button"
              onClick={() => setShowTaxModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Tax Rate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Discount Rule
            </button>
          )}

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-[#2B4257] hover:text-[#101E2B] border border-[#E5DFD3] rounded-lg hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            title="Refresh Rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#E5DFD3] text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('taxes')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'taxes'
              ? 'border-[#2B4257] text-[#2B4257] font-semibold'
              : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
          }`}
        >
          <Percent className="w-4 h-4" />
          Statutory Tax Rates ({taxes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discounts')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'discounts'
              ? 'border-[#2B4257] text-[#2B4257] font-semibold'
              : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
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
          <button type="button" onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: TAX RATES */}
      {activeTab === 'taxes' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
            <h3 className="font-semibold text-[#101E2B] text-sm">Active Tax Configurations</h3>
            <span className="text-xs text-[#889AA9]">Applied automatically during recurring billing runs</span>
          </div>

          {taxes.length === 0 ? (
            <div className="p-8 text-center text-[#5A6D80]">
              <Percent className="w-8 h-8 mx-auto text-[#889AA9] mb-2" />
              <p className="text-sm font-medium">No statutory tax rates configured yet.</p>
              <p className="text-xs text-[#889AA9] mt-1">Click "Add Tax Rate" above to create an 18% GST or VAT rule.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
                <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
                  <tr>
                    <th className="py-3 px-4">Tax Name</th>
                    <th className="py-3 px-4 text-center">Rate (%)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Policy Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3]/60 font-sans">
                  {taxes.map(t => (
                    <tr key={t.id} className="hover:bg-[#FBF9F5] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#101E2B] flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#2B4257]" />
                        {t.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#101E2B]">
                        {t.ratePercent.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4">
                        {t.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#5A6D80]">Disabled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5A6D80]">
                        Standard Goods & Services Tax added to all taxable lines
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROMOTIONAL DISCOUNTS */}
      {activeTab === 'discounts' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
            <h3 className="font-semibold text-[#101E2B] text-sm">Automated Discount Rules (Scene 5)</h3>
            <span className="text-xs text-[#889AA9]">Volume and promotional price deductions</span>
          </div>

          {discounts.length === 0 ? (
            <div className="p-8 text-center text-[#5A6D80]">
              <Tag className="w-8 h-8 mx-auto text-[#889AA9] mb-2" />
              <p className="text-sm font-medium">No promotional discount rules found.</p>
              <p className="text-xs text-[#889AA9] mt-1">Click "Add Discount Rule" above to create an automated volume discount (e.g. 10% off for 5+ seats).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
                <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
                  <tr>
                    <th className="py-3 px-4">Discount Code</th>
                    <th className="py-3 px-4">Benefit</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Trigger Condition</th>
                    <th className="py-3 px-4">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3]/60 font-sans">
                  {discounts.map(d => (
                    <tr key={d.id} className="hover:bg-[#FBF9F5] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2B4257] text-xs">
                        {d.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#101E2B] font-mono">
                        {d.discountType === 'PERCENTAGE' ? `${d.value.toFixed(1)}% OFF` : `-$${d.value.toFixed(2)}`}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5A6D80]">
                        {d.discountType}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#101E2B]">
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E9EFF5] text-[#2B4257] border border-[#CBD7E2]">
                          {d.appliesTo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE TAX MODAL */}
      {showTaxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="text-base font-semibold text-[#101E2B]">Add Statutory Tax Rate</h3>
              <button type="button" onClick={() => setShowTaxModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTax} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard GST 18%"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Rate Percent (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="18.00"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="text-base font-semibold text-[#101E2B]">Add Promotional Discount Rule</h3>
              <button type="button" onClick={() => setShowDiscountModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateDiscount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Discount Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VOLUME10"
                  value={discCode}
                  onChange={(e) => setDiscCode(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#2B4257] font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">Discount Type</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as DiscountType)}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:ring-2 focus:ring-[#2B4257]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.00"
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:ring-2 focus:ring-[#2B4257]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">Min Seats</label>
                  <input
                    type="number"
                    value={discMinQty}
                    onChange={(e) => setDiscMinQty(e.target.value)}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:ring-2 focus:ring-[#2B4257]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discMinPurchase}
                    onChange={(e) => setDiscMinPurchase(e.target.value)}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:ring-2 focus:ring-[#2B4257]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">Scope</label>
                  <select
                    value={discScope}
                    onChange={(e) => setDiscScope(e.target.value as DiscountScope)}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:bg-white focus:ring-2 focus:ring-[#2B4257]"
                  >
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="PRODUCT">PRODUCT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
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

export default BillingRulesPage;