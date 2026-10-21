import { describe, it, expect } from 'vitest';
import {
  EventFormSchema,
  BudgetCategorySchema,
  TimelineItemSchema,
  VendorItemSchema,
  TaskItemSchema,
  CopilotMessageSchema,
} from '@/lib/validation';

describe('Zod Validation Schemas', () => {
  describe('EventFormSchema', () => {
    it('accepts valid event payloads', () => {
      const valid = {
        name: 'Community Food Festival',
        type: 'community',
        date: '2027-06-15T10:00:00.000Z',
        guestCount: 300,
        budget: 15000,
        currency: 'USD',
        location: 'Central Park',
        description: 'Annual gathering with live performances',
      };
      const result = EventFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty or missing names', () => {
      const invalid = {
        name: '',
        type: 'wedding',
        date: '2027-06-15',
        guestCount: 50,
        budget: 5000,
        currency: 'USD',
        location: '',
        description: '',
      };
      const result = EventFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid guest counts (<= 0)', () => {
      const invalid = {
        name: 'Alex Birthday',
        type: 'birthday',
        date: '2027-06-15',
        guestCount: 0,
        budget: 2000,
        currency: 'USD',
        location: '',
        description: '',
      };
      const result = EventFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects negative budgets', () => {
      const invalid = {
        name: 'Alex Birthday',
        type: 'birthday',
        date: '2027-06-15',
        guestCount: 20,
        budget: -500,
        currency: 'USD',
        location: '',
        description: '',
      };
      const result = EventFormSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('BudgetCategorySchema', () => {
    it('validates correct budget category', () => {
      const valid = {
        id: 'cat-1',
        name: 'Venue & Staging',
        allocated: 35,
        estimated: 7000,
        actual: 6500,
        notes: 'Deposit paid',
      };
      const result = BudgetCategorySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects negative allocation or estimated amounts', () => {
      const invalid = {
        id: 'cat-1',
        name: 'Venue',
        allocated: -10,
        estimated: -500,
        actual: 0,
        notes: '',
      };
      const result = BudgetCategorySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('TimelineItemSchema', () => {
    it('validates timeline items and enum statuses', () => {
      const valid = {
        id: 't-1',
        title: 'Send Save-the-Dates',
        description: 'Mail physical cards to guests',
        dueDate: '2027-01-15',
        status: 'pending',
        category: 'Invitations',
        sortOrder: 1,
      };
      const result = TimelineItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid status values', () => {
      const invalid = {
        id: 't-1',
        title: 'Title',
        description: '',
        dueDate: '2027-01-15',
        status: 'unknown-status',
        category: '',
        sortOrder: 1,
      };
      const result = TimelineItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('VendorItemSchema', () => {
    it('validates vendor item attributes', () => {
      const valid = {
        id: 'v-1',
        category: 'Catering',
        name: 'Gourmet Bites LLC',
        status: 'contacted',
        estimatedCost: 8000,
        notes: 'Menu tasting scheduled for Friday',
        contactInfo: 'chef@gourmetbites.com',
        isRequired: true,
      };
      const result = VendorItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('TaskItemSchema', () => {
    it('validates task attributes and priority', () => {
      const valid = {
        id: 'task-1',
        title: 'Obtain sound amplification permit',
        description: 'City hall submission',
        completed: false,
        priority: 'critical',
        dueDate: '2027-05-01',
        category: 'Permits',
        assignee: 'Marcus',
      };
      const result = TaskItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('CopilotMessageSchema', () => {
    it('validates non-empty prompt requests', () => {
      const valid = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Can you recommend decor ideas?',
      };
      const result = CopilotMessageSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects blank messages', () => {
      const invalid = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        message: '   ',
      };
      const result = CopilotMessageSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
