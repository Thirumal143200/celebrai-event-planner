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

export function apiError<T = never>(
  error: string,
  status: number = 400,
  message?: string,
  code?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(message ? { message } : {}),
      ...(code ? { code } : {}),
    },
    { status }
  );
}

export function validateIdParam<T = never>(
  id: string
): { valid: true; id: string } | { valid: false; response: NextResponse<ApiResponse<T>> } {
  const result = IdParamSchema.safeParse({ id });
  if (!result.success) {
    return {
      valid: false,
      response: apiError<T>(
        'Invalid event ID format',
        400,
        'Event ID must be a valid RFC4122 UUID',
        'INVALID_ID_FORMAT'
      ),
    };
  }
  return { valid: true, id };
}

export async function parseRequestBody<T = unknown, R = never>(
  request: NextRequest
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiResponse<R>> }
> {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return {
        success: false,
        response: apiError<R>(
          'Payload too large',
          413,
          'Maximum payload size is 1MB',
          'PAYLOAD_TOO_LARGE'
        ),
      };
    }

    const data = (await request.json()) as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: apiError<R>(
        'Malformed request',
        400,
        'Request body must be valid JSON',
        'MALFORMED_JSON'
      ),
    };
  }
}

export async function parseAndValidateBody<T, R = never>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse<ApiResponse<R>> }
> {
  const parsed = await parseRequestBody<unknown, R>(request);
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
      response: apiError<R>(
        'Validation failed',
        400,
        formattedError,
        'VALIDATION_FAILED'
      ),
    };
  }

  return { success: true, data: result.data };
}
