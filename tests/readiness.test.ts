import { describe, it, expect } from 'vitest';
import { calculateReadiness } from '@/lib/readiness';
import type {
  EventData,
  BudgetBreakdown,
  TimelineItem,
  VendorItem,
  TaskItem,
} from '@/lib/types';

describe('Event Readiness Calculator', () => {
  const baseEvent: EventData = {
    id: 'test-event-1',
    name: 'Sarah & Alex Wedding',
    type: 'wedding',
    date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days in future
    guestCount: 150,
    budget: 30000,
    currency: 'USD',
    location: 'San Francisco, CA',
    description: 'A beautiful botanical celebration',
    status: 'planning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('computes initial score when data is empty', () => {
    const score = calculateReadiness(baseEvent, undefined, [], [], []);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.breakdown.budget).toBe(0);
    expect(score.breakdown.timeline).toBe(0);
    expect(score.breakdown.vendors).toBe(0);
    expect(score.breakdown.tasks).toBe(0);
    expect(score.recommendations.length).toBeGreaterThan(0);
  });

  it('computes high score when event is fully prepared and all items completed', () => {
    const fullyAllocatedBudget: BudgetBreakdown = {
      eventId: baseEvent.id,
      totalBudget: 30000,
      currency: 'USD',
      categories: [
        { id: 'b1', name: 'Venue', allocated: 50, estimated: 15000, actual: 15000, notes: '' },
        { id: 'b2', name: 'Catering', allocated: 50, estimated: 15000, actual: 14000, notes: '' },
      ],
      contingencyPercent: 10,
      totalAllocated: 100,
      totalEstimated: 30000,
      totalActual: 29000,
      remaining: 1000,
      contingencyAmount: 3000,
    };

    const completedTimeline: TimelineItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Milestone ${i + 1}`,
      description: '',
      dueDate: new Date(Date.now() + (30 + i * 5) * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed' as const,
      category: 'General',
      sortOrder: i + 1,
    }));

    const confirmedVendors: VendorItem[] = Array.from({ length: 7 }, (_, i) => ({
      id: `v${i + 1}`,
      category: `Category ${i + 1}`,
      name: `Vendor ${i + 1}`,
      status: 'confirmed' as const,
      estimatedCost: 2000,
      contactInfo: 'vendor@example.com',
      notes: '',
      isRequired: true,
    }));

    const completedTasks: TaskItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `tk${i + 1}`,
      title: `Task ${i + 1}`,
      description: '',
      completed: true,
      priority: (i === 0 ? 'critical' : 'high') as TaskItem['priority'],
      dueDate: new Date(Date.now() + (10 + i * 2) * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Admin',
      assignee: 'Self',
    }));

    const score = calculateReadiness(
      baseEvent,
      fullyAllocatedBudget,
      completedTimeline,
      confirmedVendors,
      completedTasks
    );

    expect(score.overall).toBeGreaterThanOrEqual(80);
    expect(score.breakdown.budget).toBeGreaterThan(60);
    expect(score.breakdown.timeline).toBe(100);
    expect(score.breakdown.vendors).toBe(100);
    expect(score.breakdown.tasks).toBe(100);
  });

  it('penalizes overdue milestones and tasks', () => {
    const overdueTimeline: TimelineItem[] = [
      {
        id: 't1',
        title: 'Overdue Booking',
        description: '',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in past
        status: 'pending',
        category: 'Venue',
        sortOrder: 1,
      },
    ];

    const score = calculateReadiness(baseEvent, undefined, overdueTimeline, [], []);
    expect(score.breakdown.timeline).toBeLessThan(50);
    expect(score.recommendations.some((r) => r.includes('overdue'))).toBe(true);
  });

  it('identifies over-budget conditions in recommendations', () => {
    const overBudget: BudgetBreakdown = {
      eventId: baseEvent.id,
      totalBudget: 10000,
      currency: 'USD',
      categories: [
        { id: 'b1', name: 'Venue', allocated: 120, estimated: 12000, actual: 12000, notes: '' },
      ],
      contingencyPercent: 10,
      totalAllocated: 120,
      totalEstimated: 12000,
      totalActual: 12000,
      remaining: -3000,
      contingencyAmount: 1000,
    };

    const score = calculateReadiness(baseEvent, overBudget, [], [], []);
    expect(score.recommendations.some((r) => r.includes('exceed your budget'))).toBe(true);
  });
});
