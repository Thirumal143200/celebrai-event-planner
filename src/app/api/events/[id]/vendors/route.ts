/**
 * Vendors API
 */
import { NextRequest, NextResponse } from 'next/server';
import { VendorItemSchema, VendorPutInput } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getVendors, setVendors, updateVendor } from '@/lib/store';
import { parseRequestBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, VendorItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<VendorItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<VendorItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<VendorItem[]>('Event not found', 404);

    return apiSuccess(getVendors(id));
  } catch (error) {
    console.error('Vendors GET error:', error);
    return apiError<VendorItem[]>('Failed to fetch vendors', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<VendorItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<VendorItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<VendorItem[]>('Event not found', 404);

    const parseResult = await parseRequestBody<VendorPutInput, VendorItem[]>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    if ('vendorId' in body && body.vendorId && 'updates' in body && body.updates) {
      const updateResult = VendorItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return apiError<VendorItem[]>('Invalid vendor updates', 400, updateResult.error.message);
      }
      const updated = updateVendor(id, body.vendorId, updateResult.data);
      if (!updated) return apiError<VendorItem[]>('Vendor not found', 404);
      return apiSuccess(updated);
    }

    if ('items' in body && body.items) {
      const result = z.array(VendorItemSchema).safeParse(body.items);
      if (!result.success) {
        return apiError<VendorItem[]>('Invalid data', 400, result.error.message);
      }
      return apiSuccess(setVendors(id, result.data));
    }

    return apiError<VendorItem[]>('Invalid request', 400);
  } catch (error) {
    console.error('Vendors PUT error:', error);
    return apiError<VendorItem[]>('Failed to update vendors', 500);
  }
}
