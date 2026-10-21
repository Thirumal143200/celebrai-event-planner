'use client';

import React, { useState } from 'react';
import type { TaskItem, TaskPriority } from '@/lib/types';
import { generateClientSideId } from '@/lib/utils';

interface TasksTabProps {
  eventId: string;
  tasks: TaskItem[];
  eventDate: string;
  onUpdate: (updated: TaskItem[]) => void;
}

export default function TasksTab({
  eventId,
  tasks,
  eventDate,
  onUpdate,
}: TasksTabProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(eventDate ? eventDate.split('T')[0] : '');
  const [category, setCategory] = useState('General');
  const [assignee, setAssignee] = useState('');

  const completedCount = tasks.filter((t) => t.completed).length;
  const criticalCount = tasks.filter((t) => t.priority === 'critical' && !t.completed).length;

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.completed) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleToggleTask = async (taskId: string) => {
    // Optimistic update
    const optimistic = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdate(optimistic);

    try {
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleId: taskId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onUpdate(data.data);
      }
    } catch (e) {
      console.error(e);
      // Revert if failed
      onUpdate(tasks);
    }
  };

  const handleSaveTasks = async (items: TaskItem[]) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/tasks`, {
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: generateClientSideId('task'),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      priority,
      dueDate: dueDate || new Date().toISOString(),
      category: category.trim() || 'General',
      assignee: assignee.trim() || 'Unassigned',
    };

    const nextTasks = [...tasks, newTask];
    handleSaveTasks(nextTasks);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const nextTasks = tasks.map((t) =>
      t.id === editingTask.id ? editingTask : t
    );
    handleSaveTasks(nextTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    handleSaveTasks(nextTasks);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(eventDate ? eventDate.split('T')[0] : '');
    setCategory('General');
    setAssignee('');
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'critical':
        return <span className="badge badge-error text-xs font-bold">Critical 🔥</span>;
      case 'high':
        return <span className="badge badge-warning text-xs font-bold">High ⚡</span>;
      case 'medium':
        return <span className="badge badge-info text-xs">Medium</span>;
      default:
        return <span className="badge badge-secondary text-xs">Low</span>;
    }
  };

  return (
    <div className="space-y-6" id="tasks-section">
      {/* Task Summary Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Action Items & Tasks</h3>
            <p className="text-xs text-[var(--color-surface-500)]">
              Delegate responsibilities, track critical milestones, and clear event blockers.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            id="add-task-btn"
          >
            + Add Task
          </button>
        </div>

        {/* Task Metric Chips */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="bg-white/80 px-3.5 py-2 rounded-xl border border-[var(--color-surface-100)] text-xs font-semibold">
            <span className="text-[var(--color-surface-500)]">Completed: </span>
            <span className="font-bold text-[var(--color-success-600)]">{completedCount} / {tasks.length}</span>
          </div>
          {criticalCount > 0 && (
            <div className="bg-red-50 text-red-700 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-bold">
              🔥 {criticalCount} Critical Task{criticalCount > 1 ? 's' : ''} Remaining
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--color-surface-100)]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--color-surface-500)] mr-1">Status:</span>
            {(['all', 'pending', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  filterStatus === s
                    ? 'bg-[var(--color-primary-600)] text-white'
                    : 'bg-[var(--color-surface-100)] text-[var(--color-surface-600)] hover:bg-[var(--color-surface-200)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--color-surface-500)] mr-1">Priority:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  filterPriority === p
                    ? 'bg-[var(--color-surface-800)] text-white'
                    : 'bg-[var(--color-surface-100)] text-[var(--color-surface-600)] hover:bg-[var(--color-surface-200)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-3xl mb-3 block">✅</span>
          <p className="text-sm text-[var(--color-surface-500)] mb-4">
            {tasks.length === 0
              ? 'No tasks created yet. Generate an AI plan or add action items to stay on schedule!'
              : 'No tasks match the selected filters.'}
          </p>
          {tasks.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-secondary btn-sm">
              Add First Task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`glass-card p-4 flex items-start gap-4 transition-all ${
                task.completed ? 'opacity-70 bg-white/40' : 'hover:border-[var(--color-primary-300)]'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
                className="mt-1 h-5 w-5 rounded border-[var(--color-surface-300)] text-[var(--color-primary-600)] cursor-pointer focus:ring-[var(--color-primary-500)]"
                aria-label={`Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${task.completed ? 'line-through text-[var(--color-surface-400)]' : 'text-[var(--color-surface-900)]'}`}>
                      {task.title}
                    </span>
                    <span className="badge badge-secondary text-[11px]">{task.category}</span>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-surface-500)] whitespace-nowrap">
                    {task.assignee && <span>👤 {task.assignee}</span>}
                    {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-[var(--color-surface-600)] leading-relaxed mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={() => setEditingTask(task)}
                  className="text-xs text-[var(--color-surface-500)] hover:text-black font-semibold p-1"
                  aria-label={`Edit ${task.title}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-xs text-[var(--color-error-600)] hover:text-[var(--color-error-800)] font-semibold p-1"
                  aria-label={`Delete ${task.title}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Add Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="form-label" htmlFor="t-title">Task Title *</label>
                <input
                  id="t-title"
                  type="text"
                  required
                  placeholder="e.g. Schedule cake tasting, Request permit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="t-prio">Priority</label>
                  <select
                    id="t-prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="form-input"
                  >
                    <option value="critical">Critical 🔥</option>
                    <option value="high">High ⚡</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" htmlFor="t-due">Due Date</label>
                  <input
                    id="t-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label" htmlFor="t-cat">Category</label>
                  <input
                    id="t-cat"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="t-ass">Assignee</label>
                  <input
                    id="t-ass"
                    type="text"
                    placeholder="e.g. Partner, Planner"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="t-desc">Description</label>
                <textarea
                  id="t-desc"
                  rows={2}
                  placeholder="Additional context or checklist..."
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
                  {saving ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-backdrop">
          <div className="modal-content max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="text-[var(--color-surface-400)] hover:text-black">✕</button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                    className="form-input"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Assignee</label>
                  <input
                    type="text"
                    value={editingTask.assignee}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-200)]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
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
