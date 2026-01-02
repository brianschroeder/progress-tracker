import { NextRequest, NextResponse } from 'next/server';
import { getCompletionsForDate, getCompletionsForGoal, createCompletion } from '@/lib/db';
import { Completion } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const goalId = searchParams.get('goalId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (date) {
      const completions = getCompletionsForDate(date);
      return NextResponse.json(completions);
    }
    
    if (goalId && startDate && endDate) {
      const completions = getCompletionsForGoal(Number(goalId), startDate, endDate);
      return NextResponse.json(completions);
    }
    
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const completion: Omit<Completion, 'id' | 'createdAt'> = {
      goalId: body.goalId,
      completionDate: body.completionDate,
      notes: body.notes,
    };
    
    const completionId = createCompletion(completion);
    return NextResponse.json({ id: completionId, ...completion }, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('already completed')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
