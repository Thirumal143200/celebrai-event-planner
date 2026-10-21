'use client';

import React from 'react';
import type {
  EventData,
  BudgetBreakdown,
  TimelineItem,
  VendorItem,
  TaskItem,
  Currency,
} from '@/lib/types';
import { getDaysUntil } from '@/lib/utils';

interface OverviewTabProps {
  event: EventData;
  budget: BudgetBreakdown | null;
  timeline: TimelineItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  currency: Currency;
  onNavigateTab: (tab: 'budget' | 'timeline' | 'vendors' | 'tasks' | 'copilot') => void;
  onGeneratePlan: () => void;
  planLoading: boolean;
}

export default function OverviewTab({
  event,
  budget,
  timeline,
  vendors,
  tasks,
  currency,
  onNavigateTab,
  onGeneratePlan,
  planLoading,
}: OverviewTabProps) {
  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };
  const sym = currencySymbols[currency] || '$';

  const daysUntil = getDaysUntil(event.date);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const bookedVendors = vendors.filter((v) => v.status === 'booked' || v.status === 'confirmed').length;
  const completedMilestones = timeline.filter((t) => t.status === 'completed').length;

  const defaultThemes: Record<string, { title: string; desc: string; palette: string[] }[]> = {
    wedding: [
      { title: 'Enchanted Botanical', desc: 'Lush greenery, warm candlelight, white roses, and organic wood textures.', palette: ['#2e473b', '#e2ded5', '#d4af37'] },
      { title: 'Modern Minimalist Luxe', desc: 'Crisp architectural lines, monochromatic alabaster, and refined champagne metallic accents.', palette: ['#1e1e1e', '#f4f4f4', '#d4af37'] },
      { title: 'Golden Hour Sunset', desc: 'Terracotta, dusty rose, amber glassware, and warm ambient illumination.', palette: ['#c86446', '#e0987c', '#f5cb8b'] },
    ],
    birthday: [
      { title: 'Midnight Neon & Velvet', desc: 'Electric jewel tones, iridescent party favors, modern synthwave vibes.', palette: ['#3b0764', '#06b6d4', '#f43f5e'] },
      { title: 'Artisanal Garden Picnic', desc: 'Gingham linens, rustic charcuterie boards, wildflowers, and fairy lights.', palette: ['#4d7c0f', '#fef08a', '#fb923c'] },
      { title: 'Retro Disco Glam', desc: 'Mirrored disco spheres, vintage typography, bold chrome, and champagne fountains.', palette: ['#0f172a', '#e2e8f0', '#ec4899'] },
    ],
    community: [
      { title: 'Community Harvest & Unity', desc: 'Earth tones, locally sourced catering, interactive community mural boards.', palette: ['#78350f', '#d97706', '#65a30d'] },
      { title: 'Festival of Lights & Harmony', desc: 'Festive lanterns, multicultural food stalls, acoustic stage lighting.', palette: ['#1e3a8a', '#f59e0b', '#ec4899'] },
      { title: 'Future Horizons Summit', desc: 'Clean sustainable displays, recycled bamboo stations, tech-forward presentation zones.', palette: ['#0f766e', '#0284c7', '#f1f5f9'] },
    ],
  };

  const themes = defaultThemes[event.type] || defaultThemes.wedding;

  const eventTypeIcons: Record<string, string> = {
    wedding: '💍',
    birthday: '🎂',
    community: '🌍',
  };

  return (
    <div className="space-y-6" id="overview-section">
      {/* Hero Welcome Banner */}
      <div className="glass-card p-6 md:p-8 bg-gradient-to-r from-white via-white/90 to-[var(--color-primary-50)] border-l-4 border-l-[var(--color-primary-600)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{eventTypeIcons[event.type] || '✨'}</span>
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--color-surface-900)] tracking-tight">
                  {event.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[var(--color-surface-500)] font-semibold mt-0.5">
                  <span className="capitalize">{event.type} Event</span>
                  <span>•</span>
                  <span>📅 {new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
                  {event.location && (
                    <>
                      <span>•</span>
                      <span>📍 {event.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {event.description && (
              <p className="text-xs text-[var(--color-surface-600)] max-w-2xl leading-relaxed pt-1">
                {event.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onGeneratePlan}
              disabled={planLoading}
              className="btn btn-primary text-xs shadow-md"
              id="generate-ai-plan-overview-btn"
            >
              {planLoading ? (
                <>
                  <span className="animate-spin">✨</span> Generating Plan...
                </>
              ) : (
                <>
                  <span>✨</span> Generate Full AI Plan
                </>
              )}
            </button>
            <button
              onClick={() => onNavigateTab('copilot')}
              className="btn btn-secondary text-xs"
              id="open-copilot-overview-btn"
            >
              🤖 Open Copilot
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Budget Card */}
        <div
          onClick={() => onNavigateTab('budget')}
          className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-[var(--color-primary-300)] transition-all group"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--color-surface-500)] uppercase">💰 Budget</span>
            <span className="text-xs text-[var(--color-primary-600)] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="text-xl font-bold text-[var(--color-surface-900)] mb-1">
            {sym}{event.budget.toLocaleString()}
          </div>
          <div className="text-xs text-[var(--color-surface-500)]">
            {budget ? `${sym}${budget.remaining.toLocaleString()} remaining` : 'No categories yet'}
          </div>
        </div>

        {/* Timeline Card */}
        <div
          onClick={() => onNavigateTab('timeline')}
          className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-[var(--color-primary-300)] transition-all group"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--color-surface-500)] uppercase">⏱️ Countdown</span>
            <span className="text-xs text-[var(--color-primary-600)] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="text-xl font-bold text-[var(--color-surface-900)] mb-1">
            {daysUntil < 0 ? 'Event Concluded' : daysUntil === 0 ? 'Today!' : `${daysUntil} Days`}
          </div>
          <div className="text-xs text-[var(--color-surface-500)]">
            {timeline.length} milestone{timeline.length !== 1 ? 's' : ''} ({completedMilestones} completed)
          </div>
        </div>

        {/* Vendors Card */}
        <div
          onClick={() => onNavigateTab('vendors')}
          className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-[var(--color-primary-300)] transition-all group"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--color-surface-500)] uppercase">🤝 Vendors</span>
            <span className="text-xs text-[var(--color-primary-600)] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="text-xl font-bold text-[var(--color-surface-900)] mb-1">
            {bookedVendors} / {vendors.length}
          </div>
          <div className="text-xs text-[var(--color-surface-500)]">
            {vendors.length > 0 ? `${((bookedVendors / vendors.length) * 100).toFixed(0)}% secured` : 'No vendors added'}
          </div>
        </div>

        {/* Tasks Card */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="glass-card p-5 cursor-pointer hover:shadow-md hover:border-[var(--color-primary-300)] transition-all group"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--color-surface-500)] uppercase">✅ Tasks</span>
            <span className="text-xs text-[var(--color-primary-600)] font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <div className="text-xl font-bold text-[var(--color-surface-900)] mb-1">
            {completedTasks} / {tasks.length}
          </div>
          <div className="text-xs text-[var(--color-surface-500)]">
            {tasks.length > 0 ? `${tasks.length - completedTasks} active tasks` : 'No tasks created'}
          </div>
        </div>
      </div>

      {/* Aesthetic Concepts & Themes Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-surface-900)]">Curated Celebration Themes</h3>
            <p className="text-xs text-[var(--color-surface-500)]">
              Personalized aesthetic palettes and design motifs tailored for your {event.type}.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('copilot')}
            className="text-xs font-bold text-[var(--color-primary-600)] hover:underline"
          >
            Ask AI for custom theme →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {themes.map((theme, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/70 border border-[var(--color-surface-200)] flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {theme.palette.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <h4 className="font-bold text-sm text-[var(--color-surface-900)] mb-1.5">{theme.title}</h4>
                <p className="text-xs text-[var(--color-surface-600)] leading-relaxed">{theme.desc}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-[var(--color-surface-100)]">
                <button
                  onClick={() => onNavigateTab('copilot')}
                  className="text-[11px] font-bold text-[var(--color-primary-600)] hover:underline"
                >
                  Apply in AI Copilot →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planning Best Practices */}
      <div className="glass-card p-6 bg-gradient-to-br from-white to-[var(--color-surface-50)]">
        <h3 className="text-base font-bold text-[var(--color-surface-900)] mb-3">
          💡 Expert Event Execution Tips
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[var(--color-surface-600)]">
          <div className="bg-white p-3.5 rounded-xl border border-[var(--color-surface-100)]">
            <span className="font-bold text-[var(--color-surface-800)] block mb-1">Contract Buffer</span>
            Always verify written cancellation terms, power supply allowances, and load-in timing windows with your venue.
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[var(--color-surface-100)]">
            <span className="font-bold text-[var(--color-surface-800)] block mb-1">Dietary Headcounts</span>
            Collect final guest dietary restrictions (vegan, gluten-free, nut allergies) at least 14 days prior to event date.
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-[var(--color-surface-100)]">
            <span className="font-bold text-[var(--color-surface-800)] block mb-1">Day-of Emergency Kit</span>
            Keep fabric tape, stain remover wipes, pain relievers, power banks, and hard-copy vendor contact lists on site.
          </div>
        </div>
      </div>
    </div>
  );
}
