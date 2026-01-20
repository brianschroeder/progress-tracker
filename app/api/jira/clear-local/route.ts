import { NextResponse } from 'next/server';
import { clearAllJiraLinks } from '@/lib/db';

export async function POST() {
  try {
    const result = clearAllJiraLinks();
    return NextResponse.json({
      success: true,
      cleared: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear local JIRA links' },
      { status: 500 }
    );
  }
}
