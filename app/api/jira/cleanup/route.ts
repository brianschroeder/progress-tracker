import { NextRequest, NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';
import { getJiraSettings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { jql, maxResults = 50, dryRun = true, fallbackToClose = true } = await request.json();

    if (!jql || typeof jql !== 'string') {
      return NextResponse.json({ error: 'JQL is required' }, { status: 400 });
    }

    const jiraSettings = getJiraSettings();
    if (!jiraSettings || !jiraSettings.jiraEnabled) {
      return NextResponse.json({ error: 'JIRA integration is not enabled' }, { status: 400 });
    }

    if (!jiraSettings.jiraDomain || !jiraSettings.jiraEmail || !jiraSettings.jiraApiToken || !jiraSettings.jiraProjectKey) {
      return NextResponse.json({ error: 'JIRA settings are incomplete' }, { status: 400 });
    }

    const jiraClient = new JiraClient({
      domain: jiraSettings.jiraDomain,
      email: jiraSettings.jiraEmail,
      apiToken: jiraSettings.jiraApiToken,
      projectKey: jiraSettings.jiraProjectKey,
      component: jiraSettings.jiraComponent,
    });

    const issues = await jiraClient.searchIssuesByJql(jql, maxResults);

    const results = {
      dryRun,
      jql,
      maxResults,
      totalFound: issues.length,
      processed: 0,
      unassigned: 0,
      closedAsDuplicate: 0,
      closedFallback: 0,
      errors: [] as string[],
      actions: dryRun ? [] as any[] : undefined,
    };

    const isDoneStatus = (name?: string | null) =>
      ['done', 'closed', 'complete', 'resolved'].some((token) => (name || '').toLowerCase().includes(token));

    for (const issue of issues) {
      results.processed += 1;

      if (dryRun) {
        results.actions?.push({
          key: issue.key,
          summary: issue.fields.summary,
          action: 'UNASSIGN_AND_CLOSE_DUPLICATE',
        });
        continue;
      }

      try {
        await jiraClient.unassignIssue(issue.key);
        results.unassigned += 1;
      } catch (error: any) {
        results.errors.push(`Failed to unassign ${issue.key}: ${error.message || String(error)}`);
      }

      try {
        const closedDuplicate = await jiraClient.closeIssueAsDuplicate(issue.key);
        if (closedDuplicate) {
          results.closedAsDuplicate += 1;
          if (fallbackToClose) {
            const updated = await jiraClient.getIssue(issue.key);
            if (!isDoneStatus(updated?.fields?.status?.name)) {
              await jiraClient.closeIssue(issue.key);
              results.closedFallback += 1;
            }
          }
        } else if (fallbackToClose) {
          await jiraClient.closeIssue(issue.key);
          results.closedFallback += 1;
        }
      } catch (error: any) {
        results.errors.push(`Failed to close ${issue.key}: ${error.message || String(error)}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('JIRA cleanup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run cleanup' },
      { status: 500 }
    );
  }
}
