/**
 * Vendors API
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema, VendorItemSchema } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getVendors, setVendors, updateVendor } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, VendorItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<VendorItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: getVendors(id) });
  } catch (error) {
    console.error('Vendors GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<VendorItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<VendorItem[]>>;
    }
    const body = parseResult.data;

    if (body.vendorId && body.updates) {
      const updateResult = VendorItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid vendor updates', message: updateResult.error.message },
          { status: 400 }
        );
      }
      const updated = updateVendor(id, body.vendorId, updateResult.data);
      if (!updated) return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    if (body.items) {
      const result = z.array(VendorItemSchema).safeParse(body.items);
      if (!result.success) {
        return NextResponse.json({ success: false, error: 'Invalid data', message: result.error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: setVendors(id, result.data) });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Vendors PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vendors' }, { status: 500 });
  }
}
