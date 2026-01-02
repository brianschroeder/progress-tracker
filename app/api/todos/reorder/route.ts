import { NextRequest, NextResponse } from 'next/server';
import { reorderTodos } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { todoIds } = await request.json();
    
    if (!Array.isArray(todoIds)) {
      return NextResponse.json(
        { error: 'todoIds must be an array' },
        { status: 400 }
      );
    }

    reorderTodos(todoIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reorder todos' },
      { status: 500 }
    );
  }
}
