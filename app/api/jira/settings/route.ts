import { NextRequest, NextResponse } from 'next/server';
import { getJiraSettings, updateJiraSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getJiraSettings();
    
    if (!settings) {
      return NextResponse.json({
        jiraEnabled: false,
        jiraDomain: '',
        jiraEmail: '',
        jiraApiToken: '',
        jiraProjectKey: '',
        jiraComponent: '',
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch JIRA settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    updateJiraSettings({
      jiraEnabled: body.jiraEnabled ?? false,
      jiraDomain: body.jiraDomain,
      jiraEmail: body.jiraEmail,
      jiraApiToken: body.jiraApiToken,
      jiraProjectKey: body.jiraProjectKey,
      jiraComponent: body.jiraComponent,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update JIRA settings' },
      { status: 500 }
    );
  }
}
