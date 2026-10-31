import React, { useState, useEffect } from 'react';
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

  const fetchData = async () => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load quotations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleLineFieldChange = (index: number, field: keyof NewItemLine, value: any) => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create quotation');
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create template');
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update quotation status');
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to convert quotation to subscription');
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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
      case 'QUOTATION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Quotation Sent</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Converted</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations & Offers</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Track 1 • Johan</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Build bespoke customer quotes with variant pricing, manage reusable templates, and convert directly into recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            + New Template
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
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
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700 text-sm">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-emerald-800">Success</h4>
            <p className="text-xs text-emerald-600 mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 text-sm">✕</button>
        </div>
      )}

      {/* Templates Quick Bar */}
      {templates.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Reusable Quotation Templates ({templates.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs shadow-2xs"
              >
                <span className="font-medium text-slate-800">{tpl.name}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{tpl.planName} ({tpl.billingInterval})</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-600 font-medium">{tpl.validityDays}d validity</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotations Master Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">All Quotations</h3>
            <p className="text-xs text-slate-500">Live synchronized with brightloop_db</p>
          </div>
          <span className="text-xs text-slate-400">{quotations.length} total records</span>
        </div>

        {loading && quotations.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-800">No Quotations Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Get started by creating your first quotation with variant adjustments and line items.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-sans">
                {quotations.map(q => {
                  const isExpanded = expandedQuoteId === q.id;
                  const isProcessing = actionLoadingId === q.id;
                  return (
                    <React.Fragment key={q.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900 flex items-center gap-2">
                          <button
                            onClick={() => setExpandedQuoteId(isExpanded ? null : q.id)}
                            className="text-slate-400 hover:text-slate-600 text-xs px-1 py-0.5 rounded border border-slate-200"
                            title="Expand lines"
                          >
                            {isExpanded ? '▼' : '►'}
                          </button>
                          {q.quotationNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{q.customerName || 'Customer #' + q.customerId}</div>
                          <div className="text-xs text-slate-400">{q.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800">{q.planName || 'Plan #' + q.planId}</span>
                          <span className="ml-1.5 text-xs text-slate-500 font-mono">({q.billingInterval})</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {q.validUntil}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                          ${Number(q.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                  title="Send quote to customer"
                                >
                                  <Send className="w-3 h-3" /> Send
                                </button>
                                <button
                                  onClick={() => handleStatusChange(q.id, 'CONFIRMED')}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                                title="Confirm quote"
                              >
                                <Check className="w-3 h-3" /> Confirm
                              </button>
                            )}

                            {q.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleConvertToSubscription(q.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
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
                              <span className="text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Active Sub
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Line Items Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-b border-slate-200">
                          <td colSpan={7} className="py-3 px-6">
                            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                  Line Items Breakdown ({q.items?.length || 0})
                                </span>
                                <div className="text-xs space-x-3 text-slate-500 font-mono">
                                  <span>Subtotal: ${Number(q.subtotal).toFixed(2)}</span>
                                  <span>Tax (18%): ${Number(q.taxAmount).toFixed(2)}</span>
                                  <span className="font-bold text-slate-900">Total: ${Number(q.totalAmount).toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="divide-y divide-slate-100 text-xs">
                                {q.items?.map((item, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between">
                                    <div>
                                      <span className="font-semibold text-slate-800">{item.productName || 'Product #' + item.productId}</span>
                                      {item.variantName && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                          Variant: {item.variantName}
                                        </span>
                                      )}
                                      <span className="ml-2 text-slate-400">Qty: {item.quantity}</span>
                                    </div>
                                    <div className="font-mono text-slate-700">
                                      ${Number(item.unitPrice).toFixed(2)} ea × {item.quantity} = <span className="font-semibold text-slate-900">${Number(item.lineTotal).toFixed(2)}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Create New Quotation</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4">
              {/* Template Picker */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pre-fill from Template (Optional)
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => handleTemplateSelect(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Plan *
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(Number(e.target.value))}
                    required
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valid Until Date *
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Dynamic Line Items Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Quotation Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                    No custom items added. Quotation will automatically invoice the plan's default base price.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {lines.map((line, idx) => {
                      const selectedProd = products.find(p => p.id === line.productId);
                      return (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            {/* Product */}
                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Product</label>
                              <select
                                value={line.productId}
                                onChange={e => handleProductChange(idx, Number(e.target.value))}
                                className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
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
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Variant</label>
                              {selectedProd && selectedProd.variants && selectedProd.variants.length > 0 ? (
                                <select
                                  value={line.variantId || ''}
                                  onChange={e => handleVariantChange(idx, e.target.value ? Number(e.target.value) : null)}
                                  className="w-full text-xs rounded border border-amber-300 bg-amber-50/50 p-1.5 font-medium text-amber-900"
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
                                  className="w-full text-xs rounded border border-slate-200 bg-slate-100 p-1.5 text-slate-400"
                                />
                              )}
                            </div>

                            {/* Quantity */}
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={e => handleLineFieldChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-center font-mono"
                              />
                            </div>

                            {/* Delete Button */}
                            <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1 border-t border-slate-200">
                            <span>Unit Price: ${Number(line.unitPrice).toFixed(2)}</span>
                            <span>Tax: {line.taxRatePercent}%</span>
                            <span className="font-semibold text-slate-900">
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
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>${calcSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Standard GST (18%):</span>
                  <span>${calcTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                  <span>Estimated Total:</span>
                  <span>${calcTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-semibold text-slate-900">New Quotation Template</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Monthly Bundle"
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Billing Plan *</label>
                <select
                  value={tplPlanId}
                  onChange={e => setTplPlanId(Number(e.target.value))}
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={tplValidityDays}
                  onChange={e => setTplValidityDays(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={tplNotes}
                  onChange={e => setTplNotes(e.target.value)}
                  placeholder="Standard 30-day price lock with Net 15 payment terms..."
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
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
