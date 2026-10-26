/**
 * Budget API — GET and PUT budget for an event
 */
import { NextRequest, NextResponse } from 'next/server';
import { BudgetCategorySchema } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getBudget, setBudgetCategories, updateBudgetCategory, updateContingencyPercent } from '@/lib/store';
import { parseRequestBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, BudgetBreakdown } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

interface BudgetPutBody {
  contingencyPercent?: number;
  categoryId?: string;
  updates?: Record<string, unknown>;
  categories?: unknown[];
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<BudgetBreakdown>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) {
      return validation.response;
    }

    if (!getEvent(id)) {
      return apiError('Event not found', 404);
    }

    const budget = getBudget(id);
    if (!budget) {
      return apiError('Budget not found', 404);
    }

    return apiSuccess(budget);
  } catch (error) {
    console.error('Budget GET error:', error);
    return apiError('Failed to fetch budget', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<BudgetBreakdown>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam(id);
    if (!validation.valid) {
      return validation.response;
    }

    if (!getEvent(id)) {
      return apiError('Event not found', 404);
    }

    const parseResult = await parseRequestBody<BudgetPutBody>(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<BudgetBreakdown>>;
    }
    const body = parseResult.data;

    // Contingency percent update
    if (typeof body.contingencyPercent === 'number') {
      const cpResult = z.number().min(0).max(50).safeParse(body.contingencyPercent);
      if (!cpResult.success) {
        return apiError('Contingency percent must be between 0 and 50', 400);
      }
      const updated = updateContingencyPercent(id, cpResult.data);
      if (!updated) {
        return apiError('Budget not found', 404);
      }
      return apiSuccess(updated);
    }

    // Single category update
    if (body.categoryId && body.updates) {
      const updateResult = BudgetCategorySchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return apiError('Invalid category updates', 400, updateResult.error.message);
      }
      const updated = updateBudgetCategory(id, body.categoryId, updateResult.data);
      if (!updated) {
        return apiError('Category not found', 404);
      }
      return apiSuccess(updated);
    }

    // Full categories update
    if (body.categories) {
      const categoriesResult = z.array(BudgetCategorySchema).safeParse(body.categories);
      if (!categoriesResult.success) {
        return apiError('Invalid category data', 400, categoriesResult.error.message);
      }

      const updated = setBudgetCategories(id, categoriesResult.data);
      if (!updated) {
        return apiError('Budget not found', 404);
      }
      return apiSuccess(updated);
    }

    return apiError('Invalid request body', 400);
  } catch (error) {
    console.error('Budget PUT error:', error);
    return apiError('Failed to update budget', 500);
  }
}
