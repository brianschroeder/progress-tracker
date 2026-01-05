import { NextRequest, NextResponse } from 'next/server';
import { getYearGoalById, updateYearGoal, deleteYearGoal, YearGoal } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goal = getYearGoalById(Number(params.id));
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
    
    const goal: YearGoal = {
      id: Number(params.id),
      title: body.title,
      description: body.description,
      category: body.category,
      targetDate: body.targetDate,
      isCompleted: body.isCompleted,
      progress: body.progress,
      color: body.color,
      sortOrder: body.sortOrder,
      trackingMode: body.trackingMode || 'percentage',
      currentCount: body.currentCount || 0,
      targetCount: body.targetCount || 0,
    };

    const success = updateYearGoal(goal);
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
    const success = deleteYearGoal(Number(params.id));
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
