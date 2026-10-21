import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEvent,
  getEvent,
  getBudget,
  getTimeline,
  getVendors,
  getTasks,
  setTasks,
  toggleTask,
  applyPlanNonDestructive,
  resetStore,
} from '@/lib/store';
import { calculateReadiness } from '@/lib/readiness';
import { DemoProvider } from '@/lib/ai-provider';
import type { EventFormData, TaskItem } from '@/lib/types';

describe('End-to-End Workflow & Plan Regeneration Auditing', () => {
  const provider = new DemoProvider();

  beforeEach(() => {
    resetStore();
  });

  it('executes a complete Wedding workflow from draft to planning with plan generation', async () => {
    const weddingForm: EventFormData = {
      name: 'Jessica & Michael Nuptials',
      type: 'wedding',
      date: '2027-06-25T17:00:00.000Z',
      guestCount: 150,
      budget: 45000,
      currency: 'USD',
      location: 'Rosewood Estate',
      description: 'Elegant outdoor summer wedding',
    };

    const event = createEvent(weddingForm);
    expect(event.status).toBe('draft');

    // Initial readiness should reflect newly created event
    const initialReadiness = calculateReadiness(
      event,
      getBudget(event.id),
      getTimeline(event.id),
      getVendors(event.id),
      getTasks(event.id)
    );
    expect(initialReadiness.overall).toBeLessThan(30);

    // Generate AI/template plan
    const plan = await provider.generatePlan(event);
    applyPlanNonDestructive(event.id, plan);

    // Verify populated collections
    const budget = getBudget(event.id);
    const timeline = getTimeline(event.id);
    const vendors = getVendors(event.id);
    const tasks = getTasks(event.id);

    expect(budget?.categories.length).toBeGreaterThan(0);
    expect(timeline.length).toBeGreaterThan(0);
    expect(vendors.length).toBeGreaterThan(0);
    expect(tasks.length).toBeGreaterThan(0);

    // Post-generation readiness should improve
    const postPlanReadiness = calculateReadiness(event, budget, timeline, vendors, tasks);
    expect(postPlanReadiness.overall).toBeGreaterThan(initialReadiness.overall);
  });

  it('executes a complete Birthday workflow with custom tasks and activities', async () => {
    const birthdayForm: EventFormData = {
      name: 'Oliver 8th Dinosaur Adventure',
      type: 'birthday',
      date: '2027-05-10T14:00:00.000Z',
      guestCount: 25,
      budget: 1500,
      currency: 'USD',
      location: 'Sunnyvale Community Park',
      description: 'Dinosaur scavenger hunt and cake',
    };

    const event = createEvent(birthdayForm);
    const plan = await provider.generatePlan(event);
    applyPlanNonDestructive(event.id, plan);

    const tasks = getTasks(event.id);
    expect(tasks.length).toBeGreaterThan(0);

    // User checks off first task
    const firstTask = tasks[0];
    toggleTask(event.id, firstTask.id);

    const updatedTasks = getTasks(event.id);
    expect(updatedTasks.find((t) => t.id === firstTask.id)?.completed).toBe(true);
  });

  it('executes a complete Community Event workflow requiring permits and logistics', async () => {
    const communityForm: EventFormData = {
      name: 'Oak Creek Clean Rivers Day',
      type: 'community',
      date: '2027-09-18T08:00:00.000Z',
      guestCount: 300,
      budget: 8000,
      currency: 'USD',
      location: 'Oak Creek Basin',
      description: 'Volunteer river cleanup and eco festival',
    };

    const event = createEvent(communityForm);
    const plan = await provider.generatePlan(event);
    applyPlanNonDestructive(event.id, plan);

    const vendors = getVendors(event.id);
    expect(vendors.some((v) => v.category.toLowerCase().includes('permit') || v.category.toLowerCase().includes('equipment'))).toBe(true);
  });

  it('preserves user custom edits and completed tasks when regenerating plan without duplication', async () => {
    const event = createEvent({
      name: 'Non-Destructive Test Gala',
      type: 'wedding',
      date: '2027-07-20T16:00:00.000Z',
      guestCount: 100,
      budget: 20000,
      currency: 'USD',
      location: 'Civic Center',
      description: 'Regeneration test event',
    });

    // 1. First plan generation
    const firstPlan = await provider.generatePlan(event);
    applyPlanNonDestructive(event.id, firstPlan);

    const initialTasks = getTasks(event.id);
    const initialTaskCount = initialTasks.length;
    expect(initialTaskCount).toBeGreaterThan(0);

    // Complete the first task
    const targetTaskId = initialTasks[0].id;
    toggleTask(event.id, targetTaskId);
    expect(getTasks(event.id).find((t) => t.id === targetTaskId)?.completed).toBe(true);

    // Add a custom user task
    const customUserTask: TaskItem = {
      id: 'custom-task-special',
      title: 'Handcraft personalized welcome envelopes',
      description: 'Special bespoke stationary',
      completed: true,
      priority: 'high',
      dueDate: '2027-06-01',
      category: 'Decor',
      assignee: 'Bride',
    };
    setTasks(event.id, [...getTasks(event.id), customUserTask]);

    // 2. Regenerate plan
    const secondPlan = await provider.generatePlan(event);
    applyPlanNonDestructive(event.id, secondPlan);

    const regeneratedTasks = getTasks(event.id);

    // The user's custom task must still exist and be completed
    const preservedCustomTask = regeneratedTasks.find((t) => t.id === 'custom-task-special');
    expect(preservedCustomTask).toBeDefined();
    expect(preservedCustomTask?.completed).toBe(true);

    // The completed task from the first plan must still be completed
    const preservedCompletedTask = regeneratedTasks.find((t) => t.id === targetTaskId);
    expect(preservedCompletedTask?.completed).toBe(true);

    // Check for duplicates: no duplicate titles
    const titles = regeneratedTasks.map((t) => t.title.toLowerCase().trim());
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });
});
