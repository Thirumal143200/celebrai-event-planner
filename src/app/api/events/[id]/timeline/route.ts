/**
 * Timeline API
 */
import { NextRequest, NextResponse } from 'next/server';
import { TimelineItemSchema, TimelinePutInput } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getTimeline, setTimeline, updateTimelineItem } from '@/lib/store';
import { parseRequestBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, TimelineItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TimelineItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<TimelineItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<TimelineItem[]>('Event not found', 404);

    return apiSuccess(getTimeline(id));
  } catch (error) {
    console.error('Timeline GET error:', error);
    return apiError<TimelineItem[]>('Failed to fetch timeline', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TimelineItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<TimelineItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<TimelineItem[]>('Event not found', 404);

    const parseResult = await parseRequestBody<TimelinePutInput, TimelineItem[]>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // Single item update
    if ('itemId' in body && body.itemId && 'updates' in body && body.updates) {
      const updateResult = TimelineItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return apiError<TimelineItem[]>('Invalid timeline updates', 400, updateResult.error.message);
      }
      const updated = updateTimelineItem(id, body.itemId, updateResult.data);
      if (!updated) return apiError<TimelineItem[]>('Item not found', 404);
      return apiSuccess(updated);
    }

    // Bulk update
    if ('items' in body && body.items) {
      const result = z.array(TimelineItemSchema).safeParse(body.items);
      if (!result.success) {
        return apiError<TimelineItem[]>('Invalid data', 400, result.error.message);
      }
      return apiSuccess(setTimeline(id, result.data));
    }

    return apiError<TimelineItem[]>('Invalid request', 400);
  } catch (error) {
    console.error('Timeline PUT error:', error);
    return apiError<TimelineItem[]>('Failed to update timeline', 500);
  }
}
