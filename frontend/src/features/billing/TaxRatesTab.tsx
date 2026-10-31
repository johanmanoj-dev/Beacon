import React, { useState, useEffect } from 'react';
import { Plus, Percent, CheckCircle2, XCircle, Trash2, Edit2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import type { TaxRate } from '../../types';
import { Button, Input, Badge, Card, Modal, DataTable, type Column } from '../../components/ui';

export const TaxRatesTab: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [name, setName] = useState('');
  const [ratePercent, setRatePercent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ name?: string; ratePercent?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTaxRates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<TaxRate[]>('/taxes');
      setTaxRates(response.data || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load tax rates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const openCreateModal = () => {
    setEditingTax(null);
    setName('');
    setRatePercent('');
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (tax: TaxRate) => {
    setEditingTax(tax);
    setName(tax.name);
    setRatePercent(tax.ratePercent.toString());
    setIsActive(tax.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { name?: string; ratePercent?: string } = {};
    if (!name.trim()) {
      errors.name = 'Tax rate name is required';
    }
    const rate = parseFloat(ratePercent);
    if (isNaN(rate)) {
      errors.ratePercent = 'Valid percentage rate is required';
    } else if (rate < 0 || rate > 100) {
      errors.ratePercent = 'Rate percent must be between 0.00% and 100.00%';
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
        name: name.trim(),
        ratePercent: parseFloat(ratePercent),
        isActive,
      };

      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, payload);
      } else {
        await api.post('/taxes', payload);
      }

      setIsModalOpen(false);
      await fetchTaxRates();
    } catch (err: any) {
      setFormErrors((prev) => ({
        ...prev,
        name: err.message || 'Failed to save tax rate',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this tax rate rule?')) return;
    try {
      await api.delete(`/taxes/${id}`);
      await fetchTaxRates();
    } catch (err: any) {
      alert(err.message || 'Failed to delete tax rate');
    }
  };

  const handleToggleActive = async (tax: TaxRate) => {
    try {
      await api.put(`/taxes/${tax.id}`, {
        name: tax.name,
        ratePercent: tax.ratePercent,
        isActive: !tax.isActive,
      });
      await fetchTaxRates();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const columns: Column<TaxRate>[] = [
    {
      header: 'Tax Rule Name',
      accessorKey: 'name',
      className: 'font-semibold text-slate-900',
      cell: (row: TaxRate) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Percent className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">{row.name}</span>
            <span className="text-xs text-slate-400">Rule ID: #{row.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tax Rate (%)',
      accessorKey: 'ratePercent',
      cell: (row: TaxRate) => (
        <span className="inline-flex items-center font-mono font-bold text-slate-800 text-sm">
          {Number(row.ratePercent).toFixed(2)}%
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (row: TaxRate) => (
        <button
          onClick={() => handleToggleActive(row)}
          title="Click to toggle active status"
          className="cursor-pointer transition-transform active:scale-95"
        >
          {row.isActive ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Active
            </Badge>
          ) : (
            <Badge variant="neutral" className="gap-1 opacity-70">
              <XCircle className="h-3 w-3" /> Inactive
            </Badge>
          )}
        </button>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row: TaxRate) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEditModal(row)}
            title="Edit Tax Rate"
            leftIcon={<Edit2 className="h-3.5 w-3.5 text-slate-600" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
            title="Delete Tax Rate"
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
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tax Configurations</h3>
          <p className="text-sm text-slate-500">
            Define system-wide statutory taxes (e.g. 18% GST) applied to recurring subscriptions and invoices.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          variant="primary"
          className="shadow-sm"
        >
          Create Tax Rule
        </Button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={fetchTaxRates}>
            Retry
          </Button>
        </div>
      )}

      {/* Tax Rates Table */}
      <Card className="overflow-hidden p-0 border-slate-200">
        <DataTable
          columns={columns}
          data={taxRates}
          isLoading={isLoading}
          emptyMessage="No tax rates configured yet. Click 'Create Tax Rule' to add GST or standard sales tax."
        />
      </Card>

      {/* Create / Edit Tax Rate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? 'Edit Tax Rate Rule' : 'New Tax Rate Configuration'}
        description="Statutory tax rates are automatically applied to line items in Quotations and Invoices."
        size="md"
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
              {editingTax ? 'Save Changes' : 'Create Tax Rule'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Tax Rule Name"
            placeholder="e.g. GST (Standard), VAT 20%, State Tax"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={formErrors.name}
            required
            autoFocus
          />

          <Input
            label="Rate Percentage (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="e.g. 18.00"
            value={ratePercent}
            onChange={(e) => setRatePercent(e.target.value)}
            error={formErrors.ratePercent}
            helperText="Percentage between 0.00% and 100.00% added to taxable lines"
            leftIcon={<Percent className="h-4 w-4 text-slate-400" />}
            required
          />

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Rule is currently Active (auto-available on new quotes)
              </span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TaxRatesTab;
