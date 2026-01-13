import { NextRequest, NextResponse } from 'next/server';
import { getCommentsForGoal, getCommentsForTodo, addComment } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    const todoId = searchParams.get('todoId');

    if (goalId) {
      const comments = getCommentsForGoal(parseInt(goalId));
      return NextResponse.json(comments);
    } else if (todoId) {
      const comments = getCommentsForTodo(parseInt(todoId));
      return NextResponse.json(comments);
    } else {
      return NextResponse.json(
        { error: 'Either goalId or todoId is required' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workGoalId, workTodoId, text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    if (!workGoalId && !workTodoId) {
      return NextResponse.json(
        { error: 'Either workGoalId or workTodoId is required' },
        { status: 400 }
      );
    }

    const comment = addComment({
      workGoalId: workGoalId ? parseInt(workGoalId) : undefined,
      workTodoId: workTodoId ? parseInt(workTodoId) : undefined,
      text: text.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}
