/**
 * In-memory persistence store with JSON file backup.
 * Provides CRUD operations for events and their associated data.
 * 
 * LIMITATION: This is a single-instance store suitable for demos.
 * For production, replace with a database (PostgreSQL, MongoDB, etc.).
 * Data persists across hot reloads via Node.js module caching.
 */
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  EventData,
  BudgetBreakdown,
  BudgetCategory,
  TimelineItem,
  VendorItem,
  TaskItem,
  AICopilotMessage,
  EventFormData,
} from './types';

// ============================================
// File-backed persistence configuration
// ============================================

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'celebr-store.json');

function loadFromDisk(): Partial<{
  events: [string, EventData][];
  budgets: [string, BudgetBreakdown][];
  timelines: [string, TimelineItem[]][];
  vendors: [string, VendorItem[]][];
  tasks: [string, TaskItem[]][];
  copilotHistory: [string, AICopilotMessage[]][];
}> | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[CelebrAI Store] Failed to load store from disk:', err);
  }
  return null;
}

let saveTimeout: NodeJS.Timeout | null = null;

function schedulePersist(): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToDisk();
  }, 100);
}

export function saveToDisk(): void {
  try {
    const store = getStore();
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      events: Array.from(store.events.entries()),
      budgets: Array.from(store.budgets.entries()),
      timelines: Array.from(store.timelines.entries()),
      vendors: Array.from(store.vendors.entries()),
      tasks: Array.from(store.tasks.entries()),
      copilotHistory: Array.from(store.copilotHistory.entries()),
    };
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.warn('[CelebrAI Store] Failed to save store to disk:', err);
  }
}

// ============================================
// In-memory store (survives hot reloads via globalThis)
// ============================================

interface Store {
  events: Map<string, EventData>;
  budgets: Map<string, BudgetBreakdown>;
  timelines: Map<string, TimelineItem[]>;
  vendors: Map<string, VendorItem[]>;
  tasks: Map<string, TaskItem[]>;
  copilotHistory: Map<string, AICopilotMessage[]>;
}

// Use globalThis to persist across Next.js hot reloads
const globalStore = globalThis as unknown as { __celebrai_store?: Store };

function getStore(): Store {
  if (!globalStore.__celebrai_store) {
    const diskData = process.env.NODE_ENV !== 'test' ? loadFromDisk() : null;
    globalStore.__celebrai_store = {
      events: new Map(diskData?.events || []),
      budgets: new Map(diskData?.budgets || []),
      timelines: new Map(diskData?.timelines || []),
      vendors: new Map(diskData?.vendors || []),
      tasks: new Map(diskData?.tasks || []),
      copilotHistory: new Map(diskData?.copilotHistory || []),
    };
  }
  return globalStore.__celebrai_store;
}

export function resetStore(): void {
  const store = getStore();
  store.events.clear();
  store.budgets.clear();
  store.timelines.clear();
  store.vendors.clear();
  store.tasks.clear();
  store.copilotHistory.clear();
}


// ============================================
// Event CRUD
// ============================================

export function createEvent(formData: EventFormData): EventData {
  const store = getStore();
  const now = new Date().toISOString();
  const event: EventData = {
    ...formData,
    id: randomUUID(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  store.events.set(event.id, event);

  // Initialize empty collections
  store.timelines.set(event.id, []);
  store.vendors.set(event.id, []);
  store.tasks.set(event.id, []);
  store.copilotHistory.set(event.id, []);

  // Initialize default budget
  const budget = createDefaultBudget(event);
  store.budgets.set(event.id, budget);

  schedulePersist();
  return event;
}

export function getEvent(id: string): EventData | undefined {
  return getStore().events.get(id);
}

export function getAllEvents(): EventData[] {
  return Array.from(getStore().events.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateEvent(id: string, updates: Partial<EventFormData>): EventData | undefined {
  const store = getStore();
  const event = store.events.get(id);
  if (!event) return undefined;

  const updated: EventData = {
    ...event,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  store.events.set(id, updated);
  schedulePersist();
  return updated;
}

export function updateEventStatus(id: string, status: EventData['status']): EventData | undefined {
  const store = getStore();
  const event = store.events.get(id);
  if (!event) return undefined;

  event.status = status;
  event.updatedAt = new Date().toISOString();
  store.events.set(id, event);
  schedulePersist();
  return event;
}

export function deleteEvent(id: string): boolean {
  const store = getStore();
  if (!store.events.has(id)) return false;

  store.events.delete(id);
  store.budgets.delete(id);
  store.timelines.delete(id);
  store.vendors.delete(id);
  store.tasks.delete(id);
  store.copilotHistory.delete(id);
  schedulePersist();
  return true;
}

// ============================================
// Budget Operations (Deterministic)
// ============================================

function createDefaultBudget(event: EventData): BudgetBreakdown {
  return {
    eventId: event.id,
    totalBudget: event.budget,
    currency: event.currency,
    categories: [],
    contingencyPercent: 10,
    totalAllocated: 0,
    totalEstimated: 0,
    totalActual: 0,
    remaining: event.budget,
    contingencyAmount: Math.round(event.budget * 0.1 * 100) / 100,
  };
}

/** Recompute all budget totals deterministically */
export function recomputeBudget(budget: BudgetBreakdown): BudgetBreakdown {
  const totalAllocated = budget.categories.reduce(
    (sum, c) => sum + c.allocated, 0
  );
  const totalEstimated = budget.categories.reduce(
    (sum, c) => sum + c.estimated, 0
  );
  const totalActual = budget.categories.reduce(
    (sum, c) => sum + c.actual, 0
  );
  const contingencyAmount = Math.round(
    budget.totalBudget * (budget.contingencyPercent / 100) * 100
  ) / 100;
  const remaining = Math.round(
    (budget.totalBudget - totalEstimated - contingencyAmount) * 100
  ) / 100;

  return {
    ...budget,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    totalEstimated: Math.round(totalEstimated * 100) / 100,
    totalActual: Math.round(totalActual * 100) / 100,
    remaining: remaining,
    contingencyAmount,
  };
}

export function getBudget(eventId: string): BudgetBreakdown | undefined {
  return getStore().budgets.get(eventId);
}

export function setBudgetCategories(
  eventId: string,
  categories: BudgetCategory[]
): BudgetBreakdown | undefined {
  const store = getStore();
  const budget = store.budgets.get(eventId);
  if (!budget) return undefined;

  budget.categories = categories;
  const recomputed = recomputeBudget(budget);
  store.budgets.set(eventId, recomputed);
  schedulePersist();
  return recomputed;
}

export function updateContingencyPercent(
  eventId: string,
  percent: number
): BudgetBreakdown | undefined {
  const store = getStore();
  const budget = store.budgets.get(eventId);
  if (!budget) return undefined;

  budget.contingencyPercent = Math.max(0, Math.min(50, percent));
  const recomputed = recomputeBudget(budget);
  store.budgets.set(eventId, recomputed);
  schedulePersist();
  return recomputed;
}

export function updateBudgetCategory(
  eventId: string,
  categoryId: string,
  updates: Partial<BudgetCategory>
): BudgetBreakdown | undefined {
  const store = getStore();
  const budget = store.budgets.get(eventId);
  if (!budget) return undefined;

  const idx = budget.categories.findIndex((c) => c.id === categoryId);
  if (idx === -1) return undefined;

  budget.categories[idx] = { ...budget.categories[idx], ...updates };
  const recomputed = recomputeBudget(budget);
  store.budgets.set(eventId, recomputed);
  schedulePersist();
  return recomputed;
}

// ============================================
// Timeline Operations
// ============================================

export function getTimeline(eventId: string): TimelineItem[] {
  return getStore().timelines.get(eventId) || [];
}

export function setTimeline(eventId: string, items: TimelineItem[]): TimelineItem[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  getStore().timelines.set(eventId, sorted);
  schedulePersist();
  return sorted;
}

export function updateTimelineItem(
  eventId: string,
  itemId: string,
  updates: Partial<TimelineItem>
): TimelineItem[] | undefined {
  const store = getStore();
  const items = store.timelines.get(eventId);
  if (!items) return undefined;

  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return undefined;

  items[idx] = { ...items[idx], ...updates };
  store.timelines.set(eventId, items);
  schedulePersist();
  return items;
}

// ============================================
// Vendor Operations
// ============================================

export function getVendors(eventId: string): VendorItem[] {
  return getStore().vendors.get(eventId) || [];
}

export function setVendors(eventId: string, items: VendorItem[]): VendorItem[] {
  getStore().vendors.set(eventId, items);
  schedulePersist();
  return items;
}

export function updateVendor(
  eventId: string,
  vendorId: string,
  updates: Partial<VendorItem>
): VendorItem[] | undefined {
  const store = getStore();
  const items = store.vendors.get(eventId);
  if (!items) return undefined;

  const idx = items.findIndex((v) => v.id === vendorId);
  if (idx === -1) return undefined;

  items[idx] = { ...items[idx], ...updates };
  store.vendors.set(eventId, items);
  schedulePersist();
  return items;
}

// ============================================
// Task Operations
// ============================================

export function getTasks(eventId: string): TaskItem[] {
  return getStore().tasks.get(eventId) || [];
}

export function setTasks(eventId: string, items: TaskItem[]): TaskItem[] {
  getStore().tasks.set(eventId, items);
  schedulePersist();
  return items;
}

export function updateTask(
  eventId: string,
  taskId: string,
  updates: Partial<TaskItem>
): TaskItem[] | undefined {
  const store = getStore();
  const items = store.tasks.get(eventId);
  if (!items) return undefined;

  const idx = items.findIndex((t) => t.id === taskId);
  if (idx === -1) return undefined;

  items[idx] = { ...items[idx], ...updates };
  store.tasks.set(eventId, items);
  schedulePersist();
  return items;
}

export function toggleTask(eventId: string, taskId: string): TaskItem[] | undefined {
  const store = getStore();
  const items = store.tasks.get(eventId);
  if (!items) return undefined;

  const idx = items.findIndex((t) => t.id === taskId);
  if (idx === -1) return undefined;

  items[idx].completed = !items[idx].completed;
  store.tasks.set(eventId, items);
  schedulePersist();
  return items;
}

// ============================================
// Copilot History
// ============================================

export function getCopilotHistory(eventId: string): AICopilotMessage[] {
  return getStore().copilotHistory.get(eventId) || [];
}

export function addCopilotMessage(
  eventId: string,
  message: AICopilotMessage
): AICopilotMessage[] {
  const store = getStore();
  const history = store.copilotHistory.get(eventId) || [];
  history.push(message);
  // Keep last 50 messages
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  store.copilotHistory.set(eventId, history);
  schedulePersist();
  return history;
}

// ============================================
// Non-Destructive Plan Application
// ============================================

export function applyPlanNonDestructive(
  eventId: string,
  plan: import('./types').AIPlanSuggestion
): {
  budget: BudgetBreakdown | undefined;
  timeline: TimelineItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
} {
  const store = getStore();

  // 1. Budget merge: preserve existing user budget and custom categories
  const existingBudget = store.budgets.get(eventId);
  let updatedBudget: BudgetBreakdown | undefined;
  if (existingBudget && existingBudget.categories.length > 0) {
    const existingNames = new Set(existingBudget.categories.map((c) => c.name.toLowerCase().trim()));
    const newCategories = plan.budgetCategories.filter(
      (c) => !existingNames.has(c.name.toLowerCase().trim())
    );
    if (newCategories.length > 0) {
      updatedBudget = setBudgetCategories(eventId, [...existingBudget.categories, ...newCategories]);
    } else {
      updatedBudget = existingBudget;
    }
  } else {
    updatedBudget = setBudgetCategories(eventId, plan.budgetCategories);
  }

  // 2. Timeline merge: preserve user milestones and do not duplicate by title
  const existingTimeline = store.timelines.get(eventId) || [];
  const existingTimelineTitles = new Set(
    existingTimeline.map((t) => t.title.toLowerCase().trim())
  );
  const newTimelineItems = plan.timeline.filter(
    (t) => !existingTimelineTitles.has(t.title.toLowerCase().trim())
  );
  const updatedTimeline = setTimeline(eventId, [...existingTimeline, ...newTimelineItems]);

  // 3. Vendors merge: preserve user vendor bookings and do not duplicate categories
  const existingVendors = store.vendors.get(eventId) || [];
  const existingVendorCats = new Set(
    existingVendors.map((v) => v.category.toLowerCase().trim())
  );
  const newVendors = plan.vendors.filter(
    (v) => !existingVendorCats.has(v.category.toLowerCase().trim())
  );
  const updatedVendors = setVendors(eventId, [...existingVendors, ...newVendors]);

  // 4. Tasks merge: preserve completed status and do not duplicate by title
  const existingTasks = store.tasks.get(eventId) || [];
  const existingTaskTitles = new Set(
    existingTasks.map((t) => t.title.toLowerCase().trim())
  );
  const newTasks = plan.tasks.filter(
    (t) => !existingTaskTitles.has(t.title.toLowerCase().trim())
  );
  const updatedTasks = setTasks(eventId, [...existingTasks, ...newTasks]);

  schedulePersist();
  return {
    budget: updatedBudget,
    timeline: updatedTimeline,
    vendors: updatedVendors,
    tasks: updatedTasks,
  };
}

