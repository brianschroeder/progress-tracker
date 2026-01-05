import { NextResponse } from 'next/server';
import { reorderShoppingItems } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { itemIds } = await request.json();

    if (!Array.isArray(itemIds)) {
      return NextResponse.json(
        { error: 'itemIds must be an array' },
        { status: 400 }
      );
    }

    const success = reorderShoppingItems(itemIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering shopping items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder shopping items' },
      { status: 500 }
    );
  }
}
