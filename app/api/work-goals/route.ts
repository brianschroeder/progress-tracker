import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkGoals, createWorkGoal } from '@/lib/db';

export async function GET() {
  try {
    const workGoals = getAllWorkGoals();
    return NextResponse.json(workGoals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workGoalId = createWorkGoal(body);
    const newWorkGoal = { id: workGoalId, ...body };
    return NextResponse.json(newWorkGoal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create work goal' },
      { status: 500 }
    );
  }
}
