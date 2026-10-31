import React, { useState, useEffect } from 'react';
import {
  Plus,
  Tag,
  CheckCircle2,
  Calendar,
  Calculator,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import type { Discount, DiscountType, DiscountScope, Product } from '../../types';
import { Button, Input, Badge, Card, Modal, Select, DataTable, type Column } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export const DiscountsTab: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('0');
  const [minQuantity, setMinQuantity] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [appliesTo, setAppliesTo] = useState<DiscountScope>('SUBSCRIPTION');
  const [productId, setProductId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulator Widget State
  const [simCode, setSimCode] = useState('');
  const [simAmount, setSimAmount] = useState('1000');
  const [simQty, setSimQty] = useState('1');
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchDiscountsAndProducts = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [discRes, prodRes] = await Promise.all([
        api.get<Discount[]>('/discounts'),
        api.get<Product[]>('/products'),
      ]);
      setDiscounts(discRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load discount rules';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountsAndProducts();
  }, []);

  const openCreateModal = () => {
    setCode('');
    setDiscountType('PERCENTAGE');
    setValue('10');
    setMinPurchaseAmount('0');
    setMinQuantity('1');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setUsageLimit('100');
    setAppliesTo('SUBSCRIPTION');
    setProductId('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!code.trim()) {
      errors.code = 'Discount code is required';
    } else if (code.trim().length < 3) {
      errors.code = 'Code must be at least 3 characters';
    }

    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) {
      errors.value = 'Discount value must be greater than 0';
    } else if (discountType === 'PERCENTAGE' && val > 100) {
      errors.value = 'Percentage discount cannot exceed 100%';
    }

    if (appliesTo === 'PRODUCT' && !productId) {
      errors.productId = 'Product must be selected for product-level discounts';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        value: parseFloat(value),
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
        minQuantity: minQuantity ? parseInt(minQuantity, 10) : 1,
        startDate: startDate || null,
        endDate: endDate || null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : 100,
        appliesTo,
        productId: appliesTo === 'PRODUCT' && productId ? parseInt(productId, 10) : null,
      };

      await api.post('/discounts', payload);
      setIsModalOpen(false);
      await fetchDiscountsAndProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create discount rule';
      setFormErrors((prev) => ({
        ...prev,
        code: msg,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this discount rule?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      await fetchDiscountsAndProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete discount rule';
      alert(msg);
    }
  };

  const handleTestDiscount = async () => {
    if (!simCode.trim()) return;
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await api.post('/discounts/validate', {
        code: simCode.trim(),
        amount: parseFloat(simAmount) || 0,
        quantity: parseInt(simQty, 10) || 1,
      });
      setSimResult(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation request failed';
      setSimResult({
        valid: false,
        message: msg,
        discountAmount: 0,
        finalAmount: parseFloat(simAmount) || 0,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const columns: Column<Discount>[] = [
    {
      header: 'Promo Code',
      accessorKey: 'code',
      cell: (row: Discount) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#F5F0E6] text-[#2B4257]">
            <Tag className="h-4 w-4" />
          </div>
          <span className="font-mono font-bold text-[#101E2B] tracking-wider text-sm">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      header: 'Benefit Value',
      accessorKey: 'value',
      cell: (row: Discount) => (
        <span className="font-bold text-[#101E2B] text-sm">
          {row.discountType === 'PERCENTAGE' ? `${row.value}% OFF` : `${formatCurrency(Number(row.value))} OFF`}
        </span>
      ),
    },
    {
      header: 'Scope',
      accessorKey: 'appliesTo',
      cell: (row: Discount) => (
        <div className="text-xs">
          <Badge variant={row.appliesTo === 'SUBSCRIPTION' ? 'info' : 'purple'}>
            {row.appliesTo === 'SUBSCRIPTION' ? 'Entire Subscription' : 'Specific Product'}
          </Badge>
          {row.appliesTo === 'PRODUCT' && row.productId && (
            <span className="block mt-0.5 text-[#5A6D80] font-medium truncate max-w-[140px]">
              {products.find((p) => p.id === row.productId)?.name || `Prod #${row.productId}`}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Redemptions',
      accessorKey: 'timesUsed',
      cell: (row: Discount) => {
        const used = row.timesUsed || 0;
        const limit = row.usageLimit || 100;
        const percent = Math.min(100, Math.round((used / limit) * 100));
        return (
          <div className="w-28 space-y-1">
            <div className="flex justify-between text-xs text-[#5A6D80]">
              <span>{used} used</span>
              <span>/ {limit}</span>
            </div>
            <div className="w-full bg-[#E5DFD3] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2B4257] h-full rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Validity Period',
      accessorKey: 'startDate',
      cell: (row: Discount) => (
        <div className="text-xs text-[#5A6D80] flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-[#889AA9] shrink-0" />
          <span>
            {row.startDate || 'Anytime'} → {row.endDate || 'No Expiry'}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row: Discount) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSimCode(row.code);
              setSimAmount('1000');
            }}
            title="Load in Calculator"
            className="text-[#2B4257] hover:text-[#101E2B] hover:bg-[#F5F0E6]"
            leftIcon={<Calculator className="h-3.5 w-3.5" />}
          >
            Test
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            title="Delete Discount"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#101E2B] tracking-tight">Promotional Discount Rules</h3>
          <p className="text-sm text-[#5A6D80]">
            Configure tiered percentage or fixed dollar discounts, usage limits, minimum quantities, and expiry dates.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          variant="primary"
          className="shadow-sm"
        >
          Create Discount Rule
        </Button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={fetchDiscountsAndProducts}>
            Retry
          </Button>
        </div>
      )}

      {/* Grid: Main Table + Live Discount Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden p-0 border-[#E5DFD3] shadow-xs">
            <DataTable
              columns={columns}
              data={discounts}
              isLoading={isLoading}
              emptyMessage="No discount rules configured yet. Click 'Create Discount Rule' to add a 10% promo code or welcome bonus."
            />
          </Card>
        </div>

        {/* Live Simulator Widget (1 col) */}
        <div className="lg:col-span-1">
          <Card className="p-5 border-[#E5DFD3] bg-gradient-to-b from-[#FAF7F0] to-white shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#2B4257] text-[#FAF7F0]">
                <Calculator className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-[#101E2B] text-sm">Discount Calculator</h4>
            </div>
            <p className="text-xs text-[#5A6D80]">
              Live server-side validation testing the same decimal calculation engine used during quotation & invoice generation.
            </p>

            <div className="space-y-3 pt-1">
              <Input
                label="Promo Code"
                placeholder="e.g. ODOO50"
                value={simCode}
                onChange={(e) => setSimCode(e.target.value.toUpperCase())}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Subtotal ($)"
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                />
                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={simQty}
                  onChange={(e) => setSimQty(e.target.value)}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleTestDiscount}
                isLoading={isSimulating}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Simulate Discount
              </Button>

              {simResult && (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    simResult.valid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {simResult.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    )}
                    {simResult.message}
                  </p>
                  {simResult.valid && (
                    <div className="mt-2 space-y-1 font-mono text-[11px] pt-1.5 border-t border-emerald-200/60">
                      <div className="flex justify-between">
                        <span>Discount Deducted:</span>
                        <span className="font-bold text-emerald-700">
                          -{formatCurrency(simResult.discountAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#101E2B] font-bold">
                        <span>Final Billable:</span>
                        <span>{formatCurrency(simResult.finalAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Create Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Promotional Discount Rule"
        description="Configure rules for automatically discounting subscriptions or individual product lines."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Save Discount Rule
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Promo Code"
              placeholder="e.g. WELCOME10, ODOO50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              error={formErrors.code}
              helperText="Unique uppercase promo voucher identifier"
              required
              autoFocus
            />

            <Select
              label="Discount Type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%) Off' },
                { value: 'FIXED_AMOUNT', label: 'Fixed Dollar ($) Off' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
              type="number"
              step="0.01"
              min="0.01"
              placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10.00' : 'e.g. 50.00'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={formErrors.value}
              required
            />

            <Select
              label="Application Scope"
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as DiscountScope)}
              options={[
                { value: 'SUBSCRIPTION', label: 'Entire Subscription (All Lines)' },
                { value: 'PRODUCT', label: 'Specific Product Only' },
              ]}
              required
            />
          </div>

          {appliesTo === 'PRODUCT' && (
            <Select
              label="Target Product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              options={[
                { value: '', label: '-- Select Target Product --' },
                ...products.map((p) => ({ value: p.id.toString(), label: `${p.name} ($${p.salesPrice})` })),
              ]}
              error={formErrors.productId}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <Input
              label="Minimum Purchase Amount ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={minPurchaseAmount}
              onChange={(e) => setMinPurchaseAmount(e.target.value)}
              helperText="Zero means no minimum order requirement"
            />

            <Input
              label="Minimum Quantity"
              type="number"
              min="1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              helperText="Minimum item quantity required to trigger"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Expiry Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              helperText="Leave empty for indefinite validity"
            />

            <Input
              label="Max Usage Limit"
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              helperText="Max total redemptions permitted"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default DiscountsTab;
