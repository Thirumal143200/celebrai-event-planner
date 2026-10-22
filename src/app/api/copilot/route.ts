/**
 * AI Copilot Chat API
 * POST: Send a message to the event copilot
 */
import { NextRequest, NextResponse } from 'next/server';
import { CopilotMessageSchema, IdParamSchema } from '@/lib/validation';
import { getEvent, getCopilotHistory, addCopilotMessage } from '@/lib/store';
import { getAIProvider, isAIDemoMode } from '@/lib/ai-provider';
import { parseRequestBody } from '@/lib/api-helpers';
import { randomUUID } from 'crypto';
import type { ApiResponse, AICopilotMessage } from '@/lib/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AICopilotMessage[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId query parameter is required' },
        { status: 400 }
      );
    }
    const validation = IdParamSchema.safeParse({ id: eventId });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    const history = getCopilotHistory(eventId);
    const provider = getAIProvider();
    return NextResponse.json({
      success: true,
      data: history,
      isDemo: isAIDemoMode(),
      providerName: provider.name,
      configuredModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    } as any);
  } catch (error) {
    console.error('[CelebrAI Copilot GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve copilot history' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AICopilotMessage>>> {
  try {
    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<AICopilotMessage>>;
    }
    const body = parseResult.data;

    const validation = CopilotMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: validation.error.message },
        { status: 400 }
      );
    }

    const { message, eventId } = validation.data;
    const event = getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Store user message
    const userMsg: AICopilotMessage = {
      id: randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      isAIGenerated: false,
    };
    addCopilotMessage(eventId, userMsg);

    // Get AI response
    const provider = getAIProvider();
    const history = getCopilotHistory(eventId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await provider.chat(event, message, history);
    const meta = (provider as any).lastCallMetadata || { isFallback: false };

    // Store assistant message
    const assistantMsg: AICopilotMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      isAIGenerated: !meta.isFallback,
    };
    addCopilotMessage(eventId, assistantMsg);

    return NextResponse.json({
      success: true,
      data: assistantMsg,
      isDemo: isAIDemoMode(),
      isFallback: meta.isFallback || false,
      modelUsed: meta.modelUsed || (process.env.GEMINI_MODEL || 'gemini-3-flash-preview'),
      fallbackNotice: meta.notice,
    } as any);
  } catch (error) {
    const rawError = error instanceof Error ? error.message : String(error);
    const safeError = rawError.replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
    console.error('[CelebrAI Copilot POST] Safe error trace:', safeError);

    let safeMessage = 'Copilot encountered an error. Please try again.';
    if (rawError.includes('Rate limit')) {
      safeMessage = 'Rate limit reached. Please wait a few seconds before asking another question.';
    } else if (rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE')) {
      safeMessage = 'Google Gemini is currently experiencing high demand. Please try again in a few moments.';
    } else if (rawError.includes('timed out')) {
      safeMessage = 'The request took longer than expected. Please try again with a shorter prompt.';
    }

    return NextResponse.json(
      { success: false, error: safeMessage, message: safeMessage },
      { status: 500 }
    );
  }
}

