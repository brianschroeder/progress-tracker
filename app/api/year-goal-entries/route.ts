import { NextRequest, NextResponse } from 'next/server';
import { createYearGoalEntry, getYearGoalEntries } from '@/lib/db';
import { YearGoalEntry } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');

    if (!goalId) {
      return NextResponse.json({ error: 'goalId is required' }, { status: 400 });
    }

    const entries = getYearGoalEntries(Number(goalId));
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.yearGoalId || !body.entryDate) {
      return NextResponse.json({ error: 'yearGoalId and entryDate are required' }, { status: 400 });
    }

    const entry: Omit<YearGoalEntry, 'id' | 'createdAt'> = {
      yearGoalId: Number(body.yearGoalId),
      entryDate: body.entryDate,
      delta: Number(body.delta ?? 1),
    };

    const entryId = createYearGoalEntry(entry);
    return NextResponse.json({ id: entryId, ...entry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
