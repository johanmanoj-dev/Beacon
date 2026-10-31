import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch directory data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add customer';
      setError(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to link user profile';
      setError(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unlink user';
      setError(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create staff account';
      setError(errorMsg);
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update staff status';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#101E2B]">User & Customer Directory</h1>
          </div>
          <p className="text-sm text-[#5A6D80] mt-1">
            Manage customer business profiles, link login credentials for self-service portal, and administer internal staff accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-[#E5DFD3] bg-white hover:bg-[#F5F0E6] rounded-lg text-[#101E2B] transition-colors shadow-2xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {activeTab === 'customers' ? (
            <button
              onClick={() => setShowCustomerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B4257] hover:bg-[#1D2D3D] text-[#FAF7F0] rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          ) : (
            <button
              onClick={() => setShowStaffModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B4257] hover:bg-[#1D2D3D] text-[#FAF7F0] rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Staff Member
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E5DFD3] gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'customers'
              ? 'border-[#2B4257] text-[#2B4257] font-semibold'
              : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Customers Directory ({customers.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'staff'
              ? 'border-[#2B4257] text-[#2B4257] font-semibold'
              : 'border-transparent text-[#5A6D80] hover:text-[#101E2B]'
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
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 text-xs cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
          {loading && customers.length === 0 ? (
            <div className="p-12 text-center text-[#5A6D80]">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#889AA9] mb-2" />
              Loading customer directory...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-[#5A6D80]">
              <Users className="h-10 w-10 mx-auto text-[#889AA9] mb-2 opacity-50" />
              <p className="font-medium text-[#101E2B]">No Customers Found</p>
              <p className="text-xs text-[#889AA9] mt-1">Get started by creating your first client profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
                <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Contact Email</th>
                    <th className="py-3 px-4">Phone & Address</th>
                    <th className="py-3 px-4">Linked User Profile</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3] font-sans">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FCFAF6] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#101E2B] flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#889AA9]" />
                        {c.companyName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5A6D80]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#889AA9]" />
                          {c.contactEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {c.phone && <div className="text-[#101E2B] font-medium">{c.phone}</div>}
                        {c.address && <div className="text-[#889AA9] truncate max-w-xs">{c.address}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.userId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Linked (User #{c.userId})</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F0E6] text-[#5A6D80] border border-[#E5DFD3]">
                            <span>Unlinked (Portal Locked)</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.userId ? (
                          <button
                            onClick={() => handleUnlinkUser(c.id, c.companyName)}
                            className="inline-flex items-center gap-1 text-xs text-[#5A6D80] hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-[#F5F0E6] cursor-pointer"
                            title="Unlink login credentials"
                          >
                            <Unlink className="w-3 h-3" /> Unlink
                          </button>
                        ) : (
                          <button
                            onClick={() => openLinkUserModal(c)}
                            className="inline-flex items-center gap-1 text-xs text-[#2B4257] hover:text-[#101E2B] font-medium bg-[#F5F0E6] hover:bg-[#EAE4D7] px-2.5 py-1 rounded border border-[#E5DFD3] cursor-pointer"
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
        <div className="bg-white border border-[#E5DFD3] rounded-xl shadow-xs overflow-hidden">
          {loading && staffUsers.length === 0 ? (
            <div className="p-12 text-center text-[#5A6D80]">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#889AA9] mb-2" />
              Loading staff accounts...
            </div>
          ) : staffUsers.length === 0 ? (
            <div className="p-12 text-center text-[#5A6D80]">
              <ShieldCheck className="h-10 w-10 mx-auto text-[#889AA9] mb-2 opacity-50" />
              <p className="font-medium text-[#101E2B]">No Staff Members Found</p>
              <p className="text-xs text-[#889AA9] mt-1">Create an internal staff member to delegate daily operations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5A6D80] border-collapse">
                <thead className="bg-[#F7F4EE] text-[#101E2B] text-xs font-semibold uppercase tracking-wider border-b border-[#E5DFD3]">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DFD3] font-sans">
                  {staffUsers.map((st) => (
                    <tr key={st.id} className="hover:bg-[#FCFAF6] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#101E2B]">
                        {st.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#5A6D80]">
                        {st.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#F5F0E6] text-[#2B4257] border border-[#E5DFD3]">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {st.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0E6] text-[#889AA9] border border-[#E5DFD3]">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStaffStatus(st.id, st.fullName)}
                          className={`text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <h3 className="text-base font-semibold text-[#101E2B]">Add New Customer</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Billing Contact Email *</label>
                <input
                  type="email"
                  required
                  placeholder="billing@acme.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street address, City, ZIP, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-2 text-[#2B4257]">
                <LinkIcon className="w-5 h-5" />
                <h3 className="text-base font-semibold text-[#101E2B]">Link User Account</h3>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleLinkUser} className="p-6 space-y-4">
              <p className="text-xs text-[#5A6D80]">
                Associate a login account with <strong className="text-[#101E2B]">{linkingCustomer.companyName}</strong> so they can log into the self-service Customer Portal.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Select User Account *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  required
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-white text-[#101E2B] focus:ring-2 focus:ring-[#2B4257]"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedUserId}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] rounded-lg shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101E2B]/60 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl border border-[#E5DFD3] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E5DFD3] flex items-center justify-between bg-[#FAF7F0]">
              <div className="flex items-center gap-2 text-[#101E2B]">
                <ShieldCheck className="w-5 h-5 text-[#2B4257]" />
                <h3 className="text-base font-semibold text-[#101E2B]">Create Internal Staff Account</h3>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-[#889AA9] hover:text-[#101E2B] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Internal Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sjenkins@brightloop.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101E2B] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 9 chars, uppercase, lowercase, special"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full text-sm rounded-lg border border-[#E5DFD3] px-3 py-2 bg-[#FBF9F5] text-[#101E2B] focus:outline-none focus:ring-2 focus:ring-[#2B4257]"
                />

                {/* Visual Password Policy Checklist */}
                <div className="mt-2.5 p-3 bg-[#FAF7F0] border border-[#E5DFD3] rounded-lg space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-[#101E2B]">Security Policy Checklist:</div>
                  <div className={`flex items-center gap-2 ${hasMinLen ? 'text-emerald-700 font-medium' : 'text-[#5A6D80]'}`}>
                    {hasMinLen ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#889AA9] mx-1 shrink-0" />
                    )}
                    <span>Length &gt; 8 characters ({staffPassword.length}/9+ entered)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-[#5A6D80]'}`}>
                    {hasUpper ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#889AA9] mx-1 shrink-0" />
                    )}
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-700 font-medium' : 'text-[#5A6D80]'}`}>
                    {hasLower ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#889AA9] mx-1 shrink-0" />
                    )}
                    <span>At least 1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-[#5A6D80]'}`}>
                    {hasSpecial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#889AA9] mx-1 shrink-0" />
                    )}
                    <span>At least 1 special character (!@#$%^&*...)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5A6D80] hover:text-[#101E2B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isStaffPasswordValid || !staffName.trim() || !staffEmail.trim()}
                  className="px-4 py-2 text-xs font-semibold text-[#FAF7F0] bg-[#2B4257] hover:bg-[#1D2D3D] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-opacity cursor-pointer"
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
