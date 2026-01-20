'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function JiraTestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (endpoint: string, body: any = {}, label: string) => {
    setLoading(label);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || data.message || 'Unknown error'}`);
      } else {
        setResults({
          endpoint,
          status: response.status,
          data,
          timestamp: new Date().toLocaleString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">JIRA API Test Console</h1>
        <p className="text-gray-600 mt-2">
          Development mode only - Test JIRA endpoints without creating duplicates
        </p>
      </div>

      {/* Test Connection */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">1. Test Connection</h2>
        <p className="text-sm text-gray-600 mb-4">
          Verify JIRA credentials and connection without syncing any data.
        </p>
        <Button
          onClick={() => callApi('/api/jira/test', {}, 'test')}
          disabled={loading !== null}
          Test JIRA endpoints safely
        >
          {loading === 'test' ? 'Testing...' : 'Test Connection'}
        </Button>
      </Card>

      {/* Search for Existing Issue */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">2. Search for Existing Issue</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test if the search query correctly finds existing issues in JIRA by title.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              const title = prompt('Enter issue title to search for:');
              if (title) {
                callApi('/api/jira/test', { action: 'searchByTitle', title }, 'search-title');
              }
            }}
            disabled={loading !== null}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading === 'search-title' ? 'Searching...' : 'Search by Title'}
          </Button>
          <Button
            onClick={() => {
              const issueKey = prompt('Enter JIRA issue key (e.g., PROJ-123):');
              if (issueKey) {
                callApi('/api/jira/test', { action: 'getIssue', issueKey }, 'get-issue');
              }
            }}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === 'get-issue' ? 'Fetching...' : 'Get by Key'}
          </Button>
        </div>
      </Card>

      {/* Check for Duplicates */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">3. Check for Duplicates</h2>
        <p className="text-sm text-gray-600 mb-4">
          Scan all goals and todos for potential duplicates in JIRA. This is completely safe and makes no changes.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => callApi('/api/jira/check-duplicates', {}, 'check-all')}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading === 'check-all' ? 'Checking...' : 'Check All Goals'}
          </Button>
          <Button
            onClick={() => {
              const goalId = prompt('Enter goal ID to check:');
              if (goalId) {
                callApi('/api/jira/check-duplicates', { goalId }, 'check-one');
              }
            }}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === 'check-one' ? 'Checking...' : 'Check Specific Goal'}
          </Button>
        </div>
      </Card>

      {/* Dry Run Sync */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">4. Dry Run Sync</h2>
        <p className="text-sm text-gray-600 mb-4">
          Preview what would be created or updated without making any actual changes to JIRA or the database.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => callApi('/api/jira/sync', { dryRun: true }, 'dry-run-all')}
            disabled={loading !== null}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {loading === 'dry-run-all' ? 'Running...' : 'Dry Run All Goals'}
          </Button>
          <Button
            onClick={() => callApi('/api/jira/sync', { dryRun: true, forceCreate: true }, 'dry-run-force')}
            disabled={loading !== null}
            className="bg-yellow-700 hover:bg-yellow-800"
          >
            {loading === 'dry-run-force' ? 'Running...' : 'Dry Run Force Create'}
          </Button>
          <Button
            onClick={() => {
              const goalId = prompt('Enter goal ID for dry run:');
              if (goalId) {
                callApi('/api/jira/sync', { goalId, dryRun: true }, 'dry-run-one');
              }
            }}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === 'dry-run-one' ? 'Running...' : 'Dry Run Specific Goal'}
          </Button>
        </div>
      </Card>

      {/* Actual Sync */}
      <Card className="p-6 mb-6 border-2 border-red-200">
        <h2 className="text-xl font-bold mb-4 text-red-700">5. Actual Sync (Caution!)</h2>
        <p className="text-sm text-gray-600 mb-4">
          <strong>⚠️ This will make actual changes to JIRA and your database.</strong> Only use after reviewing dry run results.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => {
              if (confirm('Are you sure? This will sync ALL goals to JIRA and make real changes.')) {
                callApi('/api/jira/sync', {}, 'sync-all');
              }
            }}
            disabled={loading !== null}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading === 'sync-all' ? 'Syncing...' : 'Sync All Goals'}
          </Button>
          <Button
            onClick={() => {
              if (confirm('Are you sure? This will CREATE new issues even if duplicates exist.')) {
                callApi('/api/jira/sync', { forceCreate: true }, 'sync-force');
              }
            }}
            disabled={loading !== null}
            className="bg-red-700 hover:bg-red-800"
          >
            {loading === 'sync-force' ? 'Syncing...' : 'Force Create All Goals'}
          </Button>
          <Button
            onClick={() => {
              const goalId = prompt('Enter goal ID to sync:');
              if (goalId && confirm(`Sync goal ${goalId} to JIRA?`)) {
                callApi('/api/jira/sync', { goalId }, 'sync-one');
              }
            }}
            disabled={loading !== null}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            {loading === 'sync-one' ? 'Syncing...' : 'Sync Specific Goal'}
          </Button>
        </div>
      </Card>

      {/* Loading Indicator */}
      {loading && (
        <Card className="p-6 mb-6 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="font-medium">Processing: {loading}...</span>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-700 mb-2">Error</h3>
          <pre className="text-sm text-red-900 whitespace-pre-wrap">{error}</pre>
        </Card>
      )}

      {/* Results Display */}
      {results && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">Response</h3>
              <p className="text-sm text-gray-600">
                {results.endpoint} - Status {results.status} - {results.timestamp}
              </p>
            </div>
            <Button
              onClick={() => setResults(null)}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>

          {/* Summary for specific response types */}
          {results.data.summary && (
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(results.data.summary).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600">{key}: </span>
                    <span className="font-bold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {results.data.action === 'searchByTitle' && (
            <div className="mb-4 p-4 bg-purple-50 rounded">
              <h4 className="font-bold mb-2">Search Results</h4>
              <div className="mb-3 text-sm">
                <div className="font-semibold">Query: &quot;{results.data.searchQuery}&quot;</div>
                <div className="text-gray-600">Issue Type: {results.data.issueType}</div>
                <div className="text-gray-600">Total Results: {results.data.searchResults.count}</div>
              </div>
              
              {results.data.exactMatch && (
                <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded">
                  <div className="font-bold text-green-800 mb-1">✓ Exact Match Found</div>
                  <div className="text-sm">
                    <div><strong>{results.data.exactMatch.key}</strong>: {results.data.exactMatch.summary}</div>
                    <div className="text-gray-600">
                      {results.data.exactMatch.issuetype} • {results.data.exactMatch.status}
                    </div>
                  </div>
                </div>
              )}
              
              {results.data.searchResults.count > 0 && (
                <div>
                  <div className="font-semibold text-sm mb-2">All Matches:</div>
                  <div className="space-y-2">
                    {results.data.searchResults.issues.map((issue: any, idx: number) => (
                      <div key={idx} className="text-sm p-2 bg-white rounded border">
                        <div><strong>{issue.key}</strong>: {issue.summary}</div>
                        <div className="text-xs text-gray-600">
                          {issue.issuetype} • {issue.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.data.searchResults.count === 0 && !results.data.exactMatch && (
                <div className="text-sm text-gray-600 italic">No issues found matching this title</div>
              )}
            </div>
          )}

          {/* Get issue results */}
          {results.data.action === 'getIssue' && results.data.issue && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <h4 className="font-bold mb-2">Issue Details</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Key:</strong> {results.data.issue.key}</div>
                <div><strong>Summary:</strong> {results.data.issue.summary}</div>
                <div><strong>Type:</strong> {results.data.issue.issuetype}</div>
                <div><strong>Status:</strong> {results.data.issue.status}</div>
                {results.data.issue.duedate && (
                  <div><strong>Due Date:</strong> {results.data.issue.duedate}</div>
                )}
                <div><strong>Subtasks:</strong> {results.data.issue.subtasksCount}</div>
                {results.data.issue.description && (
                  <div>
                    <strong>Description:</strong>
                    <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto">
                      {JSON.stringify(results.data.issue.description, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dry run actions */}
          {results.data.dryRun && results.data.actions && (
            <div className="mb-4 p-4 bg-yellow-50 rounded">
              <h4 className="font-bold mb-2">Planned Actions ({results.data.actions.length})</h4>
              {results.data.actions.length === 0 ? (
                <p className="text-sm text-gray-600">No actions needed - everything is in sync!</p>
              ) : (
                <div className="space-y-2">
                  {results.data.actions.map((action: any, idx: number) => (
                    <div key={idx} className="text-sm p-2 bg-white rounded border">
                      <span className={`font-bold ${
                        action.type.includes('CREATE') ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {action.type}
                      </span>
                      {' - '}
                      <span>{action.title}</span>
                      {action.jiraKey && <span className="text-gray-600"> ({action.jiraKey})</span>}
                      {action.reason && <span className="text-xs text-gray-500 ml-2">• {action.reason}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Potential duplicates */}
          {results.data.potentialDuplicates && results.data.potentialDuplicates.length > 0 && (
            <div className="mb-4 p-4 bg-orange-50 rounded">
              <h4 className="font-bold mb-2 text-orange-700">
                ⚠️ Potential Duplicates ({results.data.potentialDuplicates.length})
              </h4>
              <div className="space-y-3">
                {results.data.potentialDuplicates.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm p-3 bg-white rounded border border-orange-200">
                    <div className="font-bold">{item.title}</div>
                    <div className="text-xs text-gray-600">Status: {item.status}</div>
                    {item.warning && (
                      <div className="text-xs text-orange-600 mt-1">{item.warning}</div>
                    )}
                    {item.matches && (
                      <div className="mt-2 space-y-1">
                        {item.matches.map((match: any, midx: number) => (
                          <div key={midx} className="text-xs bg-gray-50 p-2 rounded">
                            {match.key}: {match.title} ({match.status})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full JSON Response */}
          <div className="mt-4">
            <details>
              <summary className="cursor-pointer font-bold text-sm mb-2">
                Full JSON Response (click to expand)
              </summary>
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </details>
          </div>
        </Card>
      )}

      {/* Documentation Link */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-bold mb-2">📖 Documentation</h3>
        <p className="text-sm text-gray-700">
          For detailed information about the JIRA integration and duplicate prevention, see{' '}
          <code className="bg-gray-200 px-2 py-1 rounded">docs/JIRA_DUPLICATE_FIX.md</code>
        </p>
      </Card>
    </div>
  );
}
