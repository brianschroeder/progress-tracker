import { NextRequest, NextResponse } from 'next/server';
import { JiraClient } from '@/lib/jira';
import { getJiraSettings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get settings from database
    const dbSettings = getJiraSettings();
    
    // Use provided credentials or fall back to saved settings
    const domain = body.domain || dbSettings?.jiraDomain;
    const email = body.email || dbSettings?.jiraEmail;
    const apiToken = body.apiToken || dbSettings?.jiraApiToken;
    const projectKey = body.projectKey || dbSettings?.jiraProjectKey;
    const component = body.component || dbSettings?.jiraComponent;
    
    // Validate we have all required fields
    if (!domain || !email || !apiToken || !projectKey) {
      return NextResponse.json(
        { success: false, message: 'JIRA configuration is incomplete. Please provide domain, email, API token, and project key.' },
        { status: 400 }
      );
    }
    
    const jiraClient = new JiraClient({
      domain,
      email,
      apiToken,
      projectKey,
      component,
    });
    
    // Handle different test actions
    const action = body.action || 'testConnection';
    
    switch (action) {
      case 'searchByTitle': {
        if (!body.title) {
          return NextResponse.json(
            { success: false, message: 'Title is required for search' },
            { status: 400 }
          );
        }
        
        const issueType = body.issueType || 'Story';
        const searchResults = await jiraClient.searchIssuesByTitle(body.title, issueType, true);
        const exactMatch = await jiraClient.findIssueByTitle(body.title, issueType, true);
        
        return NextResponse.json({
          success: true,
          action: 'searchByTitle',
          searchQuery: body.title,
          issueType,
          searchResults: {
            count: searchResults.length,
            issues: searchResults.map(issue => ({
              key: issue.key,
              summary: issue.fields.summary,
              status: issue.fields.status?.name,
              issuetype: issue.fields.issuetype?.name,
            })),
          },
          exactMatch: exactMatch ? {
            key: exactMatch.key,
            summary: exactMatch.fields.summary,
            status: exactMatch.fields.status?.name,
            issuetype: exactMatch.fields.issuetype?.name,
          } : null,
        });
      }
      
      case 'getIssue': {
        if (!body.issueKey) {
          return NextResponse.json(
            { success: false, message: 'Issue key is required' },
            { status: 400 }
          );
        }
        
        const issue = await jiraClient.getIssue(body.issueKey);
        
        return NextResponse.json({
          success: true,
          action: 'getIssue',
          issue: {
            key: issue.key,
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status?.name,
            issuetype: issue.fields.issuetype?.name,
            duedate: issue.fields.duedate,
            subtasksCount: issue.fields.subtasks?.length || 0,
          },
        });
      }
      
      case 'testConnection':
      default: {
        const result = await jiraClient.testConnection();
        return NextResponse.json(result);
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
