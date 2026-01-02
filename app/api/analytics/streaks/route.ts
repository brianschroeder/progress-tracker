import { NextResponse } from 'next/server';
import { getCurrentStreaks } from '@/lib/db';

export async function GET() {
  try {
    const streaks = getCurrentStreaks();
    return NextResponse.json(streaks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
