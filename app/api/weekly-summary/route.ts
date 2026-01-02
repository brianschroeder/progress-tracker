import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyProgress, getUserSettings } from '@/lib/db';
import { getCurrentWeek, formatDateForDB } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const settings = getUserSettings();
    const weekStartsOn = settings.weekStartsOn;
    
    let week;
    if (dateParam) {
      const date = new Date(dateParam);
      week = getCurrentWeek(weekStartsOn);
    } else {
      week = getCurrentWeek(weekStartsOn);
    }
    
    const startDate = formatDateForDB(week.start);
    const endDate = formatDateForDB(week.end);
    
    const progress = getWeeklyProgress(startDate, endDate);
    
    return NextResponse.json({
      weekStart: startDate,
      weekEnd: endDate,
      progress,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
