import { NextRequest, NextResponse } from 'next/server';
import { getAllYearGoals, createYearGoal, YearGoal } from '@/lib/db';

export async function GET() {
  try {
    const goals = getAllYearGoals();
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const goal: Omit<YearGoal, 'id' | 'createdAt'> = {
      title: body.title,
      description: body.description,
      category: body.category,
      targetDate: body.targetDate,
      isCompleted: body.isCompleted || false,
      progress: body.progress || 0,
      color: body.color,
      sortOrder: body.sortOrder || 0,
      trackingMode: body.trackingMode || 'percentage',
      currentCount: body.currentCount || 0,
      targetCount: body.targetCount || 0,
    };

    const id = createYearGoal(goal);
    return NextResponse.json({ id, ...goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
