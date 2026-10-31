import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Pencil, CheckCircle2, AlertCircle, Layers, Tag, Calendar, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import type { Product, Plan, ProductType, BillingInterval } from '../../types';

export function CataloguePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'plans'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Edit Product Form State
  const [editProdName, setEditProdName] = useState('');
  const [editProdType, setEditProdType] = useState<ProductType>('SOFTWARE');
  const [editProdSalesPrice, setEditProdSalesPrice] = useState('1000.00');
  const [editProdCostPrice, setEditProdCostPrice] = useState('400.00');
  const [editProdNotes, setEditProdNotes] = useState('');
  const [editVariants, setEditVariants] = useState<{ id?: number; variantName: string; priceAdjustment: string }[]>([]);

  // New Product Form State
  const [prodName, setProdName] = useState('');
  const [prodType, setProdType] = useState<ProductType>('SOFTWARE');
  const [prodSalesPrice, setProdSalesPrice] = useState('1000.00');
  const [prodCostPrice, setProdCostPrice] = useState('400.00');
  const [prodNotes, setProdNotes] = useState('Core subscription enterprise software');
  const [variants, setVariants] = useState<{ variantName: string; priceAdjustment: string }[]>([
    { variantName: 'Brand: Odoo', priceAdjustment: '560.00' }
  ]);

  // New Plan Form State
  const [planProductId, setPlanProductId] = useState('');
  const [planName, setPlanName] = useState('');
  const [planInterval, setPlanInterval] = useState<BillingInterval>('MONTHLY');
  const [planBasePrice, setPlanBasePrice] = useState('1500.00');
  const [planMinQty, setPlanMinQty] = useState('1');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planAutoClose, setPlanAutoClose] = useState(false);
  const [planCanPause, setPlanCanPause] = useState(true);

  const fetchCatalogue = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, planRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get<Plan[]>('/plans')
      ]);
      setProducts(prodRes.data);
      setPlans(planRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch catalogue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const handleAddVariant = () => {
    setVariants([...variants, { variantName: '', priceAdjustment: '0.00' }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'variantName' | 'priceAdjustment', value: string) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setError('Product name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: prodName.trim(),
        productType: prodType,
        salesPrice: parseFloat(prodSalesPrice) || 0,
        costPrice: parseFloat(prodCostPrice) || 0,
        notes: prodNotes,
        variants: variants
          .filter(v => v.variantName.trim())
          .map(v => ({
            variantName: v.variantName.trim(),
            priceAdjustment: parseFloat(v.priceAdjustment) || 0
          }))
      };

      await api.post('/products', payload);
      setSuccessMsg(`Product "${prodName}" created successfully!`);
      setShowProductModal(false);
      setProdName('');
      setVariants([{ variantName: 'Brand: Odoo', priceAdjustment: '560.00' }]);
      fetchCatalogue();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdType(product.productType);
    setEditProdSalesPrice(String(product.salesPrice));
    setEditProdCostPrice(String(product.costPrice));
    setEditProdNotes(product.notes || '');
    setEditVariants(
      (product.variants || []).map((v) => ({
        id: v.id,
        variantName: v.variantName,
        priceAdjustment: String(v.priceAdjustment),
      }))
    );
    setShowEditProductModal(true);
  };

  const handleAddEditVariant = () => {
    setEditVariants([...editVariants, { variantName: '', priceAdjustment: '0.00' }]);
  };

  const handleRemoveEditVariant = (index: number) => {
    setEditVariants(editVariants.filter((_, i) => i !== index));
  };

  const handleEditVariantChange = (index: number, field: 'variantName' | 'priceAdjustment', value: string) => {
    const updated = [...editVariants];
    updated[index][field] = value;
    setEditVariants(updated);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName.trim()) {
      setError('Product name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: editProdName.trim(),
        productType: editProdType,
        salesPrice: parseFloat(editProdSalesPrice) || 0,
        costPrice: parseFloat(editProdCostPrice) || 0,
        notes: editProdNotes,
        variants: editVariants
          .filter((v) => v.variantName.trim())
          .map((v) => ({
            id: v.id,
            variantName: v.variantName.trim(),
            priceAdjustment: parseFloat(v.priceAdjustment) || 0,
          })),
      };

      await api.put(`/products/${editingProduct.id}`, payload);
      setSuccessMsg(`Product "${editProdName}" & variants updated successfully!`);
      setShowEditProductModal(false);
      setEditingProduct(null);
      fetchCatalogue();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      setError('Plan name cannot be empty');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: planName.trim(),
        productId: planProductId ? Number(planProductId) : null,
        billingInterval: planInterval,
        basePrice: parseFloat(planBasePrice) || 0,
        minQuantity: parseInt(planMinQty, 10) || 1,
        startDate: planStartDate || null,
        endDate: planEndDate || null,
        autoCloseOnEnd: planAutoClose,
        canPause: planCanPause
      };

      await api.post('/plans', payload);
      setSuccessMsg(`Plan "${planName}" created successfully!`);
      setShowPlanModal(false);
      setPlanName('');
      setPlanProductId('');
      fetchCatalogue();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
      setSuccessMsg('Product deleted successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product';
      setError(msg);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      setPlans(plans.filter(p => p.id !== id));
      setSuccessMsg('Plan deleted successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete plan';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Billing Plans</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure software products, variant pricing increments (e.g. Odoo brand +$560), and recurring plan intervals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCatalogue}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'products' ? (
            <button
              onClick={() => setShowProductModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          ) : (
            <button
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Create Plan
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          Products & Variants ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition ${
            activeTab === 'plans'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Subscription Plans ({plans.length})
        </button>
      </div>

      {/* Products Tab View */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {products.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-3">
              <Package className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">No products configured yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Create Brightloop's core software products and add-ons with custom variant price rules.
              </p>
              <button
                onClick={() => setShowProductModal(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Product Name</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Base Sales Price</th>
                      <th className="py-3.5 px-4">Cost Price</th>
                      <th className="py-3.5 px-6">Variants & Adjustments</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-medium text-slate-900">
                          {product.name}
                          {product.notes && (
                            <p className="text-xs text-slate-400 font-normal mt-0.5">{product.notes}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                            product.productType === 'SOFTWARE' ? 'bg-indigo-50 text-indigo-700' :
                            product.productType === 'ADDON' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {product.productType}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          ${Number(product.salesPrice).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          ${Number(product.costPrice).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-between gap-2">
                            {product.variants && product.variants.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {product.variants.map((v) => (
                                  <span
                                    key={v.id}
                                    onClick={() => handleOpenEditProduct(product)}
                                    className="cursor-pointer inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 text-xs px-2 py-0.5 rounded transition"
                                    title="Click to edit variants"
                                  >
                                    <Tag className="h-3 w-3" />
                                    <span>{v.variantName}</span>
                                    <strong className="text-blue-900">
                                      (+${Number(v.priceAdjustment).toFixed(2)})
                                    </strong>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Standard (No variants)</span>
                            )}
                            <button
                              onClick={() => handleOpenEditProduct(product)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline shrink-0"
                            >
                              + Manage
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(product)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                              title="Edit product and its variants"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans Tab View */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {plans.length === 0 && !loading ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-3">
              <Layers className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">No subscription plans created</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Set up recurring plans with billing intervals (Daily, Weekly, Monthly, Yearly) and lifecycle rules.
              </p>
              <button
                onClick={() => setShowPlanModal(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Create Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-blue-600">
                          {plan.billingInterval} Plan
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{plan.name}</h3>
                        {plan.productName ? (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/60 rounded px-2 py-0.5 w-fit">
                            <Package className="h-3 w-3 text-blue-600" />
                            <span>Product: <strong className="text-slate-800">{plan.productName}</strong></span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 italic">
                            <span>Standalone Service</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        Min Qty: {plan.minQuantity}
                      </span>
                    </div>

                    <div className="border-t border-b border-slate-100 py-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">${Number(plan.basePrice).toFixed(2)}</span>
                        <span className="text-xs text-slate-500 font-medium">/{plan.billingInterval.toLowerCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Can pause: <strong>{plan.canPause ? 'Yes' : 'No'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Auto-close on end: <strong>{plan.autoCloseOnEnd ? 'Yes' : 'No'}</strong></span>
                      </div>
                      {plan.startDate && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Valid from {plan.startDate} {plan.endDate ? `to ${plan.endDate}` : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Suite"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={prodType}
                    onChange={(e) => setProdType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="ADDON">Add-on</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodSalesPrice}
                    onChange={(e) => setProdSalesPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={prodCostPrice}
                  onChange={(e) => setProdCostPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              {/* Dynamic Variants Section (e.g. Odoo brand +$560) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">Product Variants & Price Bumps</label>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Variant
                  </button>
                </div>

                {variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                    <input
                      type="text"
                      placeholder="e.g. Brand: Odoo"
                      value={v.variantName}
                      onChange={(e) => handleVariantChange(i, 'variantName', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-blue-600"
                    />
                    <div className="flex items-center gap-1 w-28">
                      <span className="text-xs text-slate-400">+$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="560.00"
                        value={v.priceAdjustment}
                        onChange={(e) => handleVariantChange(i, 'priceAdjustment', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-blue-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Price Preview */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg text-xs text-blue-900 flex justify-between items-center">
                  <span>Base Price: <strong>${parseFloat(prodSalesPrice) || 0}</strong></span>
                  {variants.length > 0 && variants[0].variantName && (
                    <span>With {variants[0].variantName}: <strong>${(parseFloat(prodSalesPrice) || 0) + (parseFloat(variants[0].priceAdjustment) || 0)}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Subscription Plan</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catalogue Product (Optional / Recommended)
                </label>
                <select
                  value={planProductId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setPlanProductId(selectedId);
                    if (selectedId) {
                      const selectedProd = products.find(p => String(p.id) === selectedId);
                      if (selectedProd) {
                        if (!planName) {
                          setPlanName(`${selectedProd.name} Plan`);
                        }
                        if (selectedProd.salesPrice) {
                          setPlanBasePrice(String(selectedProd.salesPrice));
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600 bg-white"
                >
                  <option value="">-- No linked product (Standalone / Generic) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.salesPrice).toFixed(2)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Link this billing schedule directly to an inventory product from your catalogue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Standard Enterprise"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Interval *</label>
                  <select
                    value={planInterval}
                    onChange={(e) => setPlanInterval(e.target.value as BillingInterval)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={planBasePrice}
                    onChange={(e) => setPlanBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={planMinQty}
                  onChange={(e) => setPlanMinQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="flex items-center gap-2 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={planAutoClose}
                    onChange={(e) => setPlanAutoClose(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Auto-close subscription when end date arrives
                </label>
                <label className="flex items-center gap-2 text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={planCanPause}
                    onChange={(e) => setPlanCanPause(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Allow pausing and resuming subscription
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product & Variants Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Product & Variants</h3>
                  <p className="text-xs text-slate-500">Update pricing, product details, and variant adjustments</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={editProdType}
                    onChange={(e) => setEditProdType(e.target.value as ProductType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="ADDON">Add-on</option>
                    <option value="SERVICE">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editProdSalesPrice}
                    onChange={(e) => setEditProdSalesPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editProdCostPrice}
                  onChange={(e) => setEditProdCostPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={editProdNotes}
                  onChange={(e) => setEditProdNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              {/* Dynamic Variants Editor Section */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">Product Variants & Price Adjustments</label>
                    <span className="text-[11px] text-slate-400">Edit variant names and additional charges</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditVariant}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2 py-1 rounded bg-blue-50 border border-blue-200/60"
                  >
                    <Plus className="h-3 w-3" /> Add Variant
                  </button>
                </div>

                {editVariants.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No variants added yet. Click &quot;Add Variant&quot; above to create one.</p>
                ) : (
                  editVariants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="e.g. Brand: Odoo"
                          value={v.variantName}
                          onChange={(e) => handleEditVariantChange(i, 'variantName', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-blue-600"
                        />
                      </div>
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-xs text-slate-400">+$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="560.00"
                          value={v.priceAdjustment}
                          onChange={(e) => handleEditVariantChange(i, 'priceAdjustment', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs focus:outline-blue-600"
                        />
                      </div>
                      <div className="text-right w-24">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ${((parseFloat(editProdSalesPrice) || 0) + (parseFloat(v.priceAdjustment) || 0)).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditVariant(i)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200/50"
                        title="Remove Variant"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}

                {/* Price Preview */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg text-xs text-blue-900 flex justify-between items-center">
                  <span>Base Sales Price: <strong>${parseFloat(editProdSalesPrice) || 0}</strong></span>
                  <span>Active Variants: <strong>{editVariants.length}</strong></span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CataloguePage;
