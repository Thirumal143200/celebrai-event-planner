/**
 * AI Plan Generation API
 * POST: Generate an AI-powered event plan
 */
import { NextRequest, NextResponse } from 'next/server';
import { getEvent, applyPlanNonDestructive } from '@/lib/store';
import { getAIProvider, isAIDemoMode } from '@/lib/ai-provider';
import { apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, AIPlanSuggestion } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<AIPlanSuggestion>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) return validation.response;

    const event = getEvent(id);
    if (!event) {
      return apiError('Event not found', 404);
    }

    const provider = getAIProvider();
    const plan = await provider.generatePlan(event);

    // Apply plan non-destructively: preserves user's custom edits, completed items, and prevents duplicate tasks
    applyPlanNonDestructive(id, plan);

    return apiSuccess(plan, 200, {
      isDemo: isAIDemoMode(),
      message: isAIDemoMode()
        ? 'Plan generated using demo templates. Set GEMINI_API_KEY for AI-personalized plans.'
        : 'AI-generated plan applied successfully',
    });
  } catch (error) {
    console.error('Error generating plan:', error);

    // Provide transparent error
    const message = error instanceof Error ? error.message : 'Unknown error';
    return apiError(
      'Failed to generate plan',
      500,
      message.includes('Rate limit')
        ? message
        : 'AI plan generation failed. Try again or use the manual planning tools.'
    );
  }
}
