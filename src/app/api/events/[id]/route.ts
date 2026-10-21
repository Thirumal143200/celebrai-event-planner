/**
 * Single Event API — GET, PUT, DELETE by ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { EventFormSchema, IdParamSchema, EventStatusSchema } from '@/lib/validation';
import { getEvent, updateEvent, deleteEvent, updateEventStatus } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, EventData } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EventData>>> {
  try {
    const { id } = await context.params;
    const validation = IdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const event = getEvent(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EventData>>> {
  try {
    const { id } = await context.params;
    const validation = IdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<EventData>>;
    }
    const body = parseResult.data;

    // Check if this is a status update
    if (body.status && Object.keys(body).length === 1) {
      const statusValidation = EventStatusSchema.safeParse(body.status);
      if (!statusValidation.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid event status' },
          { status: 400 }
        );
      }
      const updated = updateEventStatus(id, statusValidation.data);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Event not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }

    // Full update
    const result = EventFormSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
        },
        { status: 400 }
      );
    }

    const updated = updateEvent(id, result.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await context.params;
    const validation = IdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    const deleted = deleteEvent(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
