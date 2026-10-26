import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, validateIdParam, parseRequestBody, parseAndValidateBody } from '@/lib/api-helpers';

describe('API Helpers — Resilience & Validation', () => {
  it('formats standard apiSuccess responses correctly', async () => {
    const res = apiSuccess({ sample: 'data' }, 200, { message: 'Success message', isDemo: true });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ sample: 'data' });
    expect(json.message).toBe('Success message');
    expect(json.isDemo).toBe(true);
  });

  it('formats standard apiError responses correctly', async () => {
    const res = apiError('Resource not found', 404, 'The requested item does not exist');
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Resource not found');
    expect(json.message).toBe('The requested item does not exist');
  });

  it('validates UUIDs and blocks malformed IDs via validateIdParam', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const validResult = validateIdParam(validUuid);
    expect(validResult.valid).toBe(true);
    if (validResult.valid) {
      expect(validResult.id).toBe(validUuid);
    }

    const invalidResult = validateIdParam('invalid-id-format');
    expect(invalidResult.valid).toBe(false);
    if (!invalidResult.valid) {
      expect(invalidResult.response.status).toBe(400);
    }

    const traversalResult = validateIdParam('../../../etc/passwd');
    expect(traversalResult.valid).toBe(false);
  });

  it('parses and validates request body with strict Zod schema', async () => {
    const schema = z.object({
      name: z.string().min(3),
      count: z.number().int().positive(),
    });

    const validReq = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Anniversary Dinner', count: 4 }),
    });

    const result = await parseAndValidateBody(validReq, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Anniversary Dinner');
      expect(result.data.count).toBe(4);
    }
  });

  it('rejects invalid fields with formatted error details', async () => {
    const schema = z.object({
      name: z.string().min(5),
      count: z.number().min(1),
    });

    const invalidReq = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hi', count: -1 }),
    });

    const result = await parseAndValidateBody(invalidReq, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const json = await result.response.json();
      expect(json.message).toContain('name');
      expect(json.message).toContain('count');
    }
  });
});
