'use client';

import React, { useState } from 'react';
import type { VendorItem, VendorStatus, Currency } from '@/lib/types';
import { generateClientSideId, getCurrencySymbol } from '@/lib/utils';

interface VendorsTabProps {
  eventId: string;
  vendors: VendorItem[];
  currency: Currency;
  onUpdate: (updated: VendorItem[]) => void;
}

const STATUS_ORDER: VendorStatus[] = ['needed', 'researching', 'contacted', 'booked', 'confirmed'];

export default function VendorsTab({
  eventId,
  vendors,
  currency,
  onUpdate,
}: VendorsTabProps) {
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<VendorStatus>('needed');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [isRequired, setIsRequired] = useState(true);

  const sym = getCurrencySymbol(currency);

  const filteredVendors = vendors.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'required') return v.isRequired;
    if (filter === 'booked') return v.status === 'booked' || v.status === 'confirmed';
    return v.status === filter;
  });

  const bookedCount = vendors.filter((v) => v.status === 'booked' || v.status === 'confirmed').length;
  const totalVendorCost = vendors.reduce((sum, v) => sum + (v.estimatedCost || 0), 0);

  const handleSaveVendors = async (items: VendorItem[]) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onUpdate(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAdvance = (vendor: VendorItem) => {
    const currentIndex = STATUS_ORDER.indexOf(vendor.status);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    const updated = vendors.map((v) =>
      v.id === vendor.id ? { ...v, status: nextStatus } : v
    );
    handleSaveVendors(updated);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) return;

    const newVendor: VendorItem = {
      id: generateClientSideId('ven'),
      category: category.trim(),
      name: name.trim() || 'TBD Vendor',
      status,
      estimatedCost: Number(estimatedCost) || 0,
      contactInfo: contactInfo.trim(),
      notes: notes.trim(),
      isRequired,
    };

    const nextVendors = [...vendors, newVendor];
    handleSaveVendors(nextVendors);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    const nextVendors = vendors.map((v) =>
      v.id === editingVendor.id ? editingVendor : v
    );
    handleSaveVendors(nextVendors);
    setEditingVendor(null);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (!confirm('Are you sure you want to remove this vendor checklist item?')) return;
    const nextVendors = vendors.filter((v) => v.id !== vendorId);
    handleSaveVendors(nextVendors);
  };

  const resetForm = () => {
    setCategory('');
    setName('');
    setStatus('needed');
    setEstimatedCost(0);
    setContactInfo('');
    setNotes('');
    setIsRequired(true);
  };

  const getStatusBadge = (s: VendorStatus) => {
    switch (s) {
      case 'confirmed':
        return <span className="badge badge-success text-xs">Confirmed 🌟</span>;
      case 'booked':
        return <span className="badge badge-info text-xs">Booked 🤝</span>;
      case 'contacted':
        return <span className="badge badge-warning text-xs">Contacted 📞</span>;
      case 'researching':
        return <span className="badge badge-secondary text-xs">Researching 🔍</span>;
      default:
        return <span className="badge badge-error text-xs">Needed ⚠️</span>;
    }
  };

  return (
    <div className="space-y-6" id="vendors-section">
      {/* Vendor Stats Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Vendor Checklist & Booking Pipeline</h3>
            <p className="text-xs text-[var(--color-surface-500)]">
              Track vendor sourcing, contracts, quotes, and confirmation status.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            id="add-vendor-btn"
          >
            + Add Vendor
          </button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <span className="text-[11px] font-semibold text-[var(--color-surface-500)] block">Total Categories</span>
            <span className="text-lg font-bold text-[var(--color-surface-900)]">{vendors.length}</span>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <span className="text-[11px] font-semibold text-[var(--color-surface-500)] block">Booked / Confirmed</span>
            <span className="text-lg font-bold text-[var(--color-success-600)]">{bookedCount} / {vendors.length}</span>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <span className="text-[11px] font-semibold text-[var(--color-surface-500)] block">Total Estimated Cost</span>
            <span className="text-lg font-bold text-[var(--color-surface-900)]">{sym}{totalVendorCost.toLocaleString()}</span>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <span className="text-[11px] font-semibold text-[var(--color-surface-500)] block">Required Items Left</span>
            <span className="text-lg font-bold text-[var(--color-error-600)]">
              {vendors.filter((v) => v.isRequired && v.status === 'needed').length}
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-surface-100)]">
          {['all', 'required', 'needed', 'researching', 'contacted', 'booked', 'confirmed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-[var(--color-primary-600)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-100)] text-[var(--color-surface-600)] hover:bg-[var(--color-surface-200)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-3xl mb-3 block">🤝</span>
          <p className="text-sm text-[var(--color-surface-500)] mb-4">
            {vendors.length === 0
              ? 'No vendor categories defined yet. Generate an AI plan or add vendor items manually!'
              : 'No vendors match this filter.'}
          </p>
          {vendors.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-secondary btn-sm">
              Add First Vendor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="glass-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-wider block">
                      {vendor.category}
                    </span>
                    <h4 className="text-base font-bold text-[var(--color-surface-900)] mt-0.5">
                      {vendor.name}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => handleStatusAdvance(vendor)}
                      title="Click to advance status"
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      {getStatusBadge(vendor.status)}
                    </button>
                    {vendor.isRequired && (
                      <span className="text-[10px] font-bold text-[var(--color-error-600)] bg-red-50 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 my-3 text-xs text-[var(--color-surface-600)]">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Estimated Cost:</span>
                    <span className="text-[var(--color-surface-900)]">{sym}{vendor.estimatedCost.toLocaleString()}</span>
                  </div>
                  {vendor.contactInfo && (
                    <div className="text-[11px] text-[var(--color-surface-500)] truncate">
                      📞 {vendor.contactInfo}
                    </div>
                  )}
                  {vendor.notes && (
                    <p className="text-[11px] text-[var(--color-surface-500)] italic line-clamp-2">
                      &quot;{vendor.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Status progression bar & actions */}
              <div className="pt-3 border-t border-[var(--color-surface-100)] flex items-center justify-between text-xs">
                <button
                  onClick={() => handleStatusAdvance(vendor)}
                  className="text-xs font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)]"
                >
                  Advance Status →
                </button>
                <div className="space-x-3">
                  <button
                    onClick={() => setEditingVendor(vendor)}
                    className="text-[var(--color-surface-600)] hover:text-black font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="text-[var(--color-error-600)] hover:underline font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Add Vendor Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="v-cat">Category *</label>
                <input
                  id="v-cat"
                  type="text"
                  required
                  placeholder="e.g. Catering, Venue, Photography, DJ"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="v-name">Vendor or Company Name</label>
                <input
                  id="v-name"
                  type="text"
                  placeholder="e.g. Grand Plaza Hall (or leave TBD)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="v-status">Status</label>
                  <select
                    id="v-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VendorStatus)}
                    className="form-input"
                  >
                    <option value="needed">Needed</option>
                    <option value="researching">Researching</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="v-cost">Estimated Cost ({sym})</label>
                  <input
                    id="v-cost"
                    type="number"
                    min="0"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="v-contact">Contact Info</label>
                <input
                  id="v-contact"
                  type="text"
                  placeholder="Email, phone, or website"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="v-notes">Notes / Contract Details</label>
                <textarea
                  id="v-notes"
                  rows={2}
                  placeholder="Quotes, deposit requirements, dietary specs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="v-req"
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-surface-300)] text-[var(--color-primary-600)]"
                />
                <label htmlFor="v-req" className="text-xs font-semibold text-[var(--color-surface-700)] cursor-pointer">
                  Mark as Required for event readiness
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-200)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !category.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? 'Adding...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Edit {editingVendor.category}</h3>
              <button onClick={() => setEditingVendor(null)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleUpdateVendor} className="space-y-4">
              <div>
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  required
                  value={editingVendor.category}
                  onChange={(e) => setEditingVendor({ ...editingVendor, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Vendor Name</label>
                <input
                  type="text"
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={editingVendor.status}
                    onChange={(e) => setEditingVendor({ ...editingVendor, status: e.target.value as VendorStatus })}
                    className="form-input"
                  >
                    <option value="needed">Needed</option>
                    <option value="researching">Researching</option>
                    <option value="contacted">Contacted</option>
                    <option value="booked">Booked</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Estimated Cost ({sym})</label>
                  <input
                    type="number"
                    min="0"
                    value={editingVendor.estimatedCost}
                    onChange={(e) => setEditingVendor({ ...editingVendor, estimatedCost: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Contact Info</label>
                <input
                  type="text"
                  value={editingVendor.contactInfo}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contactInfo: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  rows={2}
                  value={editingVendor.notes}
                  onChange={(e) => setEditingVendor({ ...editingVendor, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="v-edit-req"
                  type="checkbox"
                  checked={editingVendor.isRequired}
                  onChange={(e) => setEditingVendor({ ...editingVendor, isRequired: e.target.checked })}
                  className="h-4 w-4 rounded border-[var(--color-surface-300)] text-[var(--color-primary-600)]"
                />
                <label htmlFor="v-edit-req" className="text-xs font-semibold text-[var(--color-surface-700)] cursor-pointer">
                  Required Vendor
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-200)]">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
