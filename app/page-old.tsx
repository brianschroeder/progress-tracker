'use client';

import React, { useEffect, useState } from 'react';
import { Goal, Completion } from '@/types';
import { formatWeekRange, getDatesInWeek, formatDateForDB } from '@/lib/date-utils';
import { format, startOfWeek } from 'date-fns';
import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Always start on Monday
  });

  const weekStartsOn = 1; // Monday
  const weekDates = getDatesInWeek(currentWeekStart);
  const weekRange = formatWeekRange(weekDates[0], weekDates[6]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  async function fetchData() {
    try {
      const startDate = formatDateForDB(weekDates[0]);
      const endDate = formatDateForDB(weekDates[6]);

      const goalsRes = await fetch('/api/goals?active=true');
      const goalsData = await goalsRes.json();
      
      // Debug: Log goals to see if daysOfWeek is populated
      console.log('Goals loaded:', goalsData.map((g: Goal) => ({ 
        name: g.name, 
        daysOfWeek: g.daysOfWeek 
      })));

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
    // Simple toggle: only mark complete or incomplete
    // Planning is ONLY done from the Goals page
    await toggleCompletion(goal, date);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const weeklyStats = goals.map(goal => {
    const completed = weekDates.filter(date => isGoalCompletedOnDate(goal.id!, date)).length;
    return { goal, completed, target: goal.targetDaysPerWeek };
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Modern Header */}
      <header className="glass sticky top-0 z-20 border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-primary tracking-tight">Goals</h1>
              <p className="text-sm text-neutral-500 mt-1 font-medium">{weekRange}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/today')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft hover:shadow-medium font-medium"
                title="Daily Focus"
              >
                <span className="text-base">📋</span>
                <span className="text-sm">Daily View</span>
              </button>
              <button
                onClick={() => router.push('/goals')}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-soft transition-smooth font-medium"
                title="Manage Goals"
              >
                <Cog6ToothIcon className="w-4 h-4 text-neutral-600" />
                <span className="text-sm text-neutral-700">Manage</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Modern Week Navigation */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const newDate = new Date(currentWeekStart);
                    newDate.setDate(newDate.getDate() - 7);
                    const monday = startOfWeek(newDate, { weekStartsOn: 1 });
                    setCurrentWeekStart(monday);
                  }}
                  className="p-2.5 hover:bg-white rounded-xl border border-neutral-200 transition-smooth hover:shadow-soft"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-neutral-600" />
                </button>
                
                <button
                  onClick={() => {
                    const today = new Date();
                    const monday = startOfWeek(today, { weekStartsOn: 1 });
                    setCurrentWeekStart(monday);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-accent hover:bg-accent/5 rounded-xl transition-smooth"
                >
                  Current Week
                </button>
                
                <button
                  onClick={() => {
                    const newDate = new Date(currentWeekStart);
                    newDate.setDate(newDate.getDate() + 7);
                    const monday = startOfWeek(newDate, { weekStartsOn: 1 });
                    setCurrentWeekStart(monday);
                  }}
                  className="p-2.5 hover:bg-white rounded-xl border border-neutral-200 transition-smooth hover:shadow-soft"
                >
                  <ChevronRightIcon className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Minimalist Legend */}
              <div className="flex items-center space-x-6 text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-lg border-2 border-neutral-200 bg-white" />
                  <span className="text-neutral-500">Unscheduled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-lg bg-accent/10 border-2 border-accent" />
                  <span className="text-neutral-500">Scheduled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-lg bg-success border-2 border-success flex items-center justify-center">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-neutral-500">Completed</span>
                </div>
              </div>
            </div>

            {/* Modern Calendar Table */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
              {goals.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-neutral-400 mb-6 text-base">No goals yet</p>
                  <button
                    onClick={() => router.push('/goals')}
                    className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft font-medium"
                  >
                    Create Your First Goal
                  </button>
                </div>
              ) : (
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
                                      ? 'bg-accent/10 border-2 border-accent hover:bg-accent/20'
                                      : 'border-2 border-neutral-200 hover:border-accent bg-white hover:bg-accent/5'
                                  }`}
                                  title={
                                    isCompleted && isPlanned
                                      ? 'Completed (Scheduled) - Click to unmark'
                                      : isCompleted
                                      ? 'Completed - Click to unmark'
                                      : isPlanned
                                      ? 'Scheduled - Click to mark complete'
                                      : 'Click to mark complete'
                                  }
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
              )}
            </div>

            {/* Modern Progress Tracker */}
            {goals.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-soft border border-neutral-200 p-8">
                <h2 className="text-xl font-semibold text-primary mb-6">Weekly Progress</h2>
                
                {/* Minimalist Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                    <div className="text-xs text-neutral-500 mb-2 font-medium uppercase tracking-wide">Completions</div>
                    <div className="text-3xl font-semibold text-neutral-900">
                      {completions.length}
                    </div>
                  </div>
                  <div className="bg-success/5 rounded-xl p-5 border border-success/20">
                    <div className="text-xs text-success/70 mb-2 font-medium uppercase tracking-wide">On Track</div>
                    <div className="text-3xl font-semibold text-success">
                      {weeklyStats.filter(s => s.completed >= s.target).length} <span className="text-xl text-neutral-400">/ {goals.length}</span>
                    </div>
                  </div>
                  <div className="bg-accent/5 rounded-xl p-5 border border-accent/20">
                    <div className="text-xs text-accent/70 mb-2 font-medium uppercase tracking-wide">Overall</div>
                    <div className="text-3xl font-semibold text-accent">
                      {Math.round((completions.length / weeklyStats.reduce((sum, s) => sum + s.target, 0)) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Clean Goal Progress Bars */}
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
                              isOnTrack ? 'text-success' : isPartial ? 'text-amber-500' : 'text-neutral-400'
                            }`}>
                              {completed} <span className="text-neutral-300">/</span> {target}
                            </span>
                            <span className="text-xs text-neutral-400 tabular-nums w-12 text-right">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              isOnTrack ? 'bg-success' : isPartial ? 'bg-amber-400' : 'bg-neutral-300'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtle Motivational Message */}
                {weeklyStats.every(s => s.completed >= s.target) && (
                  <div className="mt-6 p-4 bg-success/5 rounded-xl border border-success/20">
                    <p className="text-sm text-success font-medium text-center">
                      ✓ All goals completed this week
                    </p>
                  </div>
                )}
              </div>
            )}
         </div>
     </div>
   );
 }
