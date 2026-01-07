import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkTodos, getWorkTodosByGoalId, createWorkTodo } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workGoalId = searchParams.get('workGoalId');
    
    if (workGoalId) {
      const workTodos = getWorkTodosByGoalId(parseInt(workGoalId));
      return NextResponse.json(workTodos);
    }
    
    const workTodos = getAllWorkTodos();
    return NextResponse.json(workTodos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workTodoId = createWorkTodo(body);
    const newWorkTodo = { id: workTodoId, ...body };
    return NextResponse.json(newWorkTodo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create work todo' },
      { status: 500 }
    );
  }
}
