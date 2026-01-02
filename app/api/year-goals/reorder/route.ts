import { NextRequest, NextResponse } from 'next/server';
import { reorderYearGoals } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { goalIds } = await request.json();
    
    if (!Array.isArray(goalIds)) {
      return NextResponse.json(
        { error: 'goalIds must be an array' },
        { status: 400 }
      );
    }

    reorderYearGoals(goalIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reorder year goals' },
      { status: 500 }
    );
  }
}
