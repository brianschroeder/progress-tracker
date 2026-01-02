import { NextRequest, NextResponse } from 'next/server';
import { getDecadeGoalById, updateDecadeGoal, deleteDecadeGoal, DecadeGoal } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goal = getDecadeGoalById(Number(params.id));
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
    
    const goal: DecadeGoal = {
      id: Number(params.id),
      title: body.title,
      description: body.description,
      category: body.category,
      milestones: body.milestones || [],
      isCompleted: body.isCompleted,
      color: body.color,
    };

    const success = updateDecadeGoal(goal);
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
    const success = deleteDecadeGoal(Number(params.id));
    if (!success) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
