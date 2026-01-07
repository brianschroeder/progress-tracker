import { NextRequest, NextResponse } from 'next/server';
import { getWorkTodoById, updateWorkTodo, deleteWorkTodo } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const workTodo = getWorkTodoById(id);
    
    if (!workTodo) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workTodo);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work todo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updated = updateWorkTodo({ ...body, id });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ id, ...body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const deleted = deleteWorkTodo(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete work todo' },
      { status: 500 }
    );
  }
}
