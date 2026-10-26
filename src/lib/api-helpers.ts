/**
 * Shared API helpers for request validation, security, and payload parsing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiResponse } from './types';
import { IdParamSchema } from './validation';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

export function apiSuccess<T>(
  data: T,
  status: number = 200,
  extra?: { isDemo?: boolean; message?: string }
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(extra?.message ? { message: extra.message } : {}),
      ...(extra?.isDemo !== undefined ? { isDemo: extra.isDemo } : {}),
    },
    { status }
  );
}

export function apiError(
  error: string,
  status: number = 400,
  message?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

export function validateIdParam(id: string): { valid: true; id: string } | { valid: false; response: NextResponse<ApiResponse<never>> } {
  const result = IdParamSchema.safeParse({ id });
  if (!result.success) {
    return {
      valid: false,
      response: apiError('Invalid event ID format', 400, 'Event ID must be a valid RFC4122 UUID'),
    };
  }
  return { valid: true, id };
}

export async function parseRequestBody<T = any>(
  request: NextRequest
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiResponse<never>> }> {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return {
        success: false,
        response: apiError('Payload too large', 413, 'Maximum payload size is 1MB'),
      };
    }

    const data = (await request.json()) as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: apiError('Malformed request', 400, 'Request body must be valid JSON'),
    };
  }
}

export async function parseAndValidateBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse<ApiResponse<never>> }> {
  const parsed = await parseRequestBody<unknown>(request);
  if (!parsed.success) {
    return parsed;
  }

  const result = schema.safeParse(parsed.data);
  if (!result.success) {
    const formattedError = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    return {
      success: false,
      response: apiError('Validation failed', 400, formattedError),
    };
  }

  return { success: true, data: result.data };
}
