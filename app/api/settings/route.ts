import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings, updateUserSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getUserSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const success = updateUserSettings(body);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
    
    const settings = getUserSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
