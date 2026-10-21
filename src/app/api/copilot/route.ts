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
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Copilot GET error:', error);
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

    // Store assistant message
    const assistantMsg: AICopilotMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      isAIGenerated: true,
    };
    addCopilotMessage(eventId, assistantMsg);

    return NextResponse.json({
      success: true,
      data: assistantMsg,
      isDemo: isAIDemoMode(),
    });
  } catch (error) {
    console.error('Copilot error:', error);
    const rawMessage = error instanceof Error ? error.message : '';
    const safeMessage = rawMessage.includes('Rate limit')
      ? rawMessage
      : 'Copilot encountered an error. Please try again.';
    return NextResponse.json(
      { success: false, error: 'Copilot failed', message: safeMessage },
      { status: 500 }
    );
  }
}

