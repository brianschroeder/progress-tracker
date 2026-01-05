import { NextResponse } from 'next/server';
import { getAllShoppingItems, createShoppingItem } from '@/lib/db';

export async function GET() {
  try {
    const items = getAllShoppingItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching shopping items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shopping items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, quantity, category, isChecked, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Item name is required' },
        { status: 400 }
      );
    }

    // Get max sort order and add 1
    const items = getAllShoppingItems();
    const maxSortOrder = items.length > 0 
      ? Math.max(...items.map((i: any) => i.sortOrder || 0)) 
      : -1;

    const newItem = {
      name,
      quantity: quantity || null,
      category: category || null,
      isChecked: isChecked || false,
      sortOrder: sortOrder !== undefined ? sortOrder : maxSortOrder + 1,
    };

    const id = createShoppingItem(newItem);

    return NextResponse.json({ id, ...newItem }, { status: 201 });
  } catch (error) {
    console.error('Error creating shopping item:', error);
    return NextResponse.json(
      { error: 'Failed to create shopping item' },
      { status: 500 }
    );
  }
}
