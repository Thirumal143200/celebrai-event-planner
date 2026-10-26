import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEvent,
  getEventAggregate,
  resetStore,
  setBudgetCategories,
  setTimeline,
  setVendors,
  setTasks,
} from '@/lib/store';
import type { EventFormData, BudgetCategory, TimelineItem, VendorItem, TaskItem } from '@/lib/types';

describe('Event Aggregate Store & Fast Hydration', () => {
  beforeEach(() => {
    resetStore();
  });

  it('retrieves full event aggregate payload in a single call', () => {
    const formData: EventFormData = {
      name: 'Maya 30th Birthday Bash',
      type: 'birthday',
      date: '2027-11-20T19:00:00.000Z',
      guestCount: 35,
      budget: 3500,
      currency: 'USD',
      location: 'Rooftop Lounge, Austin',
      description: 'Intimate celebration with DJ and appetizers',
    };

    const event = createEvent(formData);

    const categories: BudgetCategory[] = [
      { id: 'b1', name: 'Venue & Food', allocated: 60, estimated: 2100, actual: 2000, notes: '' },
      { id: 'b2', name: 'Music & DJ', allocated: 25, estimated: 875, actual: 800, notes: '' },
      { id: 'b3', name: 'Decor & Cake', allocated: 15, estimated: 525, actual: 400, notes: '' },
    ];
    setBudgetCategories(event.id, categories);

    const timeline: TimelineItem[] = [
      { id: 't1', title: 'Confirm Venue', description: '', dueDate: '2027-10-01', status: 'completed', category: 'Venue', sortOrder: 1 },
      { id: 't2', title: 'Order Custom Cake', description: '', dueDate: '2027-11-01', status: 'pending', category: 'Catering', sortOrder: 2 },
    ];
    setTimeline(event.id, timeline);

    const vendors: VendorItem[] = [
      { id: 'v1', category: 'DJ', name: 'SoundWave Austin', status: 'booked', estimatedCost: 800, notes: '', contactInfo: '', isRequired: true },
    ];
    setVendors(event.id, vendors);

    const tasks: TaskItem[] = [
      { id: 'tk1', title: 'Send digital invites', description: '', completed: true, priority: 'high', dueDate: '2027-10-15', category: 'Invitations', assignee: 'Maya' },
      { id: 'tk2', title: 'Create Spotify playlist backup', description: '', completed: false, priority: 'medium', dueDate: '2027-11-18', category: 'Music', assignee: 'Sam' },
    ];
    setTasks(event.id, tasks);

    const aggregate = getEventAggregate(event.id);

    expect(aggregate).toBeDefined();
    expect(aggregate?.event.id).toBe(event.id);
    expect(aggregate?.event.name).toBe('Maya 30th Birthday Bash');
    expect(aggregate?.budget?.categories.length).toBe(3);
    expect(aggregate?.timeline.length).toBe(2);
    expect(aggregate?.vendors.length).toBe(1);
    expect(aggregate?.tasks.length).toBe(2);
    expect(aggregate?.readiness).toBeDefined();
    expect(aggregate?.readiness?.overall).toBeGreaterThan(0);
    expect(aggregate?.readiness?.breakdown.budget).toBeGreaterThan(0);
    expect(aggregate?.readiness?.breakdown.timeline).toBeGreaterThan(0);
  });

  it('returns undefined for non-existent event aggregate', () => {
    const aggregate = getEventAggregate('non-existent-id');
    expect(aggregate).toBeUndefined();
  });
});
