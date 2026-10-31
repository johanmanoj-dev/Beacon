import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, CheckCircle2, AlertCircle, RefreshCw,
  Send, Check, ArrowRight, Trash2, Layers
} from 'lucide-react';
import api from '../../services/api';
import type { Quotation, QuotationTemplate, Customer, Plan, Product } from '../../types';

interface NewItemLine {
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
}

export function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);

  // New Quotation Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [validUntil, setValidUntil] = useState('');
  const [lines, setLines] = useState<NewItemLine[]>([]);

  // New Template Form State
  const [tplName, setTplName] = useState('');
  const [tplPlanId, setTplPlanId] = useState<number | ''>('');
  const [tplValidityDays, setTplValidityDays] = useState('30');
  const [tplNotes, setTplNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [quotesRes, custRes, planRes, prodRes, tmplRes] = await Promise.all([
        api.get<Quotation[]>('/quotations'),
        api.get<Customer[]>('/customers'),
        api.get<Plan[]>('/plans'),
        api.get<Product[]>('/products'),
        api.get<QuotationTemplate[]>('/quotation-templates')
      ]);

      setQuotations(quotesRes.data);
      setCustomers(custRes.data);
      setPlans(planRes.data);
      setProducts(prodRes.data);
      setTemplates(tmplRes.data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load quotations data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTemplateSelect = (tplId: number | '') => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => t.id === Number(tplId));
    if (tpl) {
      setSelectedPlanId(tpl.planId);
      const days = tpl.validityDays || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      setValidUntil(targetDate.toISOString().split('T')[0]);
    }
  };

  const handleAddLine = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    const initialPrice = firstProd.salesPrice;
    setLines([
      ...lines,
      {
        productId: firstProd.id,
        variantId: firstProd.variants && firstProd.variants.length > 0 ? firstProd.variants[0].id : null,
        quantity: 1,
        unitPrice: initialPrice,
        taxRatePercent: 18.0
      }
    ]);
  };

  const handleProductChange = (index: number, productId: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const updated = [...lines];
    const defaultVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : null;
    let price = prod.salesPrice;
    if (defaultVariant) {
      price = Number(price) + Number(defaultVariant.priceAdjustment);
    }
    updated[index] = {
      ...updated[index],
      productId,
      variantId: defaultVariant ? defaultVariant.id : null,
      unitPrice: price
    };
    setLines(updated);
  };

  const handleVariantChange = (index: number, variantId: number | null) => {
    const line = lines[index];
    const prod = products.find(p => p.id === line.productId);
    if (!prod) return;
    let price = prod.salesPrice;
    if (variantId) {
      const variant = prod.variants?.find(v => v.id === variantId);
      if (variant) {
        price = Number(price) + Number(variant.priceAdjustment);
      }
    }
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      variantId,
      unitPrice: price
    };
    setLines(updated);
  };

  const handleLineFieldChange = (index: number, field: keyof NewItemLine, value: number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Calculations for current lines
  const calcSubtotal = lines.reduce((acc, l) => acc + (Number(l.unitPrice) * Number(l.quantity || 1)), 0);
  const calcTax = lines.reduce((acc, l) => {
    const lineSub = Number(l.unitPrice) * Number(l.quantity || 1);
    return acc + (lineSub * (Number(l.taxRatePercent || 0) / 100));
  }, 0);
  const calcTotal = calcSubtotal + calcTax;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) {
      setError('Please select both a Customer and a Billing Plan');
      return;
    }

    const plan = plans.find(p => p.id === Number(selectedPlanId));
    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity || 1), 0);
    if (plan && plan.minQuantity && totalQty < plan.minQuantity) {
      setError(`Plan requires a minimum quantity of ${plan.minQuantity}. Total quantity is currently ${totalQty}.`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        customerId: Number(selectedCustomerId),
        planId: Number(selectedPlanId),
        templateId: selectedTemplateId ? Number(selectedTemplateId) : null,
        validUntil: validUntil || null,
        items: lines.map(l => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice),
          taxRatePercent: Number(l.taxRatePercent) || 0
        }))
      };

      const res = await api.post<Quotation>('/quotations', payload);
      setSuccessMsg(`Quotation "${res.data.quotationNumber}" created successfully!`);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create quotation';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplPlanId) {
      setError('Template name and Plan are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/quotation-templates', {
        name: tplName.trim(),
        planId: Number(tplPlanId),
        validityDays: parseInt(tplValidityDays, 10) || 30,
        notes: tplNotes
      });
      setSuccessMsg(`Quotation Template "${tplName}" saved!`);
      setShowTemplateModal(false);
      setTplName('');
      setTplPlanId('');
      setTplNotes('');
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create template';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (quoteId: number, newStatus: string) => {
    setActionLoadingId(quoteId);
    setError(null);
    try {
      await api.put(`/quotations/${quoteId}/status?status=${newStatus}`);
      setSuccessMsg(`Quotation status updated to ${newStatus}`);
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update quotation status';
      setError(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConvertToSubscription = async (quoteId: number) => {
    setActionLoadingId(quoteId);
    setError(null);
    try {
      const res = await api.post(`/quotations/${quoteId}/convert`);
      setSuccessMsg(`🎉 Success! Quotation converted to active subscription: ${res.data.subscriptionNumber}`);
      fetchData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to convert quotation to subscription';
      setError(errorMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedPlanId('');
    setSelectedTemplateId('');
    setValidUntil('');
    setLines([]);
  };

  const openCreateModal = () => {
    resetForm();
    if (customers.length > 0) setSelectedCustomerId(customers[0].id);
    if (plans.length > 0) setSelectedPlanId(plans[0].id);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setValidUntil(d.toISOString().split('T')[0]);

    if (products.length > 0) {
      const p = products[0];
      setLines([
        {
          productId: p.id,
          variantId: p.variants && p.variants.length > 0 ? p.variants[0].id : null,
          quantity: 1,
          unitPrice: p.salesPrice,
          taxRatePercent: 18.0
        }
      ]);
    }
    setShowCreateModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#5A6D80] border border-[#E5DFD3]">Draft</span>;
      case 'QUOTATION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9EFF5] text-[#2B4257] border border-[#2B4257]/30">Quotation Sent</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#2B4257] border border-[#2B4257]/30">Converted</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#101E2B]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#101E2B] tracking-tight">Quotations & Offers</h1>
          </div>
          <p className="text-sm text-[#5A6D80] mt-1">
            Build bespoke customer quotes with variant pricing, manage reusable templates, and convert directly into recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#101E2B] bg-[#FAF7F0] border border-[#E5DFD3] rounded-lg hover:bg-[#F5F0E6] transition-colors shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#5A6D80]" />
            + New Template
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-[#101E2B] hover:text-[#182635] border border-[#E5DFD3] rounded-lg hover:bg-[#F5F0E6] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-rose-800">Action Failed</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-emerald-800">Success</h4>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* Templates Quick Bar */}
      {templates.length > 0 && (
        <div className="bg-[#FAF7F0] border border-[#E5DFD3] rounded-lg p-3">
          <div className="text-xs font-semibold text-[#5A6D80] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2B4257]" />
            Reusable Quotation Templates ({templates.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5DFD3] rounded-md text-xs shadow-2xs"
              >
                <span className="font-medium text-[#101E2B]">{tpl.name}</span>
                <span className="text-[#889AA9]">•</span>
                <span className="text-[#5A6D80]">{tpl.planName} ({tpl.billingInterval})</span>
                <span className="text-[#889AA9]">•</span>
                <span className="text-[#2B4257] font-semibold">{tpl.validityDays}d validity</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotations Master Table */}
      <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#101E2B] text-base">All Quotations</h3>
            <p className="text-xs text-[#5A6D80]">Live synchronized with brightloop_db</p>
          </div>
          <span className="text-xs text-[#889AA9]">{quotations.length} total records</span>
        </div>

        {loading && quotations.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#889AA9] mx-auto mb-3" />
            <p className="text-sm text-[#5A6D80]">Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-[#889AA9] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-medium text-[#101E2B]">No Quotations Yet</h3>
            <p className="text-xs text-[#5A6D80] max-w-sm mx-auto mt-1 mb-4">
              Get started by creating your first quotation with variant adjustments and line items.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#FAF7F0] bg-[#2B4257] rounded-lg hover:bg-[#1D2D3D] shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
              <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
                <tr>
                  <th className="py-3 px-4">Quotation #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan & Cycle</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3] font-sans">
                {quotations.map(q => {
                  const isExpanded = expandedQuoteId === q.id;
                  const isProcessing = actionLoadingId === q.id;
                  return (
                    <React.Fragment key={q.id}>
                      <tr className="hover:bg-[#FCFAF6] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-[#101E2B] flex items-center gap-2">
                          <button
                            onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                            className="text-[#889AA9] hover:text-[#101E2B] text-xs px-1.5 py-0.5 rounded border border-[#E5DFD3] hover:bg-[#F5F0E6] cursor-pointer"
                            title="Expand lines"
                          >
                            {isExpanded ? '▼' : '►'}
                          </button>
                          <span className="text-[#2B4257] font-bold">{q.quotationNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#101E2B]">{q.customerName || 'Customer #' + q.customerId}</div>
                          <div className="text-xs text-[#889AA9]">{q.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#101E2B]">{q.planName || 'Plan #' + q.planId}</span>
                          <span className="ml-1.5 text-xs text-[#5A6D80] font-mono">({q.billingInterval})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#5A6D80]">
                          {q.validUntil}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#101E2B]">
                          ${Number(q.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(q.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {q.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(q.id, 'QUOTATION')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2B4257] bg-[#F5F0E6] border border-[#E5DFD3] rounded hover:bg-[#EAE4D7] transition-colors cursor-pointer"
                                  title="Send quote to customer"
                                >
                                  <Send className="w-3 h-3" /> Send
                                </button>
                                <button
                                  onClick={() => handleStatusChange(q.id, 'CONFIRMED')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                                  title="Confirm quote"
                                >
                                  <Check className="w-3 h-3" /> Confirm
                                </button>
                              </>
                            )}

                            {q.status === 'QUOTATION' && (
                              <button
                                onClick={() => handleStatusChange(q.id, 'CONFIRMED')}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="Confirm quote"
                              >
                                <Check className="w-3 h-3" /> Confirm
                              </button>
                            )}

                            {q.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleConvertToSubscription(q.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors cursor-pointer"
                                title="Convert to Active Subscription"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ArrowRight className="w-3.5 h-3.5" />
                                )}
                                Convert to Subscription
                              </button>
                            )}

                            {q.status === 'CONVERTED' && (
                              <span className="text-xs text-[#2B4257] font-medium bg-[#F5F0E6] px-2 py-1 rounded border border-[#E5DFD3] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#2B4257]" /> Active Sub
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Line Items Detail Row */}
                      {isExpanded && (
                        <tr className="bg-[#FAF7F0] border-b border-[#E5DFD3]">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="bg-white border border-[#E5DFD3] rounded-lg p-4 shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-[#101E2B] uppercase tracking-wider">
                                  Line Items Breakdown ({q.items?.length || 0})
                                </span>
                                <div className="text-xs space-x-3 text-[#5A6D80] font-mono">
                                  <span>Subtotal: ${Number(q.subtotal ?? 0).toFixed(2)}</span>
                                  <span>Tax (18%): ${Number(q.taxAmount ?? 0).toFixed(2)}</span>
                                  <span className="font-bold text-[#101E2B]">Total: ${Number(q.totalAmount ?? 0).toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="divide-y divide-[#E5DFD3] text-xs">
                                {q.items?.map((item, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-semibold text-[#101E2B]">{item.productName || 'Product #' + item.productId}</span>
                                      {item.variantName && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#F5F0E6] text-[#2B4257] border border-[#E5DFD3] font-medium">
                                          Variant: {item.variantName}
                                        </span>
                                      )}
                                      <span className="ml-2 text-[#889AA9]">Qty: {item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-[#5A6D80]">
                                      ${Number(item.unitPrice ?? 0).toFixed(2)} ea × {item.quantity} = <span className="font-semibold text-[#101E2B]">${Number(item.lineTotal ?? 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2B4257]" />
                <h3 className="text-base font-semibold text-[#101E2B]">Create New Quotation</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4">
              {/* Template Picker */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">
                    Pre-fill from Template (Optional)
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => handleTemplateSelect(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257]"
                  >
                    <option value="">-- Custom Quote (No template) --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Plan: {t.planName}, {t.validityDays}d)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer and Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257]"
                  >
                    <option value="" disabled>Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactEmail})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101E2B] mb-1">
                    Billing Plan *
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257]"
                  >
                    <option value="" disabled>Select billing plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.billingInterval}) — ${Number(p.basePrice).toFixed(2)} (Min: {p.minQuantity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Validity Date */}
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">
                  Valid Until Date *
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              {/* Dynamic Line Items Section */}
              <div className="pt-2 border-t border-[#E5DFD3]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#101E2B] uppercase tracking-wider">
                    Quotation Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2B4257] bg-[#F5F0E6] hover:bg-[#EAE4D7] px-2.5 py-1 rounded border border-[#E5DFD3] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center py-4 bg-[#FAF7F0] border border-dashed border-[#E5DFD3] rounded-lg text-xs text-[#5A6D80]">
                    No custom items added. Quotation will automatically invoice the plan&apos;s default base price.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {lines.map((line, idx) => {
                      const selectedProd = products.find(p => p.id === line.productId);
                      return (
                        <div key={idx} className="p-3 bg-[#FAF7F0] border border-[#E5DFD3] rounded-lg space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            {/* Product */}
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-medium text-[#5A6D80] mb-0.5">Product</label>
                              <select
                                value={line.productId}
                                onChange={e => handleProductChange(idx, Number(e.target.value))}
                                className="w-full text-xs rounded border border-[#E5DFD3] p-1.5 bg-white text-[#101E2B]"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (${Number(p.salesPrice).toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Variant (if any) */}
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-medium text-[#5A6D80] mb-0.5">Variant</label>
                              {selectedProd && selectedProd.variants && selectedProd.variants.length > 0 ? (
                                <select
                                  value={line.variantId || ''}
                                  onChange={e => handleVariantChange(idx, e.target.value ? Number(e.target.value) : null)}
                                  className="w-full text-xs rounded border border-[#E5DFD3] bg-[#F5F0E6] p-1.5 font-medium text-[#2B4257]"
                                >
                                  <option value="">Base Variant (No Extra)</option>
                                  {selectedProd.variants.map(v => (
                                    <option key={v.id} value={v.id}>
                                      {v.variantName} (+${Number(v.priceAdjustment).toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  disabled
                                  value="Standard (No variants)"
                                  className="w-full text-xs rounded border border-[#E5DFD3] bg-white p-1.5 text-[#889AA9]"
                                />
                              )}
                            </div>

                            {/* Quantity */}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-medium text-[#5A6D80] mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={e => handleLineFieldChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                className="w-full text-xs rounded border border-[#E5DFD3] p-1.5 bg-white text-center font-mono text-[#101E2B]"
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-[#889AA9] hover:text-rose-600 p-1 cursor-pointer"
                                title="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#5A6D80] font-mono pt-1 border-t border-[#E5DFD3]">
                            <span>Unit Price: ${Number(line.unitPrice).toFixed(2)}</span>
                            <span>Tax: {line.taxRatePercent}%</span>
                            <span className="font-semibold text-[#101E2B]">
                              Line Total: ${(Number(line.unitPrice) * Number(line.quantity)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Totals Summary */}
              <div className="bg-[#FAF7F0] border border-[#E5DFD3] rounded-lg p-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-[#5A6D80]">
                  <span>Subtotal:</span>
                  <span>${calcSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5A6D80]">
                  <span>Standard GST (18%):</span>
                  <span>${calcTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#101E2B] text-sm pt-1 border-t border-[#E5DFD3]">
                  <span>Estimated Total:</span>
                  <span>${calcTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2B4257]" />
                <h3 className="text-base font-semibold text-[#101E2B]">New Quotation Template</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Monthly Bundle"
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Associated Billing Plan *</label>
                <select
                  value={tplPlanId}
                  onChange={e => setTplPlanId(Number(e.target.value))}
                  required
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                >
                  <option value="" disabled>Select plan...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billingInterval}) — ${Number(p.basePrice).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={tplValidityDays}
                  onChange={e => setTplValidityDays(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] font-mono focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={tplNotes}
                  onChange={e => setTplNotes(e.target.value)}
                  placeholder="Standard 30-day price lock with Net 15 payment terms..."
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
