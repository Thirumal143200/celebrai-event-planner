/**
 * Tasks API
 */
import { NextRequest, NextResponse } from 'next/server';
import { TaskItemSchema, TaskPutInput } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getTasks, setTasks, updateTask, toggleTask } from '@/lib/store';
import { parseRequestBody, apiSuccess, apiError, validateIdParam } from '@/lib/api-helpers';
import type { ApiResponse, TaskItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TaskItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<TaskItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<TaskItem[]>('Event not found', 404);

    return apiSuccess(getTasks(id));
  } catch (error) {
    console.error('Tasks GET error:', error);
    return apiError<TaskItem[]>('Failed to fetch tasks', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TaskItem[]>>> {
  try {
    const { id } = await context.params;
    const validation = validateIdParam<TaskItem[]>(id);
    if (!validation.valid) return validation.response;
    if (!getEvent(id)) return apiError<TaskItem[]>('Event not found', 404);

    const parseResult = await parseRequestBody<TaskPutInput, TaskItem[]>(request);
    if (!parseResult.success) {
      return parseResult.response;
    }
    const body = parseResult.data;

    // Toggle task completion
    if ('toggleId' in body && body.toggleId) {
      const updated = toggleTask(id, body.toggleId);
      if (!updated) return apiError<TaskItem[]>('Task not found', 404);
      return apiSuccess(updated);
    }

    // Single task update
    if ('taskId' in body && body.taskId && 'updates' in body && body.updates) {
      const updateResult = TaskItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return apiError<TaskItem[]>('Invalid task updates', 400, updateResult.error.message);
      }
      const updated = updateTask(id, body.taskId, updateResult.data);
      if (!updated) return apiError<TaskItem[]>('Task not found', 404);
      return apiSuccess(updated);
    }

    // Bulk update
    if ('items' in body && body.items) {
      const result = z.array(TaskItemSchema).safeParse(body.items);
      if (!result.success) {
        return apiError<TaskItem[]>('Invalid data', 400, result.error.message);
      }
      return apiSuccess(setTasks(id, result.data));
    }

    return apiError<TaskItem[]>('Invalid request', 400);
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return apiError<TaskItem[]>('Failed to update tasks', 500);
  }
}
