import { describe, it, expect } from 'vitest';
import {
  createEvent,
  getEvent,
  getAllEvents,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getBudget,
  setBudgetCategories,
  updateContingencyPercent,
  getTimeline,
  setTimeline,
  getVendors,
  setVendors,
  getTasks,
  setTasks,
  toggleTask,
  addCopilotMessage,
  getCopilotHistory,
} from '@/lib/store';
import type { EventFormData } from '@/lib/types';

describe('In-Memory Data Store', () => {
  const sampleForm: EventFormData = {
    name: '30th Golden Birthday Bash',
    type: 'birthday',
    date: '2027-08-20T19:00:00.000Z',
    guestCount: 75,
    budget: 8000,
    currency: 'USD',
    location: 'Rooftop Lounge, Austin TX',
    description: 'Gold and velvet evening party',
  };

  it('creates and retrieves an event with initialized default budget', () => {
    const event = createEvent(sampleForm);
    expect(event.id).toBeDefined();
    expect(event.name).toBe(sampleForm.name);
    expect(event.status).toBe('draft');

    const fetched = getEvent(event.id);
    expect(fetched).toEqual(event);

    const budget = getBudget(event.id);
    expect(budget).toBeDefined();
    expect(budget?.totalBudget).toBe(8000);
    expect(budget?.contingencyPercent).toBe(10);
  });

  it('updates event fields and status', () => {
    const event = createEvent(sampleForm);
    const updated = updateEvent(event.id, { guestCount: 90, budget: 9500 });
    expect(updated?.guestCount).toBe(90);
    expect(updated?.budget).toBe(9500);

    const statusUpdated = updateEventStatus(event.id, 'confirmed');
    expect(statusUpdated?.status).toBe('confirmed');
  });

  it('manages budget categories and contingency', () => {
    const event = createEvent(sampleForm);
    const updatedBudget = setBudgetCategories(event.id, [
      { id: 'b1', name: 'DJ & Sound', allocated: 25, estimated: 2000, actual: 1900, notes: '' },
      { id: 'b2', name: 'Catering', allocated: 50, estimated: 4000, actual: 4100, notes: '' },
    ]);

    expect(updatedBudget?.totalAllocated).toBe(75);
    expect(updatedBudget?.totalEstimated).toBe(6000);
    expect(updatedBudget?.totalActual).toBe(6000);

    const contingencyBudget = updateContingencyPercent(event.id, 15);
    expect(contingencyBudget?.contingencyPercent).toBe(15);
  });

  it('manages timeline items', () => {
    const event = createEvent(sampleForm);
    const items = [
      {
        id: 't1',
        title: 'Book Rooftop',
        description: '',
        dueDate: '2027-06-01',
        status: 'pending' as const,
        category: 'Venue',
        sortOrder: 1,
      },
    ];

    setTimeline(event.id, items);
    const fetched = getTimeline(event.id);
    expect(fetched.length).toBe(1);
    expect(fetched[0].title).toBe('Book Rooftop');
  });

  it('manages tasks and toggling completion', () => {
    const event = createEvent(sampleForm);
    const tasks = [
      {
        id: 'tk1',
        title: 'Order cake',
        description: '',
        completed: false,
        priority: 'high' as const,
        dueDate: '2027-08-10',
        category: 'Food',
        assignee: 'Partner',
      },
    ];

    setTasks(event.id, tasks);
    expect(getTasks(event.id)[0].completed).toBe(false);

    toggleTask(event.id, 'tk1');
    expect(getTasks(event.id)[0].completed).toBe(true);

    toggleTask(event.id, 'tk1');
    expect(getTasks(event.id)[0].completed).toBe(false);
  });

  it('manages copilot chat history and respects 50-message buffer', () => {
    const event = createEvent(sampleForm);
    addCopilotMessage(event.id, {
      id: 'm1',
      role: 'user',
      content: 'Hello!',
      timestamp: new Date().toISOString(),
      isAIGenerated: false,
    });

    const history = getCopilotHistory(event.id);
    expect(history.length).toBe(1);
    expect(history[0].content).toBe('Hello!');
  });

  it('deletes an event and cleans up associated stores', () => {
    const event = createEvent(sampleForm);
    expect(getEvent(event.id)).toBeDefined();

    const deleted = deleteEvent(event.id);
    expect(deleted).toBe(true);
    expect(getEvent(event.id)).toBeUndefined();
    expect(getBudget(event.id)).toBeUndefined();
    expect(getTimeline(event.id)).toEqual([]);
  });
});
