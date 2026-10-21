/**
 * Core type definitions for the CelebrAI Event Planner.
 * All types used across the application are defined here for consistency.
 */

// ============================================
// Event Types
// ============================================

export type EventType = 'wedding' | 'birthday' | 'community';

export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface EventData {
  id: string;
  name: string;
  type: EventType;
  date: string; // ISO date string
  guestCount: number;
  budget: number;
  currency: Currency;
  location: string;
  description: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Budget Types
// ============================================

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number; // percentage of total budget
  estimated: number; // absolute amount
  actual: number;    // actual spend
  notes: string;
}

export interface BudgetBreakdown {
  eventId: string;
  totalBudget: number;
  currency: Currency;
  categories: BudgetCategory[];
  contingencyPercent: number;
  /** Computed fields — always deterministic */
  totalAllocated: number;
  totalEstimated: number;
  totalActual: number;
  remaining: number;
  contingencyAmount: number;
}

// ============================================
// Timeline Types
// ============================================

export type TimelineItemStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TimelineItemStatus;
  category: string;
  sortOrder: number;
}

// ============================================
// Vendor / Checklist Types
// ============================================

export type VendorStatus = 'needed' | 'researching' | 'contacted' | 'booked' | 'confirmed';

export interface VendorItem {
  id: string;
  category: string;
  name: string;
  status: VendorStatus;
  estimatedCost: number;
  notes: string;
  contactInfo: string;
  isRequired: boolean;
}

// ============================================
// Task Types
// ============================================

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate: string;
  category: string;
  assignee: string;
}

// ============================================
// AI-Generated Plan Types
// ============================================

export interface AIPlanSuggestion {
  timeline: TimelineItem[];
  budgetCategories: BudgetCategory[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  themes: string[];
  tips: string[];
}

export interface AICopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAIGenerated: boolean;
}

// ============================================
// Readiness Score
// ============================================

export interface ReadinessScore {
  overall: number; // 0-100
  breakdown: {
    budget: number;
    timeline: number;
    vendors: number;
    tasks: number;
  };
  recommendations: string[];
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  isDemo?: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// Form State Types
// ============================================

export interface EventFormData {
  name: string;
  type: EventType;
  date: string;
  guestCount: number;
  budget: number;
  currency: Currency;
  location: string;
  description: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;
