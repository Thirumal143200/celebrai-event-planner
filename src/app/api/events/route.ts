/**
 * Events API — CRUD operations for events.
 * GET: List all events
 * POST: Create a new event
 */
import { NextRequest, NextResponse } from 'next/server';
import { EventFormSchema } from '@/lib/validation';
import { createEvent, getAllEvents } from '@/lib/store';
import { parseAndValidateBody, apiSuccess, apiError } from '@/lib/api-helpers';
import type { ApiResponse, EventData } from '@/lib/types';

import { z } from 'zod';

export async function GET(): Promise<NextResponse<ApiResponse<EventData[]>>> {
  try {
    const events = getAllEvents();
    return apiSuccess(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return apiError('Failed to fetch events', 500);
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EventData>>> {
  try {
    const validation = await parseAndValidateBody<z.infer<typeof EventFormSchema>, EventData>(
      request,
      EventFormSchema
    );
    if (!validation.success) {
      return validation.response;
    }

    const event = createEvent(validation.data);

    return apiSuccess(event, 201, { message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    return apiError('Failed to create event', 500);
  }
}
