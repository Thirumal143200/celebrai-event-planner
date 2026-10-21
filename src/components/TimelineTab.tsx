'use client';

import React, { useState } from 'react';
import type { TimelineItem, TimelineItemStatus } from '@/lib/types';
import { generateClientSideId } from '@/lib/utils';

interface TimelineTabProps {
  eventId: string;
  timeline: TimelineItem[];
  eventDate: string;
  onUpdate: (updated: TimelineItem[]) => void;
}

export default function TimelineTab({
  eventId,
  timeline,
  eventDate,
  onUpdate,
}: TimelineTabProps) {
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(eventDate ? eventDate.split('T')[0] : '');
  const [category, setCategory] = useState('Planning');
  const [status, setStatus] = useState<TimelineItemStatus>('pending');

  const now = new Date();

  // Detect overdue items dynamically
  const enrichedTimeline = timeline.map((item) => {
    const isOverdue =
      item.status !== 'completed' &&
      item.dueDate &&
      new Date(item.dueDate) < now;
    return {
      ...item,
      computedStatus: isOverdue ? ('overdue' as const) : item.status,
    };
  });

  const filteredItems = enrichedTimeline.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return item.computedStatus === 'overdue';
    return item.status === filter;
  });

  const completedCount = timeline.filter((i) => i.status === 'completed').length;
  const progressPercent = timeline.length > 0 ? Math.round((completedCount / timeline.length) * 100) : 0;

  const handleSaveTimeline = async (items: TimelineItem[]) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/timeline`, {
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

  const handleToggleStatus = (item: TimelineItem) => {
    const nextStatus: TimelineItemStatus =
      item.status === 'completed'
        ? 'pending'
        : item.status === 'pending'
        ? 'in-progress'
        : 'completed';

    const updated = timeline.map((t) =>
      t.id === item.id ? { ...t, status: nextStatus } : t
    );
    handleSaveTimeline(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: TimelineItem = {
      id: generateClientSideId('time'),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || new Date().toISOString(),
      category: category.trim() || 'General',
      status,
      sortOrder: timeline.length + 1,
    };

    const nextTimeline = [...timeline, newItem].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    handleSaveTimeline(nextTimeline);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const nextTimeline = timeline
      .map((t) => (t.id === editingItem.id ? editingItem : t))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    handleSaveTimeline(nextTimeline);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm('Are you sure you want to remove this milestone?')) return;
    const nextTimeline = timeline.filter((t) => t.id !== itemId);
    handleSaveTimeline(nextTimeline);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(eventDate ? eventDate.split('T')[0] : '');
    setCategory('Planning');
    setStatus('pending');
  };

  const getStatusBadge = (computedStatus: string) => {
    switch (computedStatus) {
      case 'completed':
        return <span className="badge badge-success text-xs">Completed</span>;
      case 'in-progress':
        return <span className="badge badge-info text-xs">In Progress</span>;
      case 'overdue':
        return <span className="badge badge-error text-xs">Overdue</span>;
      default:
        return <span className="badge badge-neutral text-xs">Pending</span>;
    }
  };

  return (
    <div className="space-y-6" id="timeline-section">
      {/* Timeline Header Card with Progress */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Event Timeline & Milestones</h3>
            <p className="text-xs text-[var(--color-surface-500)]">
              Chronological schedule from initial booking to day-of run-of-show.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            id="add-milestone-btn"
          >
            + Add Milestone
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-xs text-[var(--color-surface-500)] font-semibold">
            <span>Milestones Completed: {completedCount} / {timeline.length}</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-[var(--color-surface-100)] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-info-500)] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-surface-100)]">
          {['all', 'pending', 'in-progress', 'completed', 'overdue'].map((f) => (
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

      {/* Timeline Stream */}
      {filteredItems.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-3xl mb-3 block">⏱️</span>
          <p className="text-sm text-[var(--color-surface-500)] mb-4">
            {timeline.length === 0
              ? 'No milestones added yet. Use AI Plan Generation to draft a structured timeline!'
              : 'No milestones match this filter.'}
          </p>
          {timeline.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-secondary btn-sm">
              Add First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--color-surface-200)]">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot */}
              <div
                onClick={() => handleToggleStatus(item)}
                className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer transition-transform hover:scale-125 flex items-center justify-center text-[10px] ${
                  item.status === 'completed'
                    ? 'bg-[var(--color-success-500)] text-white'
                    : item.computedStatus === 'overdue'
                    ? 'bg-[var(--color-error-500)] text-white'
                    : item.status === 'in-progress'
                    ? 'bg-[var(--color-info-500)] text-white'
                    : 'bg-white border-[var(--color-surface-400)] text-[var(--color-surface-400)]'
                }`}
                title="Click to toggle status"
              >
                {item.status === 'completed' ? '✓' : ''}
              </div>

              {/* Milestone Card */}
              <div className="glass-card p-5 hover:border-[var(--color-primary-300)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-secondary text-xs">{item.category}</span>
                    <h4
                      onClick={() => handleToggleStatus(item)}
                      className={`text-base font-bold cursor-pointer hover:text-[var(--color-primary-600)] transition-colors ${
                        item.status === 'completed'
                          ? 'line-through text-[var(--color-surface-400)]'
                          : 'text-[var(--color-surface-900)]'
                      }`}
                    >
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.computedStatus)}
                    <span className="text-xs font-semibold text-[var(--color-surface-500)] whitespace-nowrap">
                      📅 {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-[var(--color-surface-600)] mb-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-surface-100)] text-xs text-[var(--color-surface-400)]">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className="hover:text-[var(--color-primary-600)] font-medium"
                  >
                    Status: {item.status} (click to advance)
                  </button>
                  <div className="space-x-3">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-[var(--color-primary-600)] hover:underline font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-[var(--color-error-600)] hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Add Milestone</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="m-title">Milestone Title *</label>
                <input
                  id="m-title"
                  type="text"
                  required
                  placeholder="e.g. Finalize Catering Contract, Send Invitations"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="m-due">Target Due Date *</label>
                  <input
                    id="m-due"
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="m-cat">Category</label>
                  <input
                    id="m-cat"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="m-desc">Description & Checklist</label>
                <textarea
                  id="m-desc"
                  rows={3}
                  placeholder="Key deliverables and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={saving || !title.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? 'Adding...' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Milestone Modal */}
      {editingItem && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Edit Milestone</h3>
              <button onClick={() => setEditingItem(null)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={editingItem.dueDate ? editingItem.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as TimelineItemStatus })}
                    className="form-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-200)]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
