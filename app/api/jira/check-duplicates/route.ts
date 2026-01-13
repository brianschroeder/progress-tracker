import { NextRequest, NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';
import { getAllWorkGoals, getAllWorkTodos, getJiraSettings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { goalId } = await request.json();
    
    // Get JIRA settings
    const jiraSettings = getJiraSettings();
    
    if (!jiraSettings || !jiraSettings.jiraEnabled) {
      return NextResponse.json(
        { error: 'JIRA integration is not enabled' },
        { status: 400 }
      );
    }
    
    if (!jiraSettings.jiraDomain || !jiraSettings.jiraEmail || !jiraSettings.jiraApiToken || !jiraSettings.jiraProjectKey) {
      return NextResponse.json(
        { error: 'JIRA settings are incomplete' },
        { status: 400 }
      );
    }
    
    // Create JIRA client
    const jiraClient = new JiraClient({
      domain: jiraSettings.jiraDomain,
      email: jiraSettings.jiraEmail,
      apiToken: jiraSettings.jiraApiToken,
      projectKey: jiraSettings.jiraProjectKey,
      component: jiraSettings.jiraComponent,
    });
    
    const results: any = {
      goalsChecked: 0,
      potentialDuplicates: [],
      safeToSync: [],
      errors: [],
    };
    
    // Get goals to check (either specific goal or all)
    const goalsToCheck = goalId 
      ? [getAllWorkGoals().find((g: any) => g.id === goalId)]
      : getAllWorkGoals();
    
    for (const goal of goalsToCheck as any[]) {
      if (!goal) continue;
      
      try {
        const goalInfo: any = {
          goalId: goal.id,
          title: goal.title,
          hasJiraKey: !!goal.jiraIssueKey,
          jiraIssueKey: goal.jiraIssueKey,
          status: '',
        };
        
        // Check if goal already has JIRA issue
        if (goal.jiraIssueKey) {
          try {
            const existingIssue = await jiraClient.getIssue(goal.jiraIssueKey);
            goalInfo.status = 'HAS_VALID_JIRA_KEY';
            goalInfo.jiraTitle = existingIssue.fields.summary;
            goalInfo.jiraStatus = existingIssue.fields.status.name;
            results.safeToSync.push(goalInfo);
          } catch (error) {
            goalInfo.status = 'JIRA_KEY_INVALID';
            goalInfo.error = 'Stored JIRA key not found in JIRA';
            results.potentialDuplicates.push(goalInfo);
          }
        } else {
          // Search for potential duplicates by title
          const matchingIssues = await jiraClient.searchIssuesByTitle(goal.title, 'Story');
          
          if (matchingIssues.length === 0) {
            goalInfo.status = 'NO_MATCH_FOUND';
            goalInfo.willCreate = true;
            results.safeToSync.push(goalInfo);
          } else if (matchingIssues.length === 1) {
            const match = matchingIssues[0];
            if (match.fields.summary === goal.title) {
              goalInfo.status = 'EXACT_MATCH_FOUND';
              goalInfo.matchingJiraKey = match.key;
              goalInfo.jiraTitle = match.fields.summary;
              goalInfo.jiraStatus = match.fields.status.name;
              goalInfo.willUpdate = true;
              results.safeToSync.push(goalInfo);
            } else {
              goalInfo.status = 'FUZZY_MATCH_FOUND';
              goalInfo.matchingJiraKey = match.key;
              goalInfo.jiraTitle = match.fields.summary;
              goalInfo.warning = 'Title is similar but not exact';
              results.potentialDuplicates.push(goalInfo);
            }
          } else {
            goalInfo.status = 'MULTIPLE_MATCHES_FOUND';
            goalInfo.matches = matchingIssues.map(issue => ({
              key: issue.key,
              title: issue.fields.summary,
              status: issue.fields.status.name,
            }));
            goalInfo.warning = 'Multiple potential duplicates found - manual review needed';
            results.potentialDuplicates.push(goalInfo);
          }
        }
        
        // Check todos for this goal
        const todos = getAllWorkTodos().filter((t: any) => t.workGoalId === goal.id);
        goalInfo.todosCount = todos.length;
        goalInfo.todos = [];
        
        for (const todo of todos as any[]) {
          const todoInfo: any = {
            todoId: todo.id,
            title: todo.title,
            hasJiraKey: !!todo.jiraIssueKey,
            jiraIssueKey: todo.jiraIssueKey,
          };
          
          if (todo.jiraIssueKey) {
            try {
              await jiraClient.getIssue(todo.jiraIssueKey);
              todoInfo.status = 'VALID';
            } catch (error) {
              todoInfo.status = 'INVALID_KEY';
              todoInfo.warning = 'Stored JIRA key not found';
            }
          } else if (goal.jiraIssueKey || goalInfo.matchingJiraKey) {
            // Check if subtask exists
            const parentKey = goal.jiraIssueKey || goalInfo.matchingJiraKey;
            try {
              const existingSubtask = await jiraClient.findSubtaskByTitle(parentKey, todo.title);
              if (existingSubtask) {
                todoInfo.status = 'DUPLICATE_FOUND';
                todoInfo.matchingJiraKey = existingSubtask.key;
                todoInfo.warning = 'Subtask already exists in JIRA';
              } else {
                todoInfo.status = 'WILL_CREATE';
              }
            } catch (error) {
              todoInfo.status = 'ERROR_CHECKING';
            }
          }
          
          goalInfo.todos.push(todoInfo);
        }
        
        results.goalsChecked++;
      } catch (error: any) {
        results.errors.push(`Failed to check goal "${goal.title}": ${error.message}`);
      }
    }
    
    return NextResponse.json({
      ...results,
      summary: {
        totalChecked: results.goalsChecked,
        safeToSync: results.safeToSync.length,
        needsReview: results.potentialDuplicates.length,
        hasErrors: results.errors.length > 0,
      },
    });
  } catch (error: any) {
    console.error('JIRA duplicate check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
