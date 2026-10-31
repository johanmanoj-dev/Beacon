import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Building2, Mail, RefreshCw,
  AlertCircle, CheckCircle2, UserCheck, Link as LinkIcon, Unlink, ShieldCheck, Check
} from 'lucide-react';
import api from '../../services/api';
import type { Customer, User } from '../../types';

export function CustomerListPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'staff'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Customer Modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Link User Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingCustomer, setLinkingCustomer] = useState<Customer | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  // Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Password validation checks for staff modal
  const hasMinLen = staffPassword.length > 8;
  const hasUpper = /[A-Z]/.test(staffPassword);
  const hasLower = /[a-z]/.test(staffPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(staffPassword);
  const isStaffPasswordValid = hasMinLen && hasUpper && hasLower && hasSpecial;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custRes, staffRes, usersRes] = await Promise.all([
        api.get<Customer[]>('/customers'),
        api.get<User[]>('/users?role=STAFF'),
        api.get<User[]>('/users')
      ]);
      setCustomers(custRes.data);
      setStaffUsers(staffRes.data);
      setAllUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch directory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      setShowCustomerModal(false);
      setCompanyName('');
      setContactEmail('');
      setPhone('');
      setAddress('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const openLinkUserModal = (c: Customer) => {
    setLinkingCustomer(c);
    setSelectedUserId('');
    setShowLinkModal(true);
  };

  const handleLinkUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingCustomer || !selectedUserId) return;

    setLoading(true);
    setError(null);
    try {
      await api.post(`/customers/${linkingCustomer.id}/link-user?userId=${selectedUserId}`);
      setSuccessMsg(`User linked successfully to ${linkingCustomer.companyName}!`);
      setShowLinkModal(false);
      setLinkingCustomer(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to link user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkUser = async (customerId: number, compName: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/customers/${customerId}/unlink-user`);
      setSuccessMsg(`User unlinked from ${compName}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to unlink user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword) {
      setError('Full name, email, and password are required');
      return;
    }

    if (!isStaffPasswordValid) {
      setError('Password does not satisfy the security policy requirements (>8 chars, uppercase, lowercase, special symbol)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/users/staff', {
        fullName: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        password: staffPassword,
      });

      setSuccessMsg(`Internal staff account "${staffName}" created successfully!`);
      setShowStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (userId: number, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<User>(`/users/${userId}/status`);
      setSuccessMsg(`Staff user "${name}" is now ${res.data.isActive ? 'Active' : 'Deactivated'}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update staff status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User & Customer Directory</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Track 1 • Johan</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer business profiles, link login credentials for self-service portal, and administer internal staff accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'customers' ? (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          ) : (
            <button
              onClick={() => setShowStaffModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Add Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'customers'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Customers Directory ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Internal Staff ({staffUsers.length})
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 text-xs">✕</button>
        </div>
      )}

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {loading && customers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
              Loading customer directory...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No Customers Found</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your first client profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Phone & Address</th>
                    <th className="py-3 px-4">Linked User Profile</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {c.companyName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {c.contactEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {c.phone && <div className="text-slate-600">{c.phone}</div>}
                        {c.address && <div className="text-slate-400 truncate max-w-xs">{c.address}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.userId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Linked (User #{c.userId})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <span>Unlinked (Portal Locked)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.userId ? (
                          <button
                            onClick={() => handleUnlinkUser(c.id, c.companyName)}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-slate-100"
                            title="Unlink login credentials"
                          >
                            <Unlink className="w-3 h-3" /> Unlink
                          </button>
                        ) : (
                          <button
                            onClick={() => openLinkUserModal(c)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 font-medium bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200"
                            title="Associate an existing User login to this customer"
                          >
                            <LinkIcon className="w-3 h-3" /> Link User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERNAL STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {loading && staffUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
              Loading staff accounts...
            </div>
          ) : staffUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No Staff Members Found</p>
              <p className="text-xs text-slate-400 mt-1">Create an internal staff member to delegate daily operations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {staffUsers.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {st.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {st.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {st.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStaffStatus(st.id, st.fullName)}
                          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                            st.isActive
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {st.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Add New Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="billing@acme.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, City, ZIP, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  {loading ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK USER PROFILE MODAL */}
      {showLinkModal && linkingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-indigo-600">
                <LinkIcon className="w-5 h-5" />
                <h3 className="text-base font-semibold text-slate-900">Link User Account</h3>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleLinkUser} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Associate a login account with <strong className="text-slate-900">{linkingCustomer.companyName}</strong> so they can log into the self-service Customer Portal.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select User Account *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  required
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900"
                >
                  <option value="" disabled>Select a user account...</option>
                  {allUsers
                    .filter((u) => u.role === 'CUSTOMER' || !customers.some(c => c.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) — Role: {u.role}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedUserId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {loading ? 'Linking...' : 'Confirm Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900">Create Internal Staff Account</h3>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sjenkins@brightloop.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 9 chars, uppercase, lowercase, special"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />

                {/* Visual Password Policy Checklist */}
                <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-slate-700">Security Policy Checklist:</div>
                  <div className={`flex items-center gap-2 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {hasMinLen ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1 shrink-0" />
                    )}
                    <span>Length &gt; 8 characters ({staffPassword.length}/9+ entered)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {hasUpper ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1 shrink-0" />
                    )}
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {hasLower ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1 shrink-0" />
                    )}
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    {hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1 shrink-0" />
                    )}
                    <span>At least 1 special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isStaffPasswordValid || !staffName.trim() || !staffEmail.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-opacity"
                >
                  {loading ? 'Creating...' : 'Create Staff User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
