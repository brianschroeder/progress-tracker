'use client';

import React, { useEffect, useState } from 'react';
import { Goal, Completion } from '@/types';
import { CheckCircleIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [intention, setIntention] = useState('');
  const [savedIntention, setSavedIntention] = useState('');
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  useEffect(() => {
    fetchGoals();
    fetchCompletions();
    loadIntention();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      const data = await response.json();
      setGoals(data.filter((g: Goal) => g.isActive));
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletions = async () => {
    try {
      const todayStr = format(today, 'yyyy-MM-dd');
      const response = await fetch(`/api/completions?date=${todayStr}`);
      const data = await response.json();
      setCompletions(data);
    } catch (error) {
      console.error('Failed to fetch completions:', error);
    }
  };

  const loadIntention = () => {
    const saved = localStorage.getItem(`intention-${format(today, 'yyyy-MM-dd')}`);
    if (saved) {
      setSavedIntention(saved);
      setIntention(saved);
    }
  };

  const saveIntention = () => {
    localStorage.setItem(`intention-${format(today, 'yyyy-MM-dd')}`, intention);
    setSavedIntention(intention);
  };

  const toggleCompletion = async (goalId: number) => {
    const todayStr = format(today, 'yyyy-MM-dd');
    const existing = completions.find(c => c.goalId === goalId);

    if (existing) {
      // Remove completion
      await fetch(`/api/completions/${existing.id}`, { method: 'DELETE' });
      setCompletions(completions.filter(c => c.id !== existing.id));
    } else {
      // Add completion
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, completionDate: todayStr }),
      });
      const newCompletion = await response.json();
      setCompletions([...completions, newCompletion]);
    }
  };

  const todaysGoals = goals.filter(goal => {
    if (!goal.daysOfWeek || goal.daysOfWeek.length === 0) return false;
    return goal.daysOfWeek.includes(dayOfWeek);
  });

  const todayStr = format(today, 'yyyy-MM-dd');
  const completedToday = completions;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="relative mb-12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-light via-accent to-accent-dark rounded-full blur-3xl opacity-40"></div>
          
          <div className="text-center relative z-10">
            <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
              {format(today, 'EEEE, MMMM d')}
            </h1>
            <p className="text-2xl text-neutral-600">
              What are your{' '}
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
                intentions
              </span>
              {' '}today?
            </p>
          </div>
        </div>

        {/* Daily Intention */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Today's Intention</h2>
          </div>
          
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What do you want to focus on today? How do you want to show up?"
            className="w-full min-h-[120px] p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none mb-4"
          />
          
          {savedIntention !== intention && (
            <button
              onClick={saveIntention}
              className="w-full px-4 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth font-medium shadow-soft"
            >
              Save Intention
            </button>
          )}
          
          {savedIntention && savedIntention === intention && (
            <div className="flex items-center justify-center space-x-2 text-success">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">Intention saved for today</span>
            </div>
          )}
        </div>

        {/* Today's Goals from Weekly Schedule */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Scheduled for Today</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-neutral-400">Loading...</div>
          ) : todaysGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-neutral-500 mb-2">No goals scheduled for today</p>
              <p className="text-sm text-neutral-400">Visit the Goals page to set your weekly schedule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysGoals.map((goal) => {
                const isCompleted = completedToday.some(c => c.goalId === goal.id);
                
                return (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer ${
                      isCompleted
                        ? 'bg-success/5 border-success/40'
                        : 'bg-neutral-50 border-neutral-200 hover:border-accent/50'
                    }`}
                    onClick={() => goal.id && toggleCompletion(goal.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-smooth ${
                          isCompleted
                            ? 'bg-success text-white'
                            : 'bg-white border-2 border-neutral-300'
                        }`}
                      >
                        {isCompleted && <CheckCircleIcon className="w-7 h-7" />}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${
                          isCompleted ? 'text-success line-through' : 'text-neutral-900'
                        }`}>
                          {goal.name}
                        </h3>
                        {goal.description && (
                          <p className="text-sm text-neutral-500 mt-1">{goal.description}</p>
                        )}
                      </div>
                      
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress Summary */}
          {todaysGoals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-neutral-700">Today's Progress</span>
                <span className="text-lg font-bold text-accent">
                  {completedToday.length} / {todaysGoals.length}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                  style={{ width: `${(completedToday.length / todaysGoals.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Motivational Message */}
        <div className="mt-8 text-center">
          <p className="text-neutral-500 flex items-center justify-center space-x-2">
            <HeartIcon className="w-5 h-5 text-accent" />
            <span>Make today count!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
