/**
 * Budget API — GET and PUT budget for an event
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema, BudgetCategorySchema } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getBudget, setBudgetCategories, updateBudgetCategory, updateContingencyPercent } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, BudgetBreakdown } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<BudgetBreakdown>>> {
  try {
    const { id } = await context.params;
    const validation = IdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    if (!getEvent(id)) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const budget = getBudget(id);
    return NextResponse.json({ success: true, data: budget });
  } catch (error) {
    console.error('Budget GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<BudgetBreakdown>>> {
  try {
    const { id } = await context.params;
    const validation = IdParamSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    if (!getEvent(id)) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<BudgetBreakdown>>;
    }
    const body = parseResult.data;

    // Contingency percent update
    if (typeof body.contingencyPercent === 'number') {
      const cpResult = z.number().min(0).max(50).safeParse(body.contingencyPercent);
      if (!cpResult.success) {
        return NextResponse.json(
          { success: false, error: 'Contingency percent must be between 0 and 50' },
          { status: 400 }
        );
      }
      const updated = updateContingencyPercent(id, cpResult.data);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Budget not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated });
    }

    // Single category update
    if (body.categoryId && body.updates) {
      const updateResult = BudgetCategorySchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid category updates', message: updateResult.error.message },
          { status: 400 }
        );
      }
      const updated = updateBudgetCategory(id, body.categoryId, updateResult.data);
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }

    // Full categories update
    if (body.categories) {
      const categoriesResult = z.array(BudgetCategorySchema).safeParse(body.categories);
      if (!categoriesResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid category data', message: categoriesResult.error.message },
          { status: 400 }
        );
      }

      const updated = setBudgetCategories(id, categoriesResult.data);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Budget PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}
