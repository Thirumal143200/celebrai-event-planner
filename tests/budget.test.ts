import { describe, it, expect } from 'vitest';
import { recomputeBudget } from '@/lib/store';
import type { BudgetBreakdown } from '@/lib/types';

describe('Budget Recomputation Arithmetic', () => {
  it('correctly aggregates allocated, estimated, actual, and remaining balance', () => {
    const rawBudget: BudgetBreakdown = {
      eventId: 'evt-1',
      totalBudget: 20000,
      currency: 'USD',
      categories: [
        { id: 'c1', name: 'Venue', allocated: 40, estimated: 8000, actual: 7500, notes: '' },
        { id: 'c2', name: 'Catering', allocated: 30, estimated: 6000, actual: 6200, notes: '' },
        { id: 'c3', name: 'Music', allocated: 15, estimated: 3000, actual: 2800, notes: '' },
      ],
      contingencyPercent: 10,
      totalAllocated: 0,
      totalEstimated: 0,
      totalActual: 0,
      remaining: 0,
      contingencyAmount: 0,
    };

    const recomputed = recomputeBudget(rawBudget);

    expect(recomputed.totalAllocated).toBe(85);
    expect(recomputed.totalEstimated).toBe(17000);
    expect(recomputed.totalActual).toBe(16500);
    expect(recomputed.contingencyAmount).toBe(2000); // 10% of 20,000
    // Remaining = 20000 - 17000 - 2000 = 1000
    expect(recomputed.remaining).toBe(1000);
  });

  it('correctly calculates negative remaining when over budget', () => {
    const rawBudget: BudgetBreakdown = {
      eventId: 'evt-2',
      totalBudget: 10000,
      currency: 'EUR',
      categories: [
        { id: 'c1', name: 'Venue', allocated: 80, estimated: 8000, actual: 8000, notes: '' },
        { id: 'c2', name: 'Decor', allocated: 30, estimated: 3500, actual: 3500, notes: '' },
      ],
      contingencyPercent: 10, // 1000
      totalAllocated: 0,
      totalEstimated: 0,
      totalActual: 0,
      remaining: 0,
      contingencyAmount: 0,
    };

    const recomputed = recomputeBudget(rawBudget);
    // 10000 - 11500 - 1000 = -2500
    expect(recomputed.remaining).toBe(-2500);
  });

  it('handles empty categories with contingency reserve', () => {
    const rawBudget: BudgetBreakdown = {
      eventId: 'evt-3',
      totalBudget: 5000,
      currency: 'GBP',
      categories: [],
      contingencyPercent: 15, // 750
      totalAllocated: 0,
      totalEstimated: 0,
      totalActual: 0,
      remaining: 0,
      contingencyAmount: 0,
    };

    const recomputed = recomputeBudget(rawBudget);
    expect(recomputed.totalAllocated).toBe(0);
    expect(recomputed.totalEstimated).toBe(0);
    expect(recomputed.contingencyAmount).toBe(750);
    expect(recomputed.remaining).toBe(4250);
  });
});
