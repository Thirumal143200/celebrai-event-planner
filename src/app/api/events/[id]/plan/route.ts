/**
 * AI Plan Generation API
 * POST: Generate an AI-powered event plan
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema } from '@/lib/validation';
import { getEvent, applyPlanNonDestructive } from '@/lib/store';
import { getAIProvider, isAIDemoMode } from '@/lib/ai-provider';
import type { ApiResponse, AIPlanSuggestion } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<AIPlanSuggestion>>> {
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

    const provider = getAIProvider();
    const plan = await provider.generatePlan(event);

    // Apply plan non-destructively: preserves user's custom edits, completed items, and prevents duplicate tasks
    applyPlanNonDestructive(id, plan);

    return NextResponse.json({
      success: true,
      data: plan,
      isDemo: isAIDemoMode(),
      message: isAIDemoMode()
        ? 'Plan generated using demo templates. Set GEMINI_API_KEY for AI-personalized plans.'
        : 'AI-generated plan applied successfully',
    });
  } catch (error) {
    console.error('Error generating plan:', error);

    // Provide transparent error
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate plan',
        message: message.includes('Rate limit')
          ? message
          : 'AI plan generation failed. Try again or use the manual planning tools.',
      },
      { status: 500 }
    );
  }
}
