/**
 * AI Copilot Chat API
 * POST: Send a message to the event copilot
 */
import { NextRequest, NextResponse } from 'next/server';
import { CopilotMessageSchema } from '@/lib/validation';
import { getEvent, getCopilotHistory, addCopilotMessage } from '@/lib/store';
import { getAIProvider, isAIDemoMode, GeminiProvider } from '@/lib/ai-provider';
import { parseAndValidateBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import { randomUUID } from 'crypto';
import type { ApiResponse, AICopilotMessage } from '@/lib/types';

interface CopilotMetadataResponse {
  isFallback?: boolean;
  modelUsed?: string;
  fallbackNotice?: string;
  providerName?: string;
  configuredModel?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AICopilotMessage[]> & CopilotMetadataResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return apiError('eventId query parameter is required', 400);
    }
    const validation = validateIdParam(eventId);
    if (!validation.valid) {
      return validation.response;
    }
    const history = getCopilotHistory(eventId);
    const provider = getAIProvider();

    return NextResponse.json({
      success: true,
      data: history,
      isDemo: isAIDemoMode(),
      providerName: provider.name,
      configuredModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
    });
  } catch (error) {
    console.error('[CelebrAI Copilot GET] error:', error);
    return apiError('Failed to retrieve copilot history', 500);
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AICopilotMessage> & CopilotMetadataResponse>> {
  try {
    const validation = await parseAndValidateBody(request, CopilotMessageSchema);
    if (!validation.success) {
      return validation.response as NextResponse<ApiResponse<AICopilotMessage>>;
    }

    const { message, eventId } = validation.data;
    const event = getEvent(eventId);
    if (!event) {
      return apiError('Event not found', 404);
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
    const lastMetadata = provider instanceof GeminiProvider ? provider.lastCallMetadata : undefined;
    const isFallback = lastMetadata ? lastMetadata.isFallback : isAIDemoMode();

    // Store assistant message
    const assistantMsg: AICopilotMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      isAIGenerated: !isFallback,
    };
    addCopilotMessage(eventId, assistantMsg);

    return NextResponse.json({
      success: true,
      data: assistantMsg,
      isDemo: isAIDemoMode(),
      isFallback,
      modelUsed: lastMetadata?.modelUsed || (process.env.GEMINI_MODEL || 'gemini-3-flash-preview'),
      fallbackNotice: lastMetadata?.notice,
    });
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

    return apiError(safeMessage, 500, safeMessage);
  }
}
