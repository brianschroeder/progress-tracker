import { NextRequest, NextResponse } from 'next/server';
import { reorderGoals } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalIds } = body;
    
    if (!Array.isArray(goalIds)) {
      return NextResponse.json({ error: 'goalIds must be an array' }, { status: 400 });
    }
    
    const success = reorderGoals(goalIds);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to reorder goals' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
