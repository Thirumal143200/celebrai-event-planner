'use client';

import React from 'react';
import type { ReadinessScore } from '@/lib/types';

interface ReadinessCardProps {
  readiness: ReadinessScore | null;
  loading?: boolean;
}

export default function ReadinessCard({ readiness, loading }: ReadinessCardProps) {
  if (loading || !readiness) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 bg-[var(--color-surface-200)] rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-[var(--color-surface-200)] rounded w-full mb-2"></div>
        <div className="h-4 bg-[var(--color-surface-200)] rounded w-2/3"></div>
      </div>
    );
  }

  const { overall, breakdown, recommendations } = readiness;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-[var(--color-success-600)]', bg: 'bg-[var(--color-success-500)]', badge: 'badge-success', label: 'Celebration Ready 🎉' };
    if (score >= 55) return { text: 'text-[var(--color-info-600)]', bg: 'bg-[var(--color-info-500)]', badge: 'badge-info', label: 'On Track 🚀' };
    if (score >= 30) return { text: 'text-[var(--color-warning-600)]', bg: 'bg-[var(--color-warning-500)]', badge: 'badge-warning', label: 'In Progress ⏳' };
    return { text: 'text-[var(--color-error-600)]', bg: 'bg-[var(--color-error-500)]', badge: 'badge-error', label: 'Needs Attention ⚠️' };
  };

  const status = getScoreColor(overall);

  return (
    <div className="glass-card p-6 relative overflow-hidden" id="readiness-score-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--color-surface-100)]">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-inner border border-[var(--color-surface-200)]">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--color-surface-200)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${status.text} transition-all duration-1000 ease-out`}
                strokeDasharray={`${overall}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-[var(--color-surface-900)] leading-none">{overall}%</span>
              <span className="text-[10px] font-semibold text-[var(--color-surface-400)] uppercase tracking-wider mt-0.5">Score</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-[var(--color-surface-900)]">Event Readiness</h2>
              <span className={`badge ${status.badge} font-bold text-xs`}>{status.label}</span>
            </div>
            <p className="text-sm text-[var(--color-surface-500)] max-w-md">
              Transparent assessment computed across your budget allocation, milestone progress, vendor confirmations, and tasks.
            </p>
          </div>
        </div>

        {/* 4 Pillars Gauge */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-xl">
          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[var(--color-surface-500)]">💰 Budget</span>
              <span className="text-xs font-bold text-[var(--color-surface-800)]">{breakdown.budget}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-100)] h-2 rounded-full overflow-hidden">
              <div className="bg-[var(--color-primary-500)] h-full rounded-full transition-all duration-700" style={{ width: `${breakdown.budget}%` }}></div>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[var(--color-surface-500)]">⏱️ Timeline</span>
              <span className="text-xs font-bold text-[var(--color-surface-800)]">{breakdown.timeline}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-100)] h-2 rounded-full overflow-hidden">
              <div className="bg-[var(--color-info-500)] h-full rounded-full transition-all duration-700" style={{ width: `${breakdown.timeline}%` }}></div>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[var(--color-surface-500)]">🤝 Vendors</span>
              <span className="text-xs font-bold text-[var(--color-surface-800)]">{breakdown.vendors}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-100)] h-2 rounded-full overflow-hidden">
              <div className="bg-[var(--color-accent-500)] h-full rounded-full transition-all duration-700" style={{ width: `${breakdown.vendors}%` }}></div>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-[var(--color-surface-100)]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[var(--color-surface-500)]">✅ Tasks</span>
              <span className="text-xs font-bold text-[var(--color-surface-800)]">{breakdown.tasks}%</span>
            </div>
            <div className="w-full bg-[var(--color-surface-100)] h-2 rounded-full overflow-hidden">
              <div className="bg-[var(--color-success-500)] h-full rounded-full transition-all duration-700" style={{ width: `${breakdown.tasks}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-wider">🎯 Actionable Recommendations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[var(--color-primary-50)] text-[var(--color-primary-900)] text-xs px-3 py-1.5 rounded-lg border border-[var(--color-primary-200)] shadow-xs"
              >
                <span className="text-xs">💡</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
