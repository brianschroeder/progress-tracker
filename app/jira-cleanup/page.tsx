'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function JiraCleanupPage() {
  const [jql, setJql] = useState('project = YOURKEY AND issuetype = Story AND updated <= -90d');
  const [maxResults, setMaxResults] = useState(50);
  const [dryRun, setDryRun] = useState(true);
  const [fallbackToClose, setFallbackToClose] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/jira/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jql,
          maxResults,
          dryRun,
          fallbackToClose,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || data.message || 'Unknown error'}`);
      } else {
        setResults({
          status: response.status,
          data,
          timestamp: new Date().toLocaleString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canRun = dryRun || confirmText.trim().toUpperCase() === 'DUPLICATE';

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">JIRA Cleanup Tool</h1>
        <p className="text-gray-600 mt-2">
          Unassign issues and close them as duplicate using a JQL query.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Cleanup Parameters</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JQL Query
            </label>
            <textarea
              value={jql}
              onChange={(e) => setJql(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: project = SRE AND issuetype = Story AND updated &lt;= -180d
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Results
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value, 10) || 1)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="dry-run"
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
              <label htmlFor="dry-run" className="text-sm text-gray-700">
                Dry run (no changes)
              </label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="fallback-close"
                type="checkbox"
                checked={fallbackToClose}
                onChange={(e) => setFallbackToClose(e.target.checked)}
              />
              <label htmlFor="fallback-close" className="text-sm text-gray-700">
                Fallback to normal close when duplicate transition is missing
              </label>
            </div>
          </div>

          {!dryRun && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type DUPLICATE to confirm
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DUPLICATE"
              />
            </div>
          )}

          <Button
            onClick={runCleanup}
            disabled={loading || !jql.trim() || !canRun}
            className={dryRun ? '' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? 'Running...' : dryRun ? 'Run Dry Run' : 'Run Cleanup'}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card className="p-6 mb-6 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="font-medium">Processing cleanup...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-700 mb-2">Error</h3>
          <pre className="text-sm text-red-900 whitespace-pre-wrap">{error}</pre>
        </Card>
      )}

      {results && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold">Cleanup Results</h3>
              <p className="text-sm text-gray-600">
                Status {results.status} - {results.timestamp}
              </p>
            </div>
            <Button onClick={() => setResults(null)} variant="outline" size="sm">
              Clear
            </Button>
          </div>

          {results.data && (
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Found: </span>
                  <span className="font-bold">{results.data.totalFound}</span>
                </div>
                <div>
                  <span className="text-gray-600">Processed: </span>
                  <span className="font-bold">{results.data.processed}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unassigned: </span>
                  <span className="font-bold">{results.data.unassigned}</span>
                </div>
                <div>
                  <span className="text-gray-600">Closed Duplicate: </span>
                  <span className="font-bold">{results.data.closedAsDuplicate}</span>
                </div>
              </div>
            </div>
          )}

          {results.data?.actions && results.data.actions.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 rounded">
              <h4 className="font-bold mb-2">Planned Actions</h4>
              <div className="space-y-2">
                {results.data.actions.map((action: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-white rounded border">
                    <span className="font-bold text-blue-700">{action.action}</span>
                    {' - '}
                    <span>{action.key}</span>
                    <span className="text-gray-600">: {action.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.data?.errors && results.data.errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 rounded">
              <h4 className="font-bold mb-2 text-red-700">Errors</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {results.data.errors.map((err: string, idx: number) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <details>
            <summary className="cursor-pointer font-bold text-sm mb-2">
              Full JSON Response
            </summary>
            <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}
