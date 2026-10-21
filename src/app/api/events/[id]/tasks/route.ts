/**
 * Tasks API
 */
import { NextRequest, NextResponse } from 'next/server';
import { IdParamSchema, TaskItemSchema } from '@/lib/validation';
import { z } from 'zod';
import { getEvent, getTasks, setTasks, updateTask, toggleTask } from '@/lib/store';
import { parseRequestBody } from '@/lib/api-helpers';
import type { ApiResponse, TaskItem } from '@/lib/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TaskItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: getTasks(id) });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<TaskItem[]>>> {
  try {
    const { id } = await context.params;
    const v = IdParamSchema.safeParse({ id });
    if (!v.success) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    if (!getEvent(id)) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const parseResult = await parseRequestBody(request);
    if (!parseResult.success) {
      return parseResult.response as NextResponse<ApiResponse<TaskItem[]>>;
    }
    const body = parseResult.data;

    // Toggle task completion
    if (body.toggleId) {
      const updated = toggleTask(id, body.toggleId);
      if (!updated) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Single task update
    if (body.taskId && body.updates) {
      const updateResult = TaskItemSchema.partial().safeParse(body.updates);
      if (!updateResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid task updates', message: updateResult.error.message },
          { status: 400 }
        );
      }
      const updated = updateTask(id, body.taskId, updateResult.data);
      if (!updated) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Bulk update
    if (body.items) {
      const result = z.array(TaskItemSchema).safeParse(body.items);
      if (!result.success) {
        return NextResponse.json({ success: false, error: 'Invalid data', message: result.error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: setTasks(id, result.data) });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Tasks PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update tasks' }, { status: 500 });
  }
}
