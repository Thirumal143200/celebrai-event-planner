/**
 * Timeline API
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema, TimelineItemSchema } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getTimeline, setTimeline, updateTimelineItem } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, TimelineItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TimelineItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: getTimeline(id) });
  } catch (error) {
    console.error('Timeline GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TimelineItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<TimelineItem[]>>;
    }
    const body = parseResult.data;

    // Single item update
    if (body.itemId && body.updates) {
      const updateResult = TimelineItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid timeline updates', message: updateResult.error.message },
          { status: 400 }
        );
      }
      const updated = updateTimelineItem(id, body.itemId, updateResult.data);
      if (!updated) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Bulk update
    if (body.items) {
      const result = z.array(TimelineItemSchema).safeParse(body.items);
      if (!result.success) {
        return NextResponse.json({ success: false, error: 'Invalid data', message: result.error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: setTimeline(id, result.data) });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Timeline PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update timeline' }, { status: 500 });
  }
}
