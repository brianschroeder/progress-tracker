import { NextRequest, NextResponse } from 'next/server';
import { JiraApiError, JiraClient } from '@/lib/jira';
import {
  getAllWorkGoals,
  getAllWorkTodos,
  updateWorkGoalJiraInfo,
  updateWorkTodoJiraInfo,
  clearWorkGoalJiraInfo,
  clearWorkTodoJiraInfo,
  getJiraSettings,
  getWorkGoalById,
  getCommentsForGoal,
  getCommentsForTodo,
  updateCommentJiraInfo,
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { goalId, dryRun = false } = await request.json();
    
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
    
    const syncResults: any = {
      goalsSynced: 0,
      goalsCreated: 0,
      commentsSynced: 0,
      goalsUpdated: 0,
      todosSynced: 0,
      todosCreated: 0,
      todosUpdated: 0,
      errors: [],
      dryRun,
      actions: dryRun ? [] : undefined,
    };
    
    // Get goals to sync (either specific goal or all)
    const goalsToSync = goalId 
      ? [getWorkGoalById(goalId)]
      : getAllWorkGoals();
    
    const isNotFoundError = (error: unknown): boolean =>
      error instanceof JiraApiError && error.status === 404;

    // Load recent issues for fast exact-title matching (best-effort).
    // Sync still does a strict search fallback before creating anything.
    console.log('Fetching all JIRA issues for duplicate prevention...');
    const allJiraIssues = await jiraClient.getIssuesInProject(200);
    const jiraIssuesByTitle = new Map<string, any>();
    
    for (const issue of allJiraIssues) {
      if (issue && issue.fields && issue.fields.summary) {
        // Store by exact title (case-sensitive)
        jiraIssuesByTitle.set(issue.fields.summary, issue);
        // Also store by lowercase for fuzzy matching
        jiraIssuesByTitle.set(issue.fields.summary.toLowerCase(), issue);
      }
    }
    
    console.log(`Loaded ${allJiraIssues.length} existing JIRA issues into memory`);
    
    for (const goal of goalsToSync as any[]) {
      if (!goal) continue;
      
      try {
        let jiraIssue = null;
        
        // PRIORITY 1: If we have a stored JIRA key in DB, validate it and update
        if (goal.jiraIssueKey) {
          try {
            jiraIssue = await jiraClient.getIssue(goal.jiraIssueKey);
            
            if (dryRun) {
              syncResults.actions.push({
                type: 'UPDATE_GOAL',
                goalId: goal.id,
                title: goal.title,
                jiraKey: goal.jiraIssueKey,
                reason: 'Has stored JIRA key in DB',
              });
              syncResults.goalsUpdated++;
            } else {
              // Update the existing issue
              await jiraClient.updateIssue(goal.jiraIssueKey, {
                summary: goal.title,
                description: goal.description,
                dueDate: goal.targetDate,
                priority: goal.priority,
              });
              
              // Handle completion status
              if (jiraIssue && jiraIssue.fields && jiraIssue.fields.status) {
                const isDone = jiraIssue.fields.status.name.toLowerCase().includes('done');
                if (goal.isCompleted && !isDone) {
                  await jiraClient.closeIssue(goal.jiraIssueKey);
                } else if (!goal.isCompleted && isDone) {
                  await jiraClient.reopenIssue(goal.jiraIssueKey);
                }
              }
              
              syncResults.goalsUpdated++;
            }
          } catch (error: any) {
            // Only clear keys when the issue truly no longer exists.
            // On transient errors (429/401/network), do NOT clear and do NOT create duplicates.
            if (isNotFoundError(error)) {
              if (!dryRun) {
                clearWorkGoalJiraInfo(goal.id);
              }

              syncResults.errors.push(
                `Goal "${goal.title}": Cleared invalid JIRA key ${goal.jiraIssueKey} (404). Will search/create.`
              );

              goal.jiraIssueKey = null;
              jiraIssue = null;
            } else {
              syncResults.errors.push(
                `Goal "${goal.title}": Failed to validate JIRA key ${goal.jiraIssueKey}: ${error?.message || String(error)}`
              );
              continue;
            }
          }
        }
        
        // PRIORITY 2: Check our pre-fetched issues map (NO API calls)
        if (!goal.jiraIssueKey && !jiraIssue) {
          // Try exact match first
          jiraIssue = jiraIssuesByTitle.get(goal.title);
          
          // Try case-insensitive match
          if (!jiraIssue) {
            jiraIssue = jiraIssuesByTitle.get(goal.title.toLowerCase());
          }
          
          // Filter to only Story type
          if (jiraIssue && jiraIssue.fields && jiraIssue.fields.issuetype && jiraIssue.fields.issuetype.name !== 'Story') {
            jiraIssue = null;
          }
          
          if (jiraIssue) {
            // Found existing issue - link it
            if (dryRun) {
              syncResults.actions.push({
                type: 'UPDATE_GOAL',
                goalId: goal.id,
                title: goal.title,
                jiraKey: jiraIssue.key,
                reason: 'Found in pre-fetched JIRA issues',
              });
              syncResults.goalsUpdated++;
            } else {
              // Update it
              await jiraClient.updateIssue(jiraIssue.key, {
                summary: goal.title,
                description: goal.description,
                dueDate: goal.targetDate,
                priority: goal.priority,
              });
              
              // Handle completion status
              if (jiraIssue && jiraIssue.fields && jiraIssue.fields.status) {
                const isDone = jiraIssue.fields.status.name.toLowerCase().includes('done');
                if (goal.isCompleted && !isDone) {
                  await jiraClient.closeIssue(jiraIssue.key);
                } else if (!goal.isCompleted && isDone) {
                  await jiraClient.reopenIssue(jiraIssue.key);
                }
              }
              
              // Store the JIRA key in DB
              updateWorkGoalJiraInfo(
                goal.id,
                jiraIssue.key,
                `https://${jiraSettings.jiraDomain}/browse/${jiraIssue.key}`
              );
              
              syncResults.goalsUpdated++;
            }
          } else {
            // Map didn't find it (or map was incomplete). Do a strict search fallback before creating.
            const searched = await jiraClient.findIssueByTitle(goal.title, 'Story', true);
            if (searched) {
              jiraIssue = searched;

              if (dryRun) {
                syncResults.actions.push({
                  type: 'UPDATE_GOAL',
                  goalId: goal.id,
                  title: goal.title,
                  jiraKey: jiraIssue.key,
                  reason: 'Found via strict JIRA search fallback',
                });
                syncResults.goalsUpdated++;
              } else {
                await jiraClient.updateIssue(jiraIssue.key, {
                  summary: goal.title,
                  description: goal.description,
                  dueDate: goal.targetDate,
                  priority: goal.priority,
                });

                const isDone = jiraIssue && jiraIssue.fields && jiraIssue.fields.status 
                  ? jiraIssue.fields.status.name.toLowerCase().includes('done')
                  : false;
                if (goal.isCompleted && !isDone) {
                  await jiraClient.closeIssue(jiraIssue.key);
                } else if (!goal.isCompleted && isDone) {
                  await jiraClient.reopenIssue(jiraIssue.key);
                }

                updateWorkGoalJiraInfo(
                  goal.id,
                  jiraIssue.key,
                  `https://${jiraSettings.jiraDomain}/browse/${jiraIssue.key}`
                );

                syncResults.goalsUpdated++;

                if (jiraIssue && jiraIssue.fields && jiraIssue.fields.summary) {
                  jiraIssuesByTitle.set(jiraIssue.fields.summary, jiraIssue);
                  jiraIssuesByTitle.set(jiraIssue.fields.summary.toLowerCase(), jiraIssue);
                }
              }
            } else {
              // No match found anywhere - safe to create
            if (dryRun) {
              syncResults.actions.push({
                type: 'CREATE_GOAL',
                goalId: goal.id,
                title: goal.title,
                issueType: 'Story',
                reason: 'Not found in JIRA',
              });
              syncResults.goalsCreated++;
            } else {
              // Create new issue
              jiraIssue = await jiraClient.createIssue({
                summary: goal.title,
                description: goal.description,
                issueType: 'Story',
                dueDate: goal.targetDate,
                priority: goal.priority,
              });
              
              syncResults.goalsCreated++;

              // If the goal is already completed, close it immediately
              if (goal.isCompleted) {
                await jiraClient.closeIssue(jiraIssue.key);
              }
              
              // Store the JIRA key in DB
              updateWorkGoalJiraInfo(
                goal.id,
                jiraIssue.key,
                `https://${jiraSettings.jiraDomain}/browse/${jiraIssue.key}`
              );
              
              // Add to our map for future lookups in this sync session
              if (jiraIssue && jiraIssue.fields && jiraIssue.fields.summary) {
                jiraIssuesByTitle.set(jiraIssue.fields.summary, jiraIssue);
                jiraIssuesByTitle.set(jiraIssue.fields.summary.toLowerCase(), jiraIssue);
              }
            }
            }
          }
        }
        
        syncResults.goalsSynced++;
        
        // Skip todo and comment sync in dry-run if we don't have a JIRA issue yet
        if (dryRun && !jiraIssue) {
          continue;
        }
        
        // Skip if we couldn't get/create a JIRA issue
        if (!jiraIssue) {
          continue;
        }
        
        // Sync todos (subtasks)
        const todos = getAllWorkTodos().filter((t: any) => t.workGoalId === goal.id);
        
        for (const todo of todos as any[]) {
          try {
            let jiraSubtask = null;
            
            // PRIORITY 1: If we have a stored JIRA key in DB, validate it and update
            if (todo.jiraIssueKey) {
              try {
                jiraSubtask = await jiraClient.getIssue(todo.jiraIssueKey);
                
                if (dryRun) {
                  syncResults.actions.push({
                    type: 'UPDATE_TODO',
                    todoId: todo.id,
                    title: todo.title,
                    jiraKey: todo.jiraIssueKey,
                    parentKey: jiraIssue.key,
                    reason: 'Has stored JIRA key in DB',
                  });
                  syncResults.todosUpdated++;
                } else {
                  // Update existing subtask
                  await jiraClient.updateIssue(todo.jiraIssueKey, {
                    summary: todo.title,
                    description: todo.description,
                  });
                  
                  // Handle completion status
                  if (jiraSubtask && jiraSubtask.fields && jiraSubtask.fields.status) {
                    const isDone = jiraSubtask.fields.status.name.toLowerCase().includes('done');
                    if (todo.isCompleted && !isDone) {
                      await jiraClient.closeIssue(todo.jiraIssueKey);
                    } else if (!todo.isCompleted && isDone) {
                      await jiraClient.reopenIssue(todo.jiraIssueKey);
                    }
                  }
                  
                  syncResults.todosUpdated++;
                }
              } catch (error: any) {
                if (isNotFoundError(error)) {
                  // Stored JIRA key truly no longer exists
                  if (!dryRun) {
                    clearWorkTodoJiraInfo(todo.id);
                  }
                  
                  syncResults.errors.push(
                    `Todo "${todo.title}": Cleared invalid JIRA key ${todo.jiraIssueKey} (404). Will search/create.`
                  );
                  
                  todo.jiraIssueKey = null;
                  jiraSubtask = null;
                } else {
                  syncResults.errors.push(
                    `Todo "${todo.title}": Failed to validate JIRA key ${todo.jiraIssueKey}: ${error?.message || String(error)}`
                  );
                  continue;
                }
              }
            }
            
            // PRIORITY 2: Search within parent issue's subtasks
            if (!todo.jiraIssueKey && !jiraSubtask) {
              const existingSubtask = await jiraClient.findSubtaskByTitle(jiraIssue.key, todo.title);
              
              if (existingSubtask) {
                // Found existing subtask
                if (dryRun) {
                  syncResults.actions.push({
                    type: 'UPDATE_TODO',
                    todoId: todo.id,
                    title: todo.title,
                    jiraKey: existingSubtask.key,
                    parentKey: jiraIssue.key,
                    reason: 'Found in parent subtasks',
                  });
                  syncResults.todosUpdated++;
                } else {
                  // Update it
                  await jiraClient.updateIssue(existingSubtask.key, {
                    summary: todo.title,
                    description: todo.description || todo.title,
                  });
                  
                  // Handle completion status
                  if (existingSubtask && existingSubtask.fields && existingSubtask.fields.status) {
                    const isDone = existingSubtask.fields.status.name.toLowerCase().includes('done');
                    if (todo.isCompleted && !isDone) {
                      await jiraClient.closeIssue(existingSubtask.key);
                    } else if (!todo.isCompleted && isDone) {
                      await jiraClient.reopenIssue(existingSubtask.key);
                    }
                  }
                  
                  // Store JIRA key in DB
                  updateWorkTodoJiraInfo(
                    todo.id,
                    existingSubtask.key,
                    `https://${jiraSettings.jiraDomain}/browse/${existingSubtask.key}`
                  );
                  
                  syncResults.todosUpdated++;
                }
              } else {
                // No existing subtask found - create new one
                if (dryRun) {
                  syncResults.actions.push({
                    type: 'CREATE_TODO',
                    todoId: todo.id,
                    title: todo.title,
                    parentKey: jiraIssue.key,
                  });
                  syncResults.todosCreated++;
                } else {
                  jiraSubtask = await jiraClient.createSubtask(
                    jiraIssue.key,
                    todo.title,
                    todo.description || todo.title
                  );
                  
                  // Store JIRA key in DB
                  updateWorkTodoJiraInfo(
                    todo.id,
                    jiraSubtask.key,
                    `https://${jiraSettings.jiraDomain}/browse/${jiraSubtask.key}`
                  );
                  
                  // Close if already completed
                  if (todo.isCompleted) {
                    await jiraClient.closeIssue(jiraSubtask.key);
                  }
                  
                  syncResults.todosCreated++;
                }
              }
            }
            
            syncResults.todosSynced++;
          } catch (error: any) {
            syncResults.errors.push(`Failed to sync todo "${todo.title}": ${error.message}`);
          }
        }

        // Sync comments for this goal
        if (!dryRun) {
          try {
            const localComments = getCommentsForGoal(goal.id);
            
            for (const comment of localComments) {
              if (!comment.jiraCommentId) {
                // New comment - add to JIRA
                const jiraComment = await jiraClient.addComment(jiraIssue.key, comment.text);
                updateCommentJiraInfo(comment.id, jiraComment.id);
                syncResults.commentsSynced++;
              }
            }

            // Sync comments for all todos
            for (const todo of todos as any[]) {
              if (todo.jiraIssueKey) {
                const todoComments = getCommentsForTodo(todo.id);
                
                for (const comment of todoComments) {
                  if (!comment.jiraCommentId) {
                    // New comment - add to JIRA
                    const jiraComment = await jiraClient.addComment(todo.jiraIssueKey, comment.text);
                    updateCommentJiraInfo(comment.id, jiraComment.id);
                    syncResults.commentsSynced++;
                  }
                }
              }
            }
          } catch (error: any) {
            syncResults.errors.push(`Failed to sync comments for goal "${goal.title}": ${error.message}`);
          }
        }
      } catch (error: any) {
        syncResults.errors.push(`Failed to sync goal "${goal.title}": ${error.message}`);
      }
    }
    
    return NextResponse.json(syncResults);
  } catch (error: any) {
    console.error('JIRA sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync with JIRA' },
      { status: 500 }
    );
  }
}
