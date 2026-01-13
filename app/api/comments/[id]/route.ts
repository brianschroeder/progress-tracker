import { NextRequest, NextResponse } from 'next/server';
import { updateComment, deleteComment, getCommentById, getWorkGoalById, getWorkTodoById, getJiraSettings } from '@/lib/db';
import { JiraClient } from '@/lib/jira';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { text } = body;
    const commentId = parseInt(params.id);

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    const success = updateComment(commentId, text.trim());
    
    if (!success) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = parseInt(params.id);
    
    // Get comment details before deletion
    const comment = getCommentById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // If comment was synced to JIRA, delete it from JIRA too
    if (comment.jiraCommentId) {
      try {
        const jiraSettings = getJiraSettings();
        
        if (jiraSettings && jiraSettings.jiraEnabled) {
          const jiraClient = new JiraClient({
            domain: jiraSettings.jiraDomain!,
            email: jiraSettings.jiraEmail!,
            apiToken: jiraSettings.jiraApiToken!,
            projectKey: jiraSettings.jiraProjectKey!,
            component: jiraSettings.jiraComponent,
          });

          // Get the JIRA issue key from the associated goal or todo
          let jiraIssueKey: string | null = null;
          
          if (comment.workGoalId) {
            const goal = getWorkGoalById(comment.workGoalId);
            jiraIssueKey = (goal as any)?.jiraIssueKey;
          } else if (comment.workTodoId) {
            const todo = getWorkTodoById(comment.workTodoId);
            jiraIssueKey = (todo as any)?.jiraIssueKey;
          }

          if (jiraIssueKey) {
            await jiraClient.deleteComment(jiraIssueKey, comment.jiraCommentId);
          }
        }
      } catch (jiraError: any) {
        console.error('Failed to delete comment from JIRA:', jiraError);
        // Continue with local deletion even if JIRA deletion fails
      }
    }

    // Delete from local database
    const success = deleteComment(commentId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete comment from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
