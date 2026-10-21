/**
 * Shared API helpers for request validation, security, and payload parsing.
 */
import { NextRequest, NextResponse } from 'next/server';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

export async function parseRequestBody<T = any>(
  request: NextRequest
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Payload too large', message: 'Maximum payload size is 1MB' },
          { status: 413 }
        ),
      };
    }

    const data = await request.json();
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Malformed request', message: 'Request body must be valid JSON' },
        { status: 400 }
      ),
    };
  }
}
