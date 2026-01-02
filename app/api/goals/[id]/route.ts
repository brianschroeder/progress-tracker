import { NextRequest, NextResponse } from 'next/server';
import { getGoalById, updateGoal, deleteGoal } from '@/lib/db';
import { Goal } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goal = getGoalById(Number(params.id));
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    return NextResponse.json(goal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const goal: Goal = {
      id: Number(params.id),
      name: body.name,
      description: body.description,
      targetDaysPerWeek: body.targetDaysPerWeek,
      daysOfWeek: body.daysOfWeek || undefined,
      categoryId: body.categoryId,
      color: body.color,
      icon: body.icon,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    };
    
    const success = updateGoal(goal);
    
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    return NextResponse.json(goal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteGoal(Number(params.id));
    
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
