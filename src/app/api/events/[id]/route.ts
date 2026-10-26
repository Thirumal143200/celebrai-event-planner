/**
 * Single Event API — GET, PUT, DELETE by ID
 * Supports single-call ?aggregate=true for ultra-low latency workspace hydration.
 */
import { NextRequest, NextResponse } from 'next/server';
import { EventFormSchema, EventStatusSchema } from '@/lib/validation';
import { getEvent, getEventAggregate, updateEvent, deleteEvent, updateEventStatus } from '@/lib/store';
import { parseRequestBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, EventData, EventAggregateData } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

interface EventUpdateBody {
  status?: string;
  name?: string;
  type?: 'wedding' | 'birthday' | 'community';
  date?: string;
  guestCount?: number;
  budget?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'INR';
  location?: string;
  description?: string;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EventData | EventAggregateData>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) {
      return validation.response;
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get('aggregate') === 'true') {
      const aggregate = getEventAggregate(id);
      if (!aggregate) {
        return apiError('Event not found', 404);
      }
      return apiSuccess(aggregate);
    }

    const event = getEvent(id);
    if (!event) {
      return apiError('Event not found', 404);
    }

    return apiSuccess(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return apiError('Failed to fetch event', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<EventData>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) {
      return validation.response;
    }

    const parseResult = await parseRequestBody<EventUpdateBody>(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<EventData>>;
    }
    const body = parseResult.data;

    // Check if this is a dedicated status update
    if (body.status && Object.keys(body).length === 1) {
      const statusValidation = EventStatusSchema.safeParse(body.status);
      if (!statusValidation.success) {
        return apiError('Invalid event status', 400);
      }
      const updated = updateEventStatus(id, statusValidation.data);
      if (!updated) {
        return apiError('Event not found', 404);
      }
      return apiSuccess(updated);
    }

    // Full update with partial schema validation
    const result = EventFormSchema.partial().safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return apiError('Validation failed', 400, errorMsg);
    }

    const updated = updateEvent(id, result.data);
    if (!updated) {
      return apiError('Event not found', 404);
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error('Error updating event:', error);
    return apiError('Failed to update event', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) {
      return validation.response;
    }

    const deleted = deleteEvent(id);
    if (!deleted) {
      return apiError('Event not found', 404);
    }

    return apiSuccess(null, 200, { message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return apiError('Failed to delete event', 500);
  }
}
