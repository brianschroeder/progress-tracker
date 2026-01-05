import { NextResponse } from 'next/server';
import { clearCheckedShoppingItems } from '@/lib/db';

export async function POST() {
  try {
    const success = clearCheckedShoppingItems();

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to clear checked items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing checked items:', error);
    return NextResponse.json(
      { error: 'Failed to clear checked items' },
      { status: 500 }
    );
  }
}
