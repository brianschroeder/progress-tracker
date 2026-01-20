import { NextRequest, NextResponse } from 'next/server';
import { getJiraSettings, getWorkTodoById, updateWorkTodo, deleteWorkTodo } from '@/lib/db';
import { JiraClient } from '@/lib/jira';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const workTodo = getWorkTodoById(id);
    
    if (!workTodo) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workTodo);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work todo' },
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
    const updated = updateWorkTodo({ ...body, id });
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }

    const workTodo = getWorkTodoById(id);
    if (workTodo) {
      try {
        const jiraSettings = getJiraSettings();
        if (jiraSettings?.jiraEnabled && (workTodo as any).jiraIssueKey) {
          const jiraClient = new JiraClient({
            domain: jiraSettings.jiraDomain!,
            email: jiraSettings.jiraEmail!,
            apiToken: jiraSettings.jiraApiToken!,
            projectKey: jiraSettings.jiraProjectKey!,
            component: jiraSettings.jiraComponent,
          });

          const issueKey = (workTodo as any).jiraIssueKey as string;
          const issue = await jiraClient.getIssue(issueKey);
          const statusName = issue?.fields?.status?.name?.toLowerCase() || '';
          const isDone = ['done', 'closed', 'complete', 'resolved'].some((name) => statusName.includes(name));
          const isActive = ['in progress', 'progress', 'doing', 'active', 'started'].some((name) => statusName.includes(name));

          if (workTodo.isCompleted) {
            if (!isDone) {
              await jiraClient.closeIssue(issueKey);
            }
          } else if (workTodo.inProgress) {
            if (!isActive) {
              await jiraClient.moveToInProgress(issueKey);
            }
          } else if (isDone) {
            await jiraClient.reopenIssue(issueKey);
          }
        }
      } catch (jiraError) {
        console.error('Failed to update JIRA status for work todo:', jiraError);
      }
    }

    return NextResponse.json(workTodo || { id, ...body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work todo' },
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
    const deleted = deleteWorkTodo(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Work todo not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete work todo' },
      { status: 500 }
    );
  }
}
