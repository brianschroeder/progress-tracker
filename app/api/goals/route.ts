import { NextRequest, NextResponse } from 'next/server';
import { getAllGoals, getActiveGoals, createGoal } from '@/lib/db';
import { Goal } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const goals = activeOnly ? getActiveGoals() : getAllGoals();
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const goal: Omit<Goal, 'id' | 'createdAt'> = {
      name: body.name,
      description: body.description,
      targetDaysPerWeek: body.targetDaysPerWeek,
      daysOfWeek: body.daysOfWeek || undefined,
      categoryId: body.categoryId,
      color: body.color || '#3B82F6',
      icon: body.icon || 'target',
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: body.sortOrder || 0,
    };
    
    const goalId = createGoal(goal);
    return NextResponse.json({ id: goalId, ...goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
