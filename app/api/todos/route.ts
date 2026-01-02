import { NextRequest, NextResponse } from 'next/server';
import { getAllTodos, createTodo } from '@/lib/db';

export async function GET() {
  try {
    const todos = getAllTodos();
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const todoId = createTodo(body);
    const newTodo = { id: todoId, ...body };
    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
