/**
 * Readiness Score API
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema } from '@/lib/validation';
import { getEvent, getBudget, getTimeline, getVendors, getTasks } from '@/lib/store';
import { calculateReadiness } from '@/lib/readiness';
import type { ApiResponse, ReadinessScore } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<ReadinessScore>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const event = getEvent(id);
    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const budget = getBudget(id);
    const timeline = getTimeline(id);
    const vendors = getVendors(id);
    const tasks = getTasks(id);

    const readiness = calculateReadiness(event, budget, timeline, vendors, tasks);

    return NextResponse.json({ success: true, data: readiness });
  } catch (error) {
    console.error('Readiness error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate readiness' }, { status: 500 });
  }
}
