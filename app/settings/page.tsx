'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [jiraSettings, setJiraSettings] = useState({
    jiraEnabled: false,
    jiraDomain: '',
    jiraEmail: '',
    jiraApiToken: '',
    jiraProjectKey: '',
    jiraComponent: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/jira/settings');
      const data = await response.json();
      setJiraSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/jira/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'JIRA settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/jira/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: jiraSettings.jiraDomain,
          email: jiraSettings.jiraEmail,
          apiToken: jiraSettings.jiraApiToken,
          projectKey: jiraSettings.jiraProjectKey,          component: jiraSettings.jiraComponent,        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Connection successful! ✓' });
      } else {
        setMessage({ type: 'error', text: `Connection failed: ${result.message}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Connection test failed: ${error.message}` });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
            Settings
          </h1>
          <p className="text-xl text-neutral-600">
            Customize your{' '}
            <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
              experience
            </span>
          </p>
        </div>

        {/* JIRA Integration Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.757a1 1 0 0 0-1.001-1zm5.7-5.757H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057a5.215 5.215 0 0 0 5.215 5.215V1a1.001 1.001 0 0 0-1.02-1z"/>
            </svg>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">JIRA Integration</h2>
              <p className="text-neutral-600 text-sm">Connect to JIRA Cloud to sync your work goals</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div>
                <label className="font-medium text-neutral-900">Enable JIRA Sync</label>
                <p className="text-sm text-neutral-600">Automatically sync work goals with JIRA</p>
              </div>
              <button
                type="button"
                onClick={() => setJiraSettings({ ...jiraSettings, jiraEnabled: !jiraSettings.jiraEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  jiraSettings.jiraEnabled ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    jiraSettings.jiraEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* JIRA Domain */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                JIRA Domain
              </label>
              <Input
                type="text"
                value={jiraSettings.jiraDomain}
                onChange={(e) => setJiraSettings({ ...jiraSettings, jiraDomain: e.target.value })}
                placeholder="e.g., yourcompany.atlassian.net"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">Your Atlassian domain (without https://)</p>
            </div>

            {/* JIRA Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                JIRA Email
              </label>
              <Input
                type="email"
                value={jiraSettings.jiraEmail}
                onChange={(e) => setJiraSettings({ ...jiraSettings, jiraEmail: e.target.value })}
                placeholder="your.email@company.com"
                className="w-full"
              />
            </div>

            {/* JIRA API Token */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                JIRA API Token
              </label>
              <Input
                type="password"
                value={jiraSettings.jiraApiToken}
                onChange={(e) => setJiraSettings({ ...jiraSettings, jiraApiToken: e.target.value })}
                placeholder="Enter your JIRA API token"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Generate at:{' '}
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Atlassian API Tokens
                </a>
              </p>
            </div>

            {/* Project Key */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                JIRA Project Key
              </label>
              <Input
                type="text"
                value={jiraSettings.jiraProjectKey}
                onChange={(e) => setJiraSettings({ ...jiraSettings, jiraProjectKey: e.target.value.toUpperCase() })}
                placeholder="e.g., SRE"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">The project key where issues will be created</p>
            </div>

            {/* Component */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Component
              </label>
              <Input
                type="text"
                value={jiraSettings.jiraComponent}
                onChange={(e) => setJiraSettings({ ...jiraSettings, jiraComponent: e.target.value })}
                placeholder="e.g., SRE cloud"
                className="w-full"
              />
              <p className="text-xs text-neutral-500 mt-1">The component to assign to Stories (required for SRE project)</p>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testing || !jiraSettings.jiraDomain || !jiraSettings.jiraEmail || !jiraSettings.jiraApiToken}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Work Goals sync as JIRA Stories</li>
              <li>• Work Tasks sync as Subtasks linked to their parent Story</li>
              <li>• Completion status and due dates are kept in sync</li>
              <li>• Click "Sync with JIRA" on the Work page to synchronize</li>
            </ul>
          </div>

          {/* JIRA Test Console */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-medium text-purple-900 mb-2">🧪 Testing Tools</h3>
            <p className="text-sm text-purple-800 mb-3">
              Test JIRA endpoints and check for duplicates before syncing
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = '/jira-test'}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Open JIRA Test Console
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
