/**
 * Readiness Score API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEvent, getBudget, getTimeline, getVendors, getTasks } from '@/lib/store';
import { calculateReadiness } from '@/lib/readiness';
import { apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, ReadinessScore } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<ReadinessScore>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) return validation.response;

    const event = getEvent(id);
    if (!event) return apiError('Event not found', 404);

    const budget = getBudget(id);
    const timeline = getTimeline(id);
    const vendors = getVendors(id);
    const tasks = getTasks(id);

    const readiness = calculateReadiness(event, budget, timeline, vendors, tasks);

    return apiSuccess(readiness);
  } catch (error) {
    console.error('Readiness error:', error);
    return apiError('Failed to calculate readiness', 500);
  }
}
