'use client';

import React, { useEffect, useState } from 'react';
import { Goal, Completion } from '@/types';
import { formatWeekRange, getDatesInWeek, formatDateForDB } from '@/lib/date-utils';
import { format, startOfWeek } from 'date-fns';
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });

  const weekStartsOn = 1;
  const weekDates = getDatesInWeek(currentWeekStart);
  const weekRange = formatWeekRange(weekDates[0], weekDates[6]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get current hour for greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  async function fetchData() {
    try {
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);

      const goalsRes = await fetch('/api/goals?active=true');
      const goalsData = await goalsRes.json();

      const allCompletions: Completion[] = [];
      for (const goal of goalsData) {
        const res = await fetch(`/api/completions?goalId=${goal.id}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        allCompletions.push(...data);
      }

      setGoals(goalsData);
      setCompletions(allCompletions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function isGoalCompletedOnDate(goalId: number, date: Date): boolean {
    const dateStr = formatDateForDB(date);
    return completions.some(c => c.goalId === goalId && c.completionDate === dateStr);
  }

  function isGoalPlannedForDay(goal: Goal, dayOfWeek: number): boolean {
    return goal.daysOfWeek?.includes(dayOfWeek) || false;
  }

  async function toggleCompletion(goal: Goal, date: Date) {
    const dateStr = formatDateForDB(date);
    const completion = completions.find(c => c.goalId === goal.id && c.completionDate === dateStr);

    try {
      if (completion) {
        await fetch(`/api/completions/${completion.id}`, { method: 'DELETE' });
        setCompletions(completions.filter(c => c.id !== completion.id));
      } else {
        const response = await fetch('/api/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId: goal.id, completionDate: dateStr }),
        });
        const newCompletion = await response.json();
        setCompletions([...completions, newCompletion]);
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  }

  async function handleCellClick(goal: Goal, date: Date) {
    await toggleCompletion(goal, date);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  const weeklyStats = goals.map(goal => {
    const completed = weekDates.filter(date => isGoalCompletedOnDate(goal.id!, date)).length;
    return { goal, completed, target: goal.targetDaysPerWeek };
  });

  const todayCompletions = goals.filter(g => isGoalCompletedOnDate(g.id!, today)).length;
  const todayScheduled = goals.filter(g => isGoalPlannedForDay(g, today.getDay())).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Centered Content Container */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section with Gradient Orb */}
        <div className="relative mb-16">
          {/* Gradient Orb */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-light via-accent to-accent-dark rounded-full blur-3xl opacity-40"></div>
          
          {/* Greeting */}
          <div className="text-center relative z-10">
            <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
              {greeting}
            </h1>
            <p className="text-2xl text-neutral-600">
              What's on{' '}
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
                your mind
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-neutral-900 mb-1">{todayCompletions}</div>
              <div className="text-sm text-neutral-500">Completed Today</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-accent mb-1">{todayScheduled}</div>
              <div className="text-sm text-neutral-500">Scheduled Today</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-neutral-900 mb-1">{goals.length}</div>
              <div className="text-sm text-neutral-500">Active Goals</div>
            </div>
          </div>
        )}

        {/* Get Started Section */}
        {goals.length === 0 ? (
          <div className="text-center">
            <p className="text-sm uppercase tracking-wide text-neutral-400 mb-6">Get started with an example below</p>
            
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => router.push('/goals')}
                className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-accent/30 hover:shadow-md transition-smooth text-left group"
              >
                <div className="text-sm text-neutral-700 group-hover:text-accent transition-colors">
                  Create your first goal
                </div>
              </button>
              <button
                onClick={() => router.push('/today')}
                className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-accent/30 hover:shadow-md transition-smooth text-left group"
              >
                <div className="text-sm text-neutral-700 group-hover:text-accent transition-colors">
                  View daily focus
                </div>
              </button>
              <button
                onClick={() => router.push('/goals')}
                className="bg-white rounded-2xl p-6 border border-neutral-200 hover:border-accent/30 hover:shadow-md transition-smooth text-left group"
              >
                <div className="text-sm text-neutral-700 group-hover:text-accent transition-colors">
                  Plan your week
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Week Selector */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <button
                onClick={() => {
                  const newDate = new Date(currentWeekStart);
                  newDate.setDate(newDate.getDate() - 7);
                  const monday = startOfWeek(newDate, { weekStartsOn: 1 });
                  setCurrentWeekStart(monday);
                }}
                className="p-2.5 hover:bg-white rounded-xl border border-neutral-200 transition-smooth"
              >
                <ChevronLeftIcon className="w-5 h-5 text-neutral-600" />
              </button>
              
              <div className="text-center">
                <div className="text-sm uppercase tracking-wide text-neutral-400 mb-1">Week View</div>
                <div className="text-lg font-semibold text-neutral-900">{weekRange}</div>
              </div>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentWeekStart);
                  newDate.setDate(newDate.getDate() + 7);
                  const monday = startOfWeek(newDate, { weekStartsOn: 1 });
                  setCurrentWeekStart(monday);
                }}
                className="p-2.5 hover:bg-white rounded-xl border border-neutral-200 transition-smooth"
              >
                <ChevronRightIcon className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Calendar Card */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left p-4 font-semibold text-sm text-primary min-w-[180px] sticky left-0 bg-white z-10">Goal</th>
                      {weekDates.map((date, index) => {
                        const isToday = date.getTime() === today.getTime();
                        return (
                          <th key={index} className={`text-center p-4 font-semibold text-sm min-w-[90px] ${isToday ? 'bg-accent/5' : ''}`}>
                            <div className={`${isToday ? 'text-accent' : 'text-neutral-600'}`}>{format(date, 'EEE')}</div>
                            <div className={`text-xs font-medium mt-0.5 ${isToday ? 'text-accent' : 'text-neutral-400'}`}>{format(date, 'M/d')}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal) => (
                      <tr key={goal.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 sticky left-0 bg-white z-10">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: goal.color }} />
                              <span className="text-sm font-medium text-neutral-900">{goal.name}</span>
                            </div>
                            {goal.daysOfWeek && goal.daysOfWeek.length > 0 && (
                              <div className="flex items-center space-x-1 ml-5">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                  <span
                                    key={idx}
                                    className={`text-[10px] w-4 h-4 flex items-center justify-center rounded-md font-semibold ${
                                      goal.daysOfWeek?.includes(idx)
                                        ? 'bg-accent/20 text-accent'
                                        : 'bg-neutral-100 text-neutral-300'
                                    }`}
                                  >
                                    {day}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        {weekDates.map((date, index) => {
                          const dayOfWeek = date.getDay();
                          const isCompleted = isGoalCompletedOnDate(goal.id!, date);
                          const isPlanned = isGoalPlannedForDay(goal, dayOfWeek);
                          const isToday = date.getTime() === today.getTime();

                          return (
                            <td key={index} className={`text-center p-4 ${isToday ? 'bg-accent/5' : ''}`}>
                              <button
                                onClick={() => handleCellClick(goal, date)}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-smooth hover:scale-105 relative mx-auto group ${
                                  isCompleted
                                    ? 'bg-success text-white shadow-soft hover:shadow-medium'
                                    : isPlanned
                                    ? 'bg-accent/5 border-2 border-accent/30 hover:bg-accent/10'
                                    : 'border-2 border-neutral-200 hover:border-accent bg-white hover:bg-accent/5'
                                }`}
                              >
                                {isCompleted && (
                                  <CheckCircleIcon className="w-6 h-6" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-8">
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">Weekly Progress</h3>
              
                  <div className="space-y-4">
                {weeklyStats.map(({ goal, completed, target }) => {
                  const percentage = Math.round((completed / target) * 100);
                  const isOnTrack = completed >= target;
                  const isPartial = completed > 0 && completed < target;
                  
                  return (
                    <div key={goal.id} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: goal.color }} />
                          <span className="text-sm font-medium text-neutral-900">{goal.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-semibold tabular-nums ${
                            isOnTrack ? 'text-success' : isPartial ? 'text-accent' : 'text-neutral-400'
                          }`}>
                            {completed} <span className="text-neutral-300">/</span> {target}
                          </span>
                          <span className="text-xs text-neutral-400 tabular-nums w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            isOnTrack ? 'bg-success' : isPartial ? 'bg-accent' : 'bg-accent/30'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {weeklyStats.every(s => s.completed >= s.target) && (
                <div className="mt-6 p-4 bg-success/5 rounded-xl border border-success/20">
                  <p className="text-sm text-success font-medium text-center">
                    ✓ All goals completed this week
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
