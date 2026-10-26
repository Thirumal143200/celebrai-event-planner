'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type {
  EventData,
  BudgetBreakdown,
  TimelineItem,
  VendorItem,
  TaskItem,
  ReadinessScore,
  EventStatus,
  EventAggregateData,
} from '@/lib/types';
import ReadinessCard from '@/components/ReadinessCard';
import OverviewTab from '@/components/OverviewTab';
import BudgetTab from '@/components/BudgetTab';
import TimelineTab from '@/components/TimelineTab';
import VendorsTab from '@/components/VendorsTab';
import TasksTab from '@/components/TasksTab';

// Dynamic import for non-critical copilot drawer to optimize initial bundle size
const AICopilotDrawer = dynamic(() => import('@/components/AICopilotDrawer'), {
  ssr: false,
});

type TabKey = 'overview' | 'budget' | 'timeline' | 'vendors' | 'tasks';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventWorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Core Data States
  const [event, setEvent] = useState<EventData | null>(null);
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);

  // UI States
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // High-efficiency single-roundtrip event data loader
  const loadEventData = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}?aggregate=true`);
      const data = await res.json();

      if (data.success && data.data) {
        const agg = data.data as EventAggregateData;
        setEvent(agg.event);
        setBudget(agg.budget);
        setTimeline(agg.timeline || []);
        setVendors(agg.vendors || []);
        setTasks(agg.tasks || []);
        setReadiness(agg.readiness);
      } else {
        router.push('/');
        return;
      }
    } catch {
      setAlert({ type: 'error', text: 'Failed to load event data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    fetch(`/api/events/${id}?aggregate=true`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data.success && data.data) {
          const agg = data.data as EventAggregateData;
          setEvent(agg.event);
          setBudget(agg.budget);
          setTimeline(agg.timeline || []);
          setVendors(agg.vendors || []);
          setTasks(agg.tasks || []);
          setReadiness(agg.readiness);
        } else {
          router.push('/');
        }
      })
      .catch((err: unknown) => {
        if (!ignore && !(err instanceof DOMException && err.name === 'AbortError')) {
          setAlert({ type: 'error', text: 'Failed to load event data. Please refresh.' });
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [id, router]);

  // Refresh readiness score
  const refreshReadiness = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}/readiness`);
      const data = await res.json();
      if (data.success && data.data) {
        setReadiness(data.data);
      }
    } catch (e) {
      console.error('Readiness refresh error:', e);
    }
  }, [id]);

  // AI Plan Generation Trigger
  const handleGeneratePlan = async () => {
    try {
      setPlanLoading(true);
      setAlert({ type: 'info', text: 'CelebrAI is generating your customized budget, timeline, vendors, and tasks...' });
      const res = await fetch(`/api/events/${id}/plan`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setAlert({
          type: 'success',
          text: data.message || 'AI Plan generated and synchronized successfully!',
        });
        await loadEventData();
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to generate plan.' });
      }
    } catch {
      setAlert({ type: 'error', text: 'Network error generating plan.' });
    } finally {
      setPlanLoading(false);
    }
  };

  // Status Change
  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!event) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEvent(data.data);
        refreshReadiness();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Event
  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to delete event' });
      }
    } catch {
      setAlert({ type: 'error', text: 'Failed to delete event' });
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-50)] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary-600)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-[var(--color-surface-600)]">
            Loading your CelebrAI Event Workspace...
          </p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: '📋' },
    { key: 'budget', label: 'Budget Plan', icon: '💰' },
    { key: 'timeline', label: 'Timeline', icon: '⏱️', count: timeline.length },
    { key: 'vendors', label: 'Vendors', icon: '🤝', count: vendors.length },
    { key: 'tasks', label: 'Tasks', icon: '✅', count: tasks.filter((t) => !t.completed).length },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-50)] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[var(--color-surface-200)] shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-surface-600)] hover:text-[var(--color-primary-600)] bg-[var(--color-surface-100)] px-2.5 py-1.5 rounded-lg transition-colors"
              id="back-to-dashboard-btn"
            >
              ← Dashboard
            </Link>
            <div className="h-4 w-px bg-[var(--color-surface-200)] hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-[var(--color-surface-900)] truncate max-w-xs sm:max-w-md">
                {event.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Dropdown */}
            <select
              value={event.status}
              onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
              className="text-xs font-bold rounded-lg px-2.5 py-1.5 border border-[var(--color-surface-200)] bg-white text-[var(--color-surface-800)] cursor-pointer"
              id="event-status-select"
              aria-label="Event Status"
            >
              <option value="draft">Draft</option>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* AI Plan Trigger */}
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="btn btn-primary btn-sm text-xs hidden md:inline-flex"
              id="generate-plan-header-btn"
            >
              {planLoading ? <span className="animate-spin" aria-hidden="true">✨</span> : <span aria-hidden="true">✨</span>}
              {planLoading ? 'Generating...' : 'Regenerate AI Plan'}
            </button>

            {/* AI Copilot Drawer Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="btn btn-secondary btn-sm text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)] hover:bg-[var(--color-primary-100)]"
              id="open-copilot-header-btn"
              aria-haspopup="dialog"
              aria-expanded={isCopilotOpen}
            >
              🤖 Copilot
            </button>

            {/* Print / Export */}
            <button
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm text-xs hidden sm:inline-flex"
              title="Print or Save PDF"
              id="print-plan-btn"
            >
              🖨️ Print
            </button>

            {/* Delete Event */}
            <button
              onClick={handleDeleteEvent}
              className="text-xs text-[var(--color-error-600)] hover:text-[var(--color-error-800)] font-semibold p-1.5"
              title="Delete Event"
              aria-label="Delete Event"
              id="delete-event-btn"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar with full WCAG 2.2 AA Tablist semantics */}
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Event management tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              id={`tab-btn-${tab.key}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'border-[var(--color-primary-600)] text-[var(--color-primary-700)] bg-[var(--color-primary-50)]/50'
                  : 'border-transparent text-[var(--color-surface-600)] hover:text-[var(--color-surface-900)] hover:border-[var(--color-surface-300)]'
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.2 bg-[var(--color-surface-200)] text-[var(--color-surface-700)] rounded-full font-bold"
                  aria-label={`${tab.count} items`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Floating Notification */}
        {alert && (
          <div
            role="status"
            aria-live="polite"
            className={`alert ${
              alert.type === 'success'
                ? 'alert-success'
                : alert.type === 'error'
                ? 'alert-danger'
                : 'alert-info'
            } flex items-center justify-between shadow-md animate-fade-in`}
          >
            <span className="text-xs sm:text-sm">{alert.text}</span>
            <button
              onClick={() => setAlert(null)}
              className="text-xs font-bold p-1 hover:opacity-75"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* Persistent Readiness Score Gauge */}
        <ReadinessCard readiness={readiness} loading={loading} />

        {/* Tab Panel Content Container */}
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-btn-${activeTab}`}
          tabIndex={0}
          className="focus:outline-hidden"
        >
          {activeTab === 'overview' && (
            <OverviewTab
              event={event}
              budget={budget}
              timeline={timeline}
              vendors={vendors}
              tasks={tasks}
              currency={event.currency}
              onNavigateTab={(tab) => {
                if (tab === 'copilot') {
                  setIsCopilotOpen(true);
                } else {
                  setActiveTab(tab);
                }
              }}
              onGeneratePlan={handleGeneratePlan}
              planLoading={planLoading}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetTab
              eventId={id}
              budget={budget}
              currency={event.currency}
              onUpdate={(updated) => {
                setBudget(updated);
                refreshReadiness();
              }}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab
              eventId={id}
              timeline={timeline}
              eventDate={event.date}
              onUpdate={(updated) => {
                setTimeline(updated);
                refreshReadiness();
              }}
            />
          )}

          {activeTab === 'vendors' && (
            <VendorsTab
              eventId={id}
              vendors={vendors}
              currency={event.currency}
              onUpdate={(updated) => {
                setVendors(updated);
                refreshReadiness();
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              eventId={id}
              tasks={tasks}
              eventDate={event.date}
              onUpdate={(updated) => {
                setTasks(updated);
                refreshReadiness();
              }}
            />
          )}
        </div>
      </main>

      {/* Slide-in AI Copilot Assistant */}
      <AICopilotDrawer
        event={event}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onPlanRefresh={loadEventData}
      />
    </div>
  );
}
