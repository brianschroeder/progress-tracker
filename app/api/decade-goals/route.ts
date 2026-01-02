import { NextRequest, NextResponse } from 'next/server';
import { getAllDecadeGoals, createDecadeGoal, DecadeGoal } from '@/lib/db';

export async function GET() {
  try {
    const goals = getAllDecadeGoals();
    return NextResponse.json(goals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const goal: Omit<DecadeGoal, 'id' | 'createdAt'> = {
      title: body.title,
      description: body.description,
      category: body.category,
      milestones: body.milestones || [],
      isCompleted: body.isCompleted || false,
      color: body.color,
    };

    const id = createDecadeGoal(goal);
    return NextResponse.json({ id, ...goal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
