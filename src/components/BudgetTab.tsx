'use client';

import React, { useState } from 'react';
import type { BudgetBreakdown, BudgetCategory, Currency } from '@/lib/types';
import { generateClientSideId } from '@/lib/utils';

interface BudgetTabProps {
  eventId: string;
  budget: BudgetBreakdown | null;
  currency: Currency;
  onUpdate: (updated: BudgetBreakdown) => void;
}

export default function BudgetTab({ eventId, budget, currency, onUpdate }: BudgetTabProps) {
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // New Category Form state
  const [catName, setCatName] = useState('');
  const [catAllocated, setCatAllocated] = useState<number>(10);
  const [catEstimated, setCatEstimated] = useState<number>(0);
  const [catActual, setCatActual] = useState<number>(0);
  const [catNotes, setCatNotes] = useState('');

  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };
  const sym = currencySymbols[currency] || '$';

  if (!budget) {
    return (
      <div className="glass-card p-12 text-center">
        <span className="text-4xl mb-4 block">💰</span>
        <h3 className="text-lg font-bold text-[var(--color-surface-800)] mb-2">No Budget Plan Yet</h3>
        <p className="text-sm text-[var(--color-surface-500)] mb-6">
          Generate an AI plan or add budget categories manually to begin tracking expenses.
        </p>
      </div>
    );
  }

  const {
    totalBudget,
    categories,
    contingencyPercent,
    contingencyAmount,
    totalAllocated,
    totalEstimated,
    totalActual,
    remaining,
  } = budget;

  const isOverBudget = remaining < 0;
  const isAllocationOff = Math.abs(100 - totalAllocated) > 2;

  const handleContingencyChange = async (newPercent: number) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contingencyPercent: newPercent }),
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

  const handleSaveCategories = async (updatedCategories: BudgetCategory[]) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onUpdate(data.data);
        setSaveMessage('Budget saved successfully!');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCat: BudgetCategory = {
      id: generateClientSideId('cat'),
      name: catName.trim(),
      allocated: Number(catAllocated),
      estimated: Number(catEstimated) || Math.round(totalBudget * (Number(catAllocated) / 100)),
      actual: Number(catActual) || 0,
      notes: catNotes.trim(),
    };

    const nextCategories = [...categories, newCat];
    handleSaveCategories(nextCategories);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const nextCategories = categories.map((c) =>
      c.id === editingCategory.id ? editingCategory : c
    );
    handleSaveCategories(nextCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('Are you sure you want to remove this budget category?')) return;
    const nextCategories = categories.filter((c) => c.id !== catId);
    handleSaveCategories(nextCategories);
  };

  const resetForm = () => {
    setCatName('');
    setCatAllocated(10);
    setCatEstimated(0);
    setCatActual(0);
    setCatNotes('');
  };

  return (
    <div className="space-y-6" id="budget-section">
      {/* Save Notification */}
      {saveMessage && (
        <div className="alert alert-success animate-fade-in flex items-center justify-between">
          <span>✅ {saveMessage}</span>
          <button onClick={() => setSaveMessage(null)} className="text-sm font-bold">✕</button>
        </div>
      )}

      {/* Warning Banners */}
      {isOverBudget && (
        <div className="alert alert-danger flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold text-sm">Over Budget Alert</h4>
            <p className="text-xs">
              Total estimated expenses plus contingency exceed total budget by {sym}{Math.abs(remaining).toLocaleString()}. Consider adjusting allocations or negotiating vendor quotes.
            </p>
          </div>
        </div>
      )}

      {isAllocationOff && categories.length > 0 && (
        <div className="alert alert-warning flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <h4 className="font-bold text-sm">Allocation Gap</h4>
            <p className="text-xs">
              Current category allocations sum to {totalAllocated.toFixed(1)}%. We recommend aiming for 100% total allocation across your planning pillars.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Total Budget</span>
          <span className="text-xl font-bold text-[var(--color-surface-900)] block">{sym}{totalBudget.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--color-surface-400)]">Set for event</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Total Allocated</span>
          <span className="text-xl font-bold text-[var(--color-primary-600)] block">{totalAllocated.toFixed(1)}%</span>
          <span className="text-[11px] text-[var(--color-surface-400)]">Target 100%</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Estimated Cost</span>
          <span className="text-xl font-bold text-[var(--color-surface-900)] block">{sym}{totalEstimated.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--color-surface-400)]">Planned expenses</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Actual Spend</span>
          <span className="text-xl font-bold text-[var(--color-success-600)] block">{sym}{totalActual.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--color-surface-400)]">{((totalActual / (totalBudget || 1)) * 100).toFixed(0)}% of budget</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Contingency</span>
          <span className="text-xl font-bold text-[var(--color-warning-600)] block">{sym}{contingencyAmount.toLocaleString()}</span>
          <span className="text-[11px] text-[var(--color-surface-400)]">{contingencyPercent}% buffer</span>
        </div>

        <div className={`glass-card p-4 ${remaining < 0 ? 'bg-red-50/80 border-red-200' : ''}`}>
          <span className="text-xs font-semibold text-[var(--color-surface-500)] block mb-1">Remaining</span>
          <span className={`text-xl font-bold block ${remaining < 0 ? 'text-[var(--color-error-600)]' : 'text-[var(--color-success-600)]'}`}>
            {sym}{remaining.toLocaleString()}
          </span>
          <span className="text-[11px] text-[var(--color-surface-400)]">Available balance</span>
        </div>
      </div>

      {/* Contingency Buffer Controller */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-[var(--color-surface-800)]">Safety Contingency Buffer</h4>
          <p className="text-xs text-[var(--color-surface-500)]">
            A reserve cushion for unexpected vendor surcharges, weather backup options, or last-minute adjustments.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={contingencyPercent}
            onChange={(e) => handleContingencyChange(Number(e.target.value))}
            className="w-32 cursor-pointer"
            id="contingency-slider"
          />
          <span className="font-bold text-sm text-[var(--color-surface-800)] min-w-[3rem] text-right">
            {contingencyPercent}%
          </span>
          <span className="text-xs text-[var(--color-surface-500)]">
            ({sym}{contingencyAmount.toLocaleString()})
          </span>
        </div>
      </div>

      {/* Category List & Actions */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Budget Categories</h3>
            <p className="text-xs text-[var(--color-surface-500)]">
              Breakdown by major wedding, birthday, or celebration vendor allocations.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            id="add-category-btn"
          >
            + Add Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-10 bg-[var(--color-surface-50)] rounded-xl border border-dashed border-[var(--color-surface-200)]">
            <p className="text-sm text-[var(--color-surface-500)] mb-3">No categories added yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-secondary btn-sm"
            >
              Add First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead>
                <tr className="border-b border-[var(--color-surface-200)] text-[var(--color-surface-500)] text-xs uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 px-4 text-center">Allocated %</th>
                  <th className="pb-3 px-4 text-right">Estimated</th>
                  <th className="pb-3 px-4 text-right">Actual Spend</th>
                  <th className="pb-3 px-4 text-right">Variance</th>
                  <th className="pb-3 px-4">Notes</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-surface-100)]">
                {categories.map((cat) => {
                  const variance = cat.estimated - cat.actual;
                  const isOver = cat.actual > cat.estimated && cat.estimated > 0;

                  return (
                    <tr key={cat.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-3.5 pr-4 font-semibold text-[var(--color-surface-900)]">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="badge badge-info text-xs">{cat.allocated}%</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[var(--color-surface-800)]">
                        {sym}{cat.estimated.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[var(--color-surface-800)]">
                        {sym}{cat.actual.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          isOver ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                        }`}>
                          {variance >= 0 ? `+${sym}${variance.toLocaleString()}` : `-${sym}${Math.abs(variance).toLocaleString()}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--color-surface-500)] max-w-xs truncate">
                        {cat.notes || '—'}
                      </td>
                      <td className="py-3.5 pl-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] font-semibold p-1"
                          aria-label={`Edit ${cat.name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-xs text-[var(--color-error-600)] hover:text-[var(--color-error-800)] font-semibold p-1"
                          aria-label={`Delete ${cat.name}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Add Budget Category</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="new-cat-name">Category Name *</label>
                <input
                  id="new-cat-name"
                  type="text"
                  required
                  placeholder="e.g. Venue & Rentals, Catering, Photography"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="new-cat-alloc">Allocation (% of Budget)</label>
                  <input
                    id="new-cat-alloc"
                    type="number"
                    min="0"
                    max="100"
                    value={catAllocated}
                    onChange={(e) => {
                      const alloc = Number(e.target.value);
                      setCatAllocated(alloc);
                      setCatEstimated(Math.round(totalBudget * (alloc / 100)));
                    }}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="new-cat-est">Estimated Cost ({sym})</label>
                  <input
                    id="new-cat-est"
                    type="number"
                    min="0"
                    value={catEstimated}
                    onChange={(e) => setCatEstimated(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="new-cat-actual">Initial Actual Spend ({sym})</label>
                <input
                  id="new-cat-actual"
                  type="number"
                  min="0"
                  value={catActual}
                  onChange={(e) => setCatActual(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="new-cat-notes">Notes / Vendor Constraints</label>
                <textarea
                  id="new-cat-notes"
                  rows={2}
                  placeholder="Optional details or target caps"
                  value={catNotes}
                  onChange={(e) => setCatNotes(e.target.value)}
                  className="form-input"
                />
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
                  disabled={saving || !catName.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Edit {editingCategory.name}</h3>
              <button onClick={() => setEditingCategory(null)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Allocation (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingCategory.allocated}
                    onChange={(e) => setEditingCategory({ ...editingCategory, allocated: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Estimated ({sym})</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCategory.estimated}
                    onChange={(e) => setEditingCategory({ ...editingCategory, estimated: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Actual Spent ({sym})</label>
                <input
                  type="number"
                  min="0"
                  value={editingCategory.actual}
                  onChange={(e) => setEditingCategory({ ...editingCategory, actual: Number(e.target.value) })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  rows={2}
                  value={editingCategory.notes}
                  onChange={(e) => setEditingCategory({ ...editingCategory, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-200)]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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
