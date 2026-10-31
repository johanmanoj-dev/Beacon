import React, { useState, useEffect } from 'react';
import { Users, Plus, Building2, Mail, Phone, MapPin, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import type { Customer } from '../../types';

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Customer[]>('/customers');
      setCustomers(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactEmail.trim()) {
      setError('Company name and email are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/customers', {
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });

      setSuccessMsg(`Customer "${companyName}" added successfully!`);
      setShowModal(false);
      setCompanyName('');
      setContactEmail('');
      setPhone('');
      setAddress('');
      fetchCustomers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer business accounts, contacts, and linked user credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

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

      {customers.length === 0 && !loading ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No customers registered</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Add business client profiles or onboard customers via the registration page.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Company / Business</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-6">Address</th>
                  <th className="py-3.5 px-4">Portal Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{c.companyName}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {c.contactEmail}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {c.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {c.address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate max-w-xs">{c.address}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {c.userId ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700">
                          Portal Linked
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                          Direct Client
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing / Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. finance@acme.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerListPage;
