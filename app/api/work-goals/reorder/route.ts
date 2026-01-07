import { NextRequest, NextResponse } from 'next/server';
import { reorderWorkGoals } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { workGoalIds } = await request.json();
    reorderWorkGoals(workGoalIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reorder work goals' },
      { status: 500 }
    );
  }
}
