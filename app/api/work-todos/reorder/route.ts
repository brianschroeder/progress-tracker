import { NextRequest, NextResponse } from 'next/server';
import { reorderWorkTodos } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { workTodoIds } = await request.json();
    reorderWorkTodos(workTodoIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reorder work todos' },
      { status: 500 }
    );
  }
}
