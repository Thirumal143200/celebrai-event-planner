/**
 * Zod validation schemas for all inputs.
 * Used for server-side validation in API routes and client-side form validation.
 * All AI model output is also validated against these schemas.
 */
import { z } from 'zod';

// ============================================
// Primitives & Enums
// ============================================

export const EventTypeSchema = z.enum(['wedding', 'birthday', 'community']);
export const EventStatusSchema = z.enum(['draft', 'planning', 'confirmed', 'completed', 'cancelled']);
export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'INR']);
export const TimelineItemStatusSchema = z.enum(['pending', 'in-progress', 'completed', 'overdue']);
export const VendorStatusSchema = z.enum(['needed', 'researching', 'contacted', 'booked', 'confirmed']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// ============================================
// Sanitization helpers
// ============================================

/** Strip HTML tags and limit length to prevent XSS */
const sanitizedString = (maxLength: number) =>
  z.string()
    .max(maxLength)
    .transform((val) => val.replace(/<[^>]*>/g, '').trim());

const safeText = (maxLength: number = 500) =>
  z.string()
    .trim()
    .min(1, 'This field is required')
    .max(maxLength, `Maximum ${maxLength} characters`)
    .transform((val) => val.replace(/<[^>]*>/g, ''));

// ============================================
// Event Schemas
// ============================================

export const EventFormSchema = z.object({
  name: safeText(200),
  type: EventTypeSchema,
  date: z.string()
    .min(1, 'Date is required')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, 'Invalid date format'),
  guestCount: z.number()
    .int('Guest count must be a whole number')
    .min(1, 'At least 1 guest required')
    .max(100000, 'Maximum 100,000 guests'),
  budget: z.number()
    .min(0, 'Budget cannot be negative')
    .max(100_000_000, 'Maximum budget exceeded'),
  currency: CurrencySchema,
  location: safeText(500),
  description: sanitizedString(2000).optional().default(''),
});

export const EventDataSchema = EventFormSchema.extend({
  id: z.string().uuid(),
  status: EventStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================
// Budget Schemas
// ============================================

export const BudgetCategorySchema = z.object({
  id: z.string().min(1),
  name: safeText(100),
  allocated: z.number().min(0).max(100),
  estimated: z.number().min(0),
  actual: z.number().min(0),
  notes: sanitizedString(500).optional().default(''),
});

export const BudgetBreakdownSchema = z.object({
  eventId: z.string().uuid(),
  totalBudget: z.number().min(0),
  currency: CurrencySchema,
  categories: z.array(BudgetCategorySchema).max(50),
  contingencyPercent: z.number().min(0).max(30),
  totalAllocated: z.number().min(0),
  totalEstimated: z.number().min(0),
  totalActual: z.number().min(0),
  remaining: z.number(),
  contingencyAmount: z.number().min(0),
});

// ============================================
// Timeline Schemas
// ============================================

export const TimelineItemSchema = z.object({
  id: z.string().min(1),
  title: safeText(200),
  description: sanitizedString(500).optional().default(''),
  dueDate: z.string().min(1),
  status: TimelineItemStatusSchema,
  category: safeText(100),
  sortOrder: z.number().int().min(0),
});

// ============================================
// Vendor Schemas
// ============================================

export const VendorItemSchema = z.object({
  id: z.string().min(1),
  category: safeText(100),
  name: sanitizedString(200).optional().default(''),
  status: VendorStatusSchema,
  estimatedCost: z.number().min(0),
  notes: sanitizedString(500).optional().default(''),
  contactInfo: sanitizedString(200).optional().default(''),
  isRequired: z.boolean(),
});

// ============================================
// Task Schemas
// ============================================

export const TaskItemSchema = z.object({
  id: z.string().min(1),
  title: safeText(200),
  description: sanitizedString(500).optional().default(''),
  completed: z.boolean(),
  priority: TaskPrioritySchema,
  dueDate: z.string().min(1),
  category: safeText(100),
  assignee: sanitizedString(100).optional().default(''),
});

// ============================================
// AI Plan Suggestion Schema (for validating model output)
// ============================================

export const AIPlanSuggestionSchema = z.object({
  timeline: z.array(TimelineItemSchema).max(30),
  budgetCategories: z.array(BudgetCategorySchema).max(20),
  vendors: z.array(VendorItemSchema).max(30),
  tasks: z.array(TaskItemSchema).max(50),
  themes: z.array(z.string().max(200)).max(10),
  tips: z.array(z.string().max(500)).max(10),
});

// ============================================
// Copilot Message Schema
// ============================================

export const CopilotMessageSchema = z.object({
  message: safeText(2000),
  eventId: z.string().uuid(),
});

// ============================================
// ID param schema
// ============================================

export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});
