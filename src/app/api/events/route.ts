/**
 * Events API — CRUD operations for events.
 * GET: List all events
 * POST: Create a new event
 */
import { NextRequest, NextResponse } from 'next/server';
import { EventFormSchema } from '@/lib/validation';
import { createEvent, getAllEvents } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, EventData } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<EventData[]>>> {
  try {
    const events = getAllEvents();
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EventData>>> {
  try {
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<EventData>>;
    }
    const body = parseResult.data;

    // Validate input
    const result = EventFormSchema.safeParse(body);
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

    const event = createEvent(result.data);

    return NextResponse.json(
      { success: true, data: event, message: 'Event created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
