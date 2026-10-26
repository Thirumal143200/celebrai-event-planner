/**
 * Event Readiness Score Calculator.
 * 
 * Uses deterministic logic (no AI) to calculate how prepared an event is.
 * Scores are transparent and explainable — each dimension has clear criteria.
 */
import type {
  EventData,
  BudgetBreakdown,
  TimelineItem,
  VendorItem,
  TaskItem,
  ReadinessScore,
} from './types';
import { getDaysUntil, formatCurrency } from './utils';

export const READINESS_WEIGHTS = {
  budget: 0.25,
  timeline: 0.25,
  vendors: 0.25,
  tasks: 0.25,
} as const;

/**
 * Calculate the event readiness score.
 * All calculations are deterministic and transparent.
 */
export function calculateReadiness(
  event: EventData,
  budget: BudgetBreakdown | undefined,
  timeline: TimelineItem[],
  vendors: VendorItem[],
  tasks: TaskItem[]
): ReadinessScore {
  const budgetScore = calculateBudgetScore(budget);
  const timelineScore = calculateTimelineScore(timeline, event.date);
  const vendorScore = calculateVendorScore(vendors);
  const taskScore = calculateTaskScore(tasks);

  // Weighted average using configured pillar weights
  const overall = Math.round(
    budgetScore * READINESS_WEIGHTS.budget +
    timelineScore * READINESS_WEIGHTS.timeline +
    vendorScore * READINESS_WEIGHTS.vendors +
    taskScore * READINESS_WEIGHTS.tasks
  );

  const recommendations = generateRecommendations(
    event,
    budget,
    timeline,
    vendors,
    tasks,
    { budget: budgetScore, timeline: timelineScore, vendors: vendorScore, tasks: taskScore }
  );

  return {
    overall: clamp(overall, 0, 100),
    breakdown: {
      budget: clamp(budgetScore, 0, 100),
      timeline: clamp(timelineScore, 0, 100),
      vendors: clamp(vendorScore, 0, 100),
      tasks: clamp(taskScore, 0, 100),
    },
    recommendations,
  };
}

function calculateBudgetScore(budget: BudgetBreakdown | undefined): number {
  if (!budget) return 0;
  if (budget.categories.length === 0) return 10; // Just created

  let score = 0;

  // Has budget categories defined (30 pts)
  score += Math.min(30, budget.categories.length * 5);

  // Budget allocations sum close to 100% (30 pts)
  const allocationGap = Math.abs(100 - budget.totalAllocated);
  if (allocationGap <= 5) score += 30;
  else if (allocationGap <= 15) score += 20;
  else if (allocationGap <= 30) score += 10;

  // Has actual spend tracking started (20 pts)
  const categoriesWithActual = budget.categories.filter((c) => c.actual > 0).length;
  score += Math.min(20, (categoriesWithActual / Math.max(1, budget.categories.length)) * 20);

  // Has contingency set (10 pts)
  if (budget.contingencyPercent > 0) score += 10;

  // Budget is not overspent (10 pts)
  if (budget.remaining >= 0) score += 10;

  return Math.round(score);
}

function calculateTimelineScore(timeline: TimelineItem[], eventDate: string): number {
  if (timeline.length === 0) return 0;

  let score = 0;

  // Has timeline items (20 pts)
  score += Math.min(20, timeline.length * 3);

  // Completed items ratio (40 pts)
  const completed = timeline.filter((t) => t.status === 'completed').length;
  score += Math.round((completed / timeline.length) * 40);

  // No overdue items (20 pts)
  const overdue = timeline.filter((t) => {
    if (t.status === 'completed') return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  if (overdue === 0) score += 20;
  else score += Math.max(0, 20 - overdue * 5);

  // Event date is set and in the future (20 pts)
  if (eventDate && new Date(eventDate) > new Date()) {
    score += 20;
  }

  return Math.round(score);
}

function calculateVendorScore(vendors: VendorItem[]): number {
  if (vendors.length === 0) return 0;

  const required = vendors.filter((v) => v.isRequired);
  if (required.length === 0) return 50; // All optional, partial credit

  let score = 0;

  // Has vendor categories (20 pts)
  score += Math.min(20, vendors.length * 3);

  // Required vendors booked/confirmed (50 pts)
  const bookedRequired = required.filter(
    (v) => v.status === 'booked' || v.status === 'confirmed'
  ).length;
  score += Math.round((bookedRequired / required.length) * 50);

  // Any vendors with cost estimates (15 pts)
  const withEstimates = vendors.filter((v) => v.estimatedCost > 0).length;
  score += Math.min(15, Math.round((withEstimates / vendors.length) * 15));

  // All vendors at least contacted (15 pts)
  const contacted = vendors.filter(
    (v) => v.status !== 'needed'
  ).length;
  score += Math.round((contacted / vendors.length) * 15);

  return Math.round(score);
}

function calculateTaskScore(tasks: TaskItem[]): number {
  if (tasks.length === 0) return 0;

  let score = 0;

  // Has tasks defined (15 pts)
  score += Math.min(15, tasks.length * 2);

  // Completed tasks ratio (50 pts)
  const completed = tasks.filter((t) => t.completed).length;
  score += Math.round((completed / tasks.length) * 50);

  // Critical tasks completed (20 pts)
  const critical = tasks.filter((t) => t.priority === 'critical');
  if (critical.length === 0) {
    score += 20;
  } else {
    const criticalDone = critical.filter((t) => t.completed).length;
    score += Math.round((criticalDone / critical.length) * 20);
  }

  // No overdue tasks (15 pts)
  const overdue = tasks.filter((t) => {
    if (t.completed) return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  if (overdue === 0) score += 15;
  else score += Math.max(0, 15 - overdue * 3);

  return Math.round(score);
}

function generateRecommendations(
  event: EventData,
  budget: BudgetBreakdown | undefined,
  timeline: TimelineItem[],
  vendors: VendorItem[],
  tasks: TaskItem[],
  scores: { budget: number; timeline: number; vendors: number; tasks: number }
): string[] {
  const recs: string[] = [];

  // Budget recommendations
  if (scores.budget < 30) {
    if (!budget || budget.categories.length === 0) {
      recs.push('Set up your budget categories to start tracking expenses');
    }
  }
  if (budget && budget.remaining < 0) {
    recs.push(`Your estimated costs exceed your budget by ${formatCurrency(Math.abs(budget.remaining), budget.currency)}. Consider reducing scope or increasing budget.`);
  }
  if (budget && budget.totalAllocated > 0 && Math.abs(100 - budget.totalAllocated) > 15) {
    recs.push(`Budget allocations sum to ${budget.totalAllocated.toFixed(1)}%. Adjust to total closer to 100%.`);
  }

  // Timeline recommendations
  if (timeline.length === 0) {
    recs.push('Create a timeline with key milestones to stay on track');
  }
  const overdueTimeline = timeline.filter(
    (t) => t.status !== 'completed' && new Date(t.dueDate) < new Date()
  );
  if (overdueTimeline.length > 0) {
    recs.push(`${overdueTimeline.length} timeline milestone${overdueTimeline.length > 1 ? 's are' : ' is'} overdue — review and update`);
  }

  // Vendor recommendations
  const neededVendors = vendors.filter((v) => v.isRequired && v.status === 'needed');
  if (neededVendors.length > 0) {
    recs.push(`${neededVendors.length} required vendor${neededVendors.length > 1 ? ' categories need' : ' category needs'} attention: ${neededVendors.map((v) => v.category).slice(0, 3).join(', ')}`);
  }

  // Task recommendations
  const criticalTasks = tasks.filter((t) => t.priority === 'critical' && !t.completed);
  if (criticalTasks.length > 0) {
    recs.push(`${criticalTasks.length} critical task${criticalTasks.length > 1 ? 's remain' : ' remains'}: ${criticalTasks[0].title}`);
  }

  // Days until event
  const daysUntil = getDaysUntil(event.date);
  if (daysUntil < 30 && daysUntil > 0 && scores.vendors < 50) {
    recs.push(`Only ${daysUntil} days until your event — prioritize vendor confirmations`);
  }
  if (daysUntil < 0) {
    recs.push('Your event date has passed. Update the status accordingly.');
  }

  return recs.slice(0, 5); // Max 5 recommendations
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

