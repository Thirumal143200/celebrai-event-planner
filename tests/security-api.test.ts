import { describe, it, expect } from 'vitest';
import { parseRequestBody } from '@/lib/api-helpers';
import {
  EventStatusSchema,
  BudgetCategorySchema,
  TaskItemSchema,
  TimelineItemSchema,
  VendorItemSchema,
  IdParamSchema,
  CopilotMessageSchema,
} from '@/lib/validation';
import { saveToDisk, createEvent, getEvent, resetStore } from '@/lib/store';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

describe('Security & Validation Auditing', () => {
  it('validates and rejects unauthorized event statuses', () => {
    expect(EventStatusSchema.safeParse('draft').success).toBe(true);
    expect(EventStatusSchema.safeParse('planning').success).toBe(true);
    expect(EventStatusSchema.safeParse('confirmed').success).toBe(true);
    expect(EventStatusSchema.safeParse('admin_override').success).toBe(false);
    expect(EventStatusSchema.safeParse('<script>alert(1)</script>').success).toBe(false);
  });

  it('validates partial budget updates safely', () => {
    const validUpdate = { actual: 500, notes: 'Negotiated discount' };
    const result = BudgetCategorySchema.partial().safeParse(validUpdate);
    expect(result.success).toBe(true);

    const invalidUpdate = { actual: -500 }; // negative spend not allowed
    const failResult = BudgetCategorySchema.partial().safeParse(invalidUpdate);
    expect(failResult.success).toBe(false);
  });

  it('validates partial task updates safely', () => {
    const validUpdate = { completed: true, priority: 'critical' as const };
    const result = TaskItemSchema.partial().safeParse(validUpdate);
    expect(result.success).toBe(true);

    const invalidUpdate = { priority: 'super-urgent' };
    const failResult = TaskItemSchema.partial().safeParse(invalidUpdate);
    expect(failResult.success).toBe(false);
  });

  it('validates partial timeline updates safely', () => {
    const validUpdate = { status: 'completed' as const };
    const result = TimelineItemSchema.partial().safeParse(validUpdate);
    expect(result.success).toBe(true);

    const invalidUpdate = { status: 'not-a-status' };
    const failResult = TimelineItemSchema.partial().safeParse(invalidUpdate);
    expect(failResult.success).toBe(false);
  });

  it('validates partial vendor updates safely', () => {
    const validUpdate = { status: 'booked' as const, estimatedCost: 1200 };
    const result = VendorItemSchema.partial().safeParse(validUpdate);
    expect(result.success).toBe(true);

    const invalidUpdate = { status: 'unknown_status' };
    const failResult = VendorItemSchema.partial().safeParse(invalidUpdate);
    expect(failResult.success).toBe(false);
  });

  it('validates UUID event IDs strictly to prevent path traversal', () => {
    expect(IdParamSchema.safeParse({ id: '123e4567-e89b-12d3-a456-426614174000' }).success).toBe(true);
    expect(IdParamSchema.safeParse({ id: '../../etc/passwd' }).success).toBe(false);
    expect(IdParamSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
  });

  it('validates copilot message length and sanitized text', () => {
    const valid = {
      message: 'Can you help allocate my decor budget?',
      eventId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const res = CopilotMessageSchema.safeParse(valid);
    expect(res.success).toBe(true);

    const oversized = {
      message: 'a'.repeat(3000),
      eventId: '123e4567-e89b-12d3-a456-426614174000',
    };
    const failRes = CopilotMessageSchema.safeParse(oversized);
    expect(failRes.success).toBe(false);
  });

  it('rejects oversized request bodies via parseRequestBody', async () => {
    const req = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(2 * 1024 * 1024), // 2MB
      },
      body: JSON.stringify({ test: 'data' }),
    });

    const parsed = await parseRequestBody(req);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.response.status).toBe(413);
    }
  });

  it('rejects malformed non-JSON payloads gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'this is not json {',
    });

    const parsed = await parseRequestBody(req);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.response.status).toBe(400);
    }
  });

  it('persists data to disk backup and can be recovered', () => {
    resetStore();
    const event = createEvent({
      name: 'Persistence Verification Gala',
      type: 'community',
      date: '2027-11-20T18:00:00.000Z',
      guestCount: 100,
      budget: 10000,
      currency: 'USD',
      location: 'Grand Ballroom',
      description: 'Audit test event',
    });

    saveToDisk();

    const dataFile = path.join(process.cwd(), '.data', 'celebr-store.json');
    expect(fs.existsSync(dataFile)).toBe(true);

    const diskRaw = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const savedEvent = diskRaw.events.find((e: [string, any]) => e[0] === event.id);
    expect(savedEvent).toBeDefined();
    expect(savedEvent[1].name).toBe('Persistence Verification Gala');
  });

  it('detects persistence modes correctly according to hosting environment', async () => {
    const { getPersistenceMode } = await import('@/lib/db-adapter');
    const mode = getPersistenceMode();
    expect(mode.mode).toBe('local-file');
    expect(mode.isDurable).toBe(true);
    expect(mode.details).toContain('.data/celebr-store.json');
  });
});

