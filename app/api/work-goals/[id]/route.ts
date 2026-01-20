import { NextRequest, NextResponse } from 'next/server';
import { getJiraSettings, getWorkGoalById, updateWorkGoal, deleteWorkGoal } from '@/lib/db';
import { JiraClient } from '@/lib/jira';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const workGoal = getWorkGoalById(id);
    
    if (!workGoal) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workGoal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work goal' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updated = updateWorkGoal({ ...body, id });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }

    const workGoal = getWorkGoalById(id);
    if (workGoal) {
      try {
        const jiraSettings = getJiraSettings();
        if (jiraSettings?.jiraEnabled && (workGoal as any).jiraIssueKey) {
          const jiraClient = new JiraClient({
            domain: jiraSettings.jiraDomain!,
            email: jiraSettings.jiraEmail!,
            apiToken: jiraSettings.jiraApiToken!,
            projectKey: jiraSettings.jiraProjectKey!,
            component: jiraSettings.jiraComponent,
          });

          const issueKey = (workGoal as any).jiraIssueKey as string;
          const issue = await jiraClient.getIssue(issueKey);
          const statusName = issue?.fields?.status?.name?.toLowerCase() || '';
          const isDone = ['done', 'closed', 'complete', 'resolved'].some((name) => statusName.includes(name));
          const isActive = ['in progress', 'progress', 'doing', 'active', 'started'].some((name) => statusName.includes(name));

          if (workGoal.isCompleted) {
            if (!isDone) {
              await jiraClient.closeIssue(issueKey);
            }
          } else if (workGoal.inProgress) {
            if (!isActive) {
              await jiraClient.moveToInProgress(issueKey);
            }
          } else if (isDone) {
            await jiraClient.reopenIssue(issueKey);
          }
        }
      } catch (jiraError) {
        console.error('Failed to update JIRA status for work goal:', jiraError);
      }
    }

    return NextResponse.json(workGoal || { id, ...body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work goal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const deleted = deleteWorkGoal(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Work goal not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete work goal' },
      { status: 500 }
    );
  }
}
