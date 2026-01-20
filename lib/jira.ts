/**
 * JIRA Cloud API Client
 * Handles all interactions with JIRA REST API v3
 */

export interface JiraConfig {
  domain: string;      // e.g., "yourcompany.atlassian.net"
  email: string;       // JIRA user email
  apiToken: string;    // JIRA API token
  projectKey: string;  // e.g., "PROJ"
  component?: string;  // e.g., "Team Component"
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      name: string;
      id: string;
    };
    issuetype: {
      name: string;
      id: string;
    };
    duedate?: string;
    subtasks?: JiraSubtask[];
  };
}

export interface JiraSubtask {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
  };
}

export interface CreateIssuePayload {
  summary: string;
  description?: string;
  issueType: string;     // "Story" or "Task"
  dueDate?: string;      // YYYY-MM-DD format
  priority?: string;     // "Low", "Medium", "High"
}

export interface UpdateIssuePayload {
  summary?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
}

export class JiraApiError extends Error {
  status: number;
  body: string;
  endpoint: string;

  constructor(status: number, body: string, endpoint: string) {
    super(`JIRA API Error (${status}): ${body}`);
    this.name = 'JiraApiError';
    this.status = status;
    this.body = body;
    this.endpoint = endpoint;
  }
}

export class JiraClient {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;
  private currentUserAccountId: string | null = null;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `https://${config.domain}/rest/api/3`;
    
    // Create basic auth header
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.authHeader = `Basic ${auth}`;
  }

  /**
   * Make authenticated request to JIRA API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new JiraApiError(response.status, errorText, endpoint);
    }

    // Some JIRA endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Get the current user's account ID
   */
  private async getCurrentUserAccountId(): Promise<string> {
    if (this.currentUserAccountId) {
      return this.currentUserAccountId;
    }

    try {
      const user = await this.request<{ accountId: string }>('/myself');
      this.currentUserAccountId = user.accountId;
      return user.accountId;
    } catch (error) {
      console.error('Failed to get current user account ID:', error);
      throw error;
    }
  }

  /**
   * Search for issues by summary (title) - returns all matching issues
   */
  async searchIssuesByTitle(title: string, issueType?: string, strict: boolean = false): Promise<JiraIssue[]> {
    const doSearch = async () => {
      // Use text search with ~ for fuzzy matching
      const escapedTitle = title.replace(/"/g, '\\"');
      let jql = `project = ${this.config.projectKey} AND summary ~ "${escapedTitle}"`;
      if (issueType) {
        jql += ` AND type = ${issueType}`;
      }
      
      const result = await this.request<{ issues: JiraIssue[] }>(
        `/search/jql`,
        {
          method: 'POST',
          body: JSON.stringify({
            jql,
            maxResults: 50,
            fields: ['summary', 'description', 'status', 'issuetype', 'duedate', 'subtasks'],
          }),
        }
      );
      
      return result.issues || [];
    };

    if (strict) {
      return doSearch();
    }

    try {
      return await doSearch();
    } catch (error) {
      console.error('Error searching issues by title:', error);
      return [];
    }
  }

  /**
   * Search for an issue by summary (title) - exact match first, then fuzzy
   */
  async findIssueByTitle(title: string, issueType: string = 'Story', strict: boolean = false): Promise<JiraIssue | null> {
    const doFind = async () => {
      // First try: exact match with proper escaping
      const escapedTitle = title.replace(/"/g, '\\"').replace(/'/g, "\\'");
      let jql = `project = ${this.config.projectKey} AND summary ~ "\\"${escapedTitle}\\"" AND type = ${issueType}`;
      let result = await this.request<{ issues: JiraIssue[] }>(
        `/search/jql`,
        {
          method: 'POST',
          body: JSON.stringify({
            jql,
            maxResults: 10,
            fields: ['summary', 'description', 'status', 'issuetype', 'duedate', 'subtasks'],
          }),
        }
      );
      
      // Check for exact case-sensitive match in results
      let exactMatch = result.issues.find(issue => issue.fields.summary === title);
      if (exactMatch) {
        return exactMatch;
      }
      
      // Second try: case-insensitive exact match
      const titleLower = title.toLowerCase();
      exactMatch = result.issues.find(issue => issue.fields.summary.toLowerCase() === titleLower);
      if (exactMatch) {
        return exactMatch;
      }
      
      // Third try: broader fuzzy search
      jql = `project = ${this.config.projectKey} AND summary ~ "${escapedTitle}" AND type = ${issueType}`;
      result = await this.request<{ issues: JiraIssue[] }>(
        `/search/jql`,
        {
          method: 'POST',
          body: JSON.stringify({
            jql,
            maxResults: 10,
            fields: ['summary', 'description', 'status', 'issuetype', 'duedate', 'subtasks'],
          }),
        }
      );
      
      // Check again for exact match in fuzzy results
      exactMatch = result.issues.find(issue => issue.fields.summary === title);
      if (exactMatch) {
        return exactMatch;
      }
      
      // Case-insensitive match in fuzzy results
      exactMatch = result.issues.find(issue => issue.fields.summary.toLowerCase() === titleLower);
      if (exactMatch) {
        return exactMatch;
      }
      
      return null;
    };

    if (strict) {
      return doFind();
    }

    try {
      return await doFind();
    } catch (error) {
      console.error('Error finding issue by title:', error);
      return null;
    }
  }

  /**
   * Find a subtask by title within a parent issue
   */
  async findSubtaskByTitle(parentKey: string, title: string): Promise<JiraIssue | null> {
    try {
      const parentIssue = await this.getIssue(parentKey);
      const subtask = parentIssue.fields.subtasks?.find(
        (st: any) => st.fields.summary === title || st.fields.summary.toLowerCase() === title.toLowerCase()
      );
      
      if (subtask) {
        return await this.getIssue(subtask.key);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding subtask by title:', error);
      return null;
    }
  }

  /**
   * Get all issues in the project (for checking duplicates)
   */
  async getIssuesInProject(maxResults: number = 100): Promise<JiraIssue[]> {
    try {
      const jql = `project = ${this.config.projectKey} ORDER BY created DESC`;
      const result = await this.request<{ issues: JiraIssue[] }>(
        `/search/jql`,
        {
          method: 'POST',
          body: JSON.stringify({
            jql,
            maxResults,
            fields: ['summary', 'description', 'status', 'issuetype', 'duedate', 'subtasks'],
          }),
        }
      );
      
      return result.issues || [];
    } catch (error) {
      console.error('Error getting issues in project:', error);
      return [];
    }
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/issue/${issueKey}?fields=summary,description,status,issuetype,duedate,subtasks`);
  }

  /**
   * Create a new issue (Story or Task)
   */
  async createIssue(payload: CreateIssuePayload): Promise<JiraIssue> {
    const priorityMap: { [key: string]: string } = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    };

    // Get current user's account ID
    const accountId = await this.getCurrentUserAccountId();

    const body: any = {
      fields: {
        project: {
          key: this.config.projectKey,
        },
        summary: payload.summary,
        issuetype: {
          name: payload.issueType,
        },
        assignee: {
          accountId: accountId,
        },
      },
    };

    // Add component if configured and creating a Story
    if (this.config.component && payload.issueType === 'Story') {
      body.fields.components = [
        {
          name: this.config.component,
        },
      ];
    }

    // Always add description (required by some Jira configurations)
    // Use provided description or fallback to summary
    body.fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: (payload.description && payload.description.trim()) ? payload.description : payload.summary,
            },
          ],
        },
      ],
    };

    if (payload.dueDate) {
      body.fields.duedate = payload.dueDate;
    }

    if (payload.priority) {
      body.fields.priority = {
        name: priorityMap[payload.priority.toLowerCase()] || 'Medium',
      };
    }

    const result = await this.request<{ id: string; key: string; self: string }>(
      '/issue',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    // Fetch the created issue with full details
    return this.getIssue(result.key);
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueKey: string, payload: UpdateIssuePayload): Promise<void> {
    const fields: any = {};

    if (payload.summary) {
      fields.summary = payload.summary;
    }

    if (payload.description !== undefined) {
      // Only update description if it has a non-empty value
      // Setting to null when description is required will cause errors
      if (payload.description && payload.description.trim()) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: payload.description,
                },
              ],
            },
          ],
        };
      }
      // If description is empty/null and was explicitly passed, skip updating it
      // to avoid errors in Jira configurations where description is required
    }

    if (payload.dueDate !== undefined) {
      fields.duedate = payload.dueDate || null;
    }

    if (payload.priority) {
      const priorityMap: { [key: string]: string } = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      };
      fields.priority = {
        name: priorityMap[payload.priority.toLowerCase()] || 'Medium',
      };
    }

    await this.request(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  /**
   * Get all transitions available for an issue
   */
  async getTransitions(issueKey: string): Promise<Array<{ id: string; name: string }>> {
    const result = await this.request<{ transitions: Array<{ id: string; name: string }> }>(
      `/issue/${issueKey}/transitions`
    );
    return result.transitions;
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
    const transitions = await this.getTransitions(issueKey);
    const transition = transitions.find(t => 
      t.name.toLowerCase().includes(transitionName.toLowerCase())
    );

    if (!transition) {
      console.warn(`Transition "${transitionName}" not found for issue ${issueKey}`);
      return;
    }

    await this.request(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: {
          id: transition.id,
        },
      }),
    });
  }

  /**
   * Search for issues by JQL
   */
  async searchIssuesByJql(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    const result = await this.request<{ issues: JiraIssue[] }>(
      `/search/jql`,
      {
        method: 'POST',
        body: JSON.stringify({
          jql,
          maxResults,
          fields: ['summary', 'description', 'status', 'issuetype', 'duedate', 'subtasks'],
        }),
      }
    );

    return result.issues || [];
  }

  /**
   * Move an issue into an "in progress" style status
   */
  async moveToInProgress(issueKey: string): Promise<void> {
    const transitions = await this.getTransitions(issueKey);
    const candidates = ['in progress', 'progress', 'doing', 'active', 'start'];
    const transition = transitions.find(t =>
      candidates.some((name) => t.name.toLowerCase().includes(name))
    );

    if (!transition) {
      console.warn(`Could not find in-progress transition for issue ${issueKey}`);
      return;
    }

    await this.request(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: {
          id: transition.id,
        },
      }),
    });
  }

  /**
   * Close/Complete an issue
   */
  async closeIssue(issueKey: string): Promise<void> {
    // Try common transition names for completion
    const completionTransitions = ['done', 'close', 'closed', 'complete', 'completed', 'resolve', 'resolved', 'finish', 'finished'];
    
    for (const transitionName of completionTransitions) {
      try {
        await this.transitionIssue(issueKey, transitionName);
        return;
      } catch (error) {
        continue;
      }
    }
    
    console.warn(`Could not find completion transition for issue ${issueKey}`);
  }

  /**
   * Reopen an issue
   */
  async reopenIssue(issueKey: string): Promise<void> {
    const reopenTransitions = ['reopen', 'to do', 'backlog', 'open'];
    
    for (const transitionName of reopenTransitions) {
      try {
        await this.transitionIssue(issueKey, transitionName);
        return;
      } catch (error) {
        continue;
      }
    }
    
    console.warn(`Could not find reopen transition for issue ${issueKey}`);
  }

  /**
   * Close/Complete an issue as duplicate when possible
   */
  async closeIssueAsDuplicate(issueKey: string): Promise<boolean> {
    const transitions = await this.getTransitions(issueKey);
    const transition = transitions.find(t =>
      t.name.toLowerCase().includes('duplicate')
    );

    if (!transition) {
      return false;
    }

    await this.request(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: {
          id: transition.id,
        },
      }),
    });

    return true;
  }

  /**
   * Get available issue types for the project
   */
  async getProjectIssueTypes(): Promise<Array<{ id: string; name: string; subtask: boolean }>> {
    try {
      const result = await this.request<{ issueTypes: Array<{ id: string; name: string; subtask: boolean }> }>(
        `/project/${this.config.projectKey}`
      );
      return result.issueTypes || [];
    } catch (error) {
      console.error('Error getting project issue types:', error);
      return [];
    }
  }

  /**
   * Unassign an issue
   */
  async unassignIssue(issueKey: string): Promise<void> {
    await this.request(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify({
        fields: {
          assignee: null,
        },
      }),
    });
  }

  /**
   * Create a subtask linked to a parent issue
   */
  async createSubtask(parentKey: string, summary: string, description?: string): Promise<JiraIssue> {
    // Try to get the subtask issue type
    const issueTypes = await this.getProjectIssueTypes();
    const subtaskType = issueTypes.find(t => t.subtask === true);
    
    if (!subtaskType) {
      throw new Error('Subtask issue type not found in project. Please ensure subtasks are enabled.');
    }

    // Get current user's account ID
    const accountId = await this.getCurrentUserAccountId();

    const body: any = {
      fields: {
        project: {
          key: this.config.projectKey,
        },
        parent: {
          key: parentKey,
        },
        summary,
        issuetype: {
          id: subtaskType.id,
        },
        assignee: {
          accountId: accountId,
        },
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: (description && description.trim()) ? description : summary,
                },
              ],
            },
          ],
        },
      },
    };

    const result = await this.request<{ id: string; key: string; self: string }>(
      '/issue',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return this.getIssue(result.key);
  }

  /**
   * Delete an issue (including subtasks)
   */
  async deleteIssue(issueKey: string): Promise<void> {
    await this.request(`/issue/${issueKey}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test the connection and credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/myself');
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get comments for an issue
   */
  async getComments(issueKey: string): Promise<Array<{ id: string; body: any; created: string; updated: string }>> {
    try {
      const result = await this.request<{ comments: Array<{ id: string; body: any; created: string; updated: string }> }>(
        `/issue/${issueKey}/comment`
      );
      return result.comments || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, text: string): Promise<{ id: string; body: any; created: string }> {
    const body = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: text,
              },
            ],
          },
        ],
      },
    };

    return this.request<{ id: string; body: any; created: string }>(
      `/issue/${issueKey}/comment`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Update a comment
   */
  async updateComment(issueKey: string, commentId: string, text: string): Promise<void> {
    const body = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: text,
              },
            ],
          },
        ],
      },
    };

    await this.request(
      `/issue/${issueKey}/comment/${commentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Delete a comment
   */
  async deleteComment(issueKey: string, commentId: string): Promise<void> {
    await this.request(
      `/issue/${issueKey}/comment/${commentId}`,
      {
        method: 'DELETE',
      }
    );
  }
}
