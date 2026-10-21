'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { EventData, EventFormData, EventType, Currency, FormErrors } from '@/lib/types';
import { getDaysUntil } from '@/lib/utils';

// ============================================
// Constants
// ============================================

const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string }[] = [
  { value: 'wedding', label: 'Wedding', icon: '💍', color: 'event-icon-wedding' },
  { value: 'birthday', label: 'Birthday', icon: '🎂', color: 'event-icon-birthday' },
  { value: 'community', label: 'Community', icon: '🌍', color: 'event-icon-community' },
];

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
];

// ============================================
// Home Page Component
// ============================================

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (!ignore) {
          if (data.success) {
            setEvents(data.data || []);
          } else {
            setError(data.error || 'Failed to load events');
          }
        }
      } catch {
        if (!ignore) setError('Network error — please try again');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)]">
      {/* Hero Header */}
      <header className="hero-gradient text-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between no-print" role="navigation" aria-label="Main navigation">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Sparkle">✨</span>
            <span className="font-[var(--font-display)] text-xl font-bold tracking-tight">CelebrAI</span>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary bg-white/20 border border-white/30 hover:bg-white/30"
            id="create-event-header-btn"
            aria-label="Create a new event"
          >
            <span aria-hidden="true">+</span> New Event
          </button>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-8 text-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-[var(--font-display)] font-extrabold mb-4 leading-tight animate-fade-in"
          >
            Plan Your Perfect Event
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in">
            AI-powered planning for weddings, birthdays, and community events.
            Budgets, timelines, vendor checklists, and personalized ideas — all in one place.
          </p>
          {events.length === 0 && !loading && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-lg bg-white text-[var(--color-primary-700)] hover:bg-white/90 font-bold shadow-lg animate-slide-up"
              id="create-event-hero-btn"
            >
              🎉 Create Your First Event
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 pb-16 relative z-10">
        {/* Error State */}
        {error && (
          <div role="alert" className="glass-card p-4 mb-6 border-l-4 border-[var(--color-error-500)]">
            <p className="text-[var(--color-error-600)] font-semibold">{error}</p>
            <button onClick={fetchEvents} className="btn btn-sm btn-ghost mt-2">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6">
                <div className="skeleton h-6 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-10 w-1/3 mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && !error && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-6xl mb-4" role="img" aria-label="Party popper">🎊</div>
            <h2 className="text-2xl font-bold text-[var(--color-surface-800)] mb-2">
              No events yet
            </h2>
            <p className="text-[var(--color-surface-500)] mb-6 max-w-md mx-auto">
              Create your first event to get started with AI-powered planning.
              Choose from weddings, birthdays, or community events.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary btn-lg"
              id="create-event-empty-btn"
            >
              Create Event
            </button>
          </div>
        )}

        {/* Event Cards */}
        {!loading && events.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-surface-800)]">
                Your Events ({events.length})
              </h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary"
                id="create-event-list-btn"
              >
                <span aria-hidden="true">+</span> New Event
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateForm && (
        <CreateEventModal
          onClose={() => setShowCreateForm(false)}
          onCreated={(event) => {
            setShowCreateForm(false);
            router.push(`/events/${event.id}`);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-[var(--color-surface-900)] text-[var(--color-surface-400)] py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm">
          <p>CelebrAI Event Planner — PromptWars Virtual Challenge 5</p>
          <p className="mt-1 text-[var(--color-surface-500)]">
            Built with Next.js, Gemini AI, and ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// Event Card Component
// ============================================

function EventCard({ event, onClick }: { event: EventData; onClick: () => void }) {
  const eventType = EVENT_TYPES.find((t) => t.value === event.type);
  const currency = CURRENCIES.find((c) => c.value === event.currency);
  const daysUntil = getDaysUntil(event.date);

  const statusColors: Record<string, string> = {
    draft: 'badge-info',
    planning: 'badge-primary',
    confirmed: 'badge-success',
    completed: 'badge-success',
    cancelled: 'badge-error',
  };

  return (
    <article
      className="glass-card p-6 cursor-pointer group animate-fade-in"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${event.name} event details`}
      id={`event-card-${event.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`event-icon ${eventType?.color}`}>
          <span role="img" aria-label={eventType?.label}>{eventType?.icon}</span>
        </div>
        <span className={`badge ${statusColors[event.status] || 'badge-info'}`}>
          {event.status}
        </span>
      </div>

      <h3 className="text-lg font-bold text-[var(--color-surface-800)] mb-1 group-hover:text-[var(--color-primary-600)] transition-colors">
        {event.name}
      </h3>

      <div className="space-y-1 text-sm text-[var(--color-surface-500)]">
        <p>📅 {new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</p>
        <p>👥 {event.guestCount.toLocaleString()} guests</p>
        <p>💰 {currency?.symbol}{event.budget.toLocaleString()}</p>
        {event.location && <p>📍 {event.location}</p>}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-surface-100)] flex items-center justify-between">
        <span className={`text-sm font-semibold ${
          daysUntil < 0
            ? 'text-[var(--color-surface-400)]'
            : daysUntil < 30
              ? 'text-[var(--color-warning-600)]'
              : 'text-[var(--color-success-600)]'
        }`}>
          {daysUntil < 0
            ? 'Event passed'
            : daysUntil === 0
              ? "Today!"
              : `${daysUntil} days away`}
        </span>
        <span className="text-sm text-[var(--color-primary-600)] font-semibold group-hover:translate-x-1 transition-transform">
          Open →
        </span>
      </div>
    </article>
  );
}

// ============================================
// Create Event Modal
// ============================================

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (event: EventData) => void;
}) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: 'wedding',
    date: '',
    guestCount: 100,
    budget: 10000,
    currency: 'USD',
    location: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors<EventFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Client-side validation
  const validate = (): boolean => {
    const newErrors: FormErrors<EventFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (formData.name.length > 200) newErrors.name = 'Maximum 200 characters';

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.guestCount < 1) newErrors.guestCount = 'At least 1 guest';
    if (formData.guestCount > 100000) newErrors.guestCount = 'Maximum 100,000 guests';

    if (formData.budget < 0) newErrors.budget = 'Budget cannot be negative';

    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onCreated(data.data);
      } else {
        setSubmitError(data.message || data.error || 'Failed to create event');
      }
    } catch {
      setSubmitError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Create new event"
    >
      <div className="modal-content p-6 sm:p-8 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-surface-800)]">
            Create Event
          </h2>
          <button
            onClick={onClose}
            className="btn btn-icon btn-ghost text-xl"
            aria-label="Close dialog"
            id="close-create-modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Event Type Selection */}
          <fieldset className="mb-5">
            <legend className="form-label">Event Type</legend>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.type === type.value
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                      : 'border-[var(--color-surface-200)] hover:border-[var(--color-surface-300)]'
                  }`}
                  aria-pressed={formData.type === type.value}
                  id={`event-type-${type.value}`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-semibold">{type.label}</div>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Event Name */}
          <div className="mb-4">
            <label htmlFor="event-name" className="form-label">
              Event Name <span className="text-[var(--color-error-500)]" aria-hidden="true">*</span>
            </label>
            <input
              id="event-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sarah & John's Wedding"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              maxLength={200}
            />
            {errors.name && <p id="name-error" className="form-error" role="alert">{errors.name}</p>}
          </div>

          {/* Date */}
          <div className="mb-4">
            <label htmlFor="event-date" className="form-label">
              Event Date <span className="text-[var(--color-error-500)]" aria-hidden="true">*</span>
            </label>
            <input
              id="event-date"
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              aria-required="true"
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'date-error' : undefined}
            />
            {errors.date && <p id="date-error" className="form-error" role="alert">{errors.date}</p>}
          </div>

          {/* Guest Count & Budget */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="guest-count" className="form-label">
                Guests <span className="text-[var(--color-error-500)]" aria-hidden="true">*</span>
              </label>
              <input
                id="guest-count"
                type="number"
                className="form-input"
                value={formData.guestCount}
                onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
                min={1}
                max={100000}
                aria-required="true"
                aria-invalid={!!errors.guestCount}
              />
              {errors.guestCount && <p className="form-error" role="alert">{errors.guestCount}</p>}
            </div>
            <div>
              <label htmlFor="event-budget" className="form-label">Budget</label>
              <div className="flex gap-2">
                <select
                  id="event-currency"
                  className="form-input w-20 shrink-0"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  aria-label="Currency"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.symbol}</option>
                  ))}
                </select>
                <input
                  id="event-budget"
                  type="number"
                  className="form-input"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  min={0}
                  aria-invalid={!!errors.budget}
                />
              </div>
              {errors.budget && <p className="form-error" role="alert">{errors.budget}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <label htmlFor="event-location" className="form-label">
              Location <span className="text-[var(--color-error-500)]" aria-hidden="true">*</span>
            </label>
            <input
              id="event-location"
              type="text"
              className="form-input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Grand Ballroom, New York"
              aria-required="true"
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? 'location-error' : undefined}
              maxLength={500}
            />
            {errors.location && <p id="location-error" className="form-error" role="alert">{errors.location}</p>}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="event-description" className="form-label">
              Description <span className="text-[var(--color-surface-400)] font-normal">(optional)</span>
            </label>
            <textarea
              id="event-description"
              className="form-input min-h-[80px] resize-y"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us about your event vision..."
              maxLength={2000}
              rows={3}
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-[#fee2e2] text-[var(--color-error-600)] text-sm">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              id="submit-create-event"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                '🎉 Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
