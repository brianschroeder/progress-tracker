'use client';

import React from 'react';

export default function SettingsPage() {
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

        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-16 text-center">
          <div className="text-6xl mb-6">⚙️</div>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
            Settings Coming Soon
          </h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">
            We're working on customization options including themes, notifications, and preferences.
          </p>
          <div className="inline-flex items-center space-x-2 text-sm text-accent">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            <span>In Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}
