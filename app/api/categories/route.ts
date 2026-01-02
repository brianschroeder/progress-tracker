import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, createCategory } from '@/lib/db';
import { Category } from '@/types';

export async function GET() {
  try {
    const categories = getAllCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const category: Omit<Category, 'id' | 'createdAt'> = {
      name: body.name,
      color: body.color || '#3B82F6',
      icon: body.icon || 'folder',
      sortOrder: body.sortOrder || 0,
    };
    
    const categoryId = createCategory(category);
    return NextResponse.json({ id: categoryId, ...category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
