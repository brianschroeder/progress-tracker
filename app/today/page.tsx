'use client';

import React, { useEffect, useState } from 'react';
import { Goal, Completion } from '@/types';
import { formatDateForDB } from '@/lib/date-utils';
import { format, addDays } from 'date-fns';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

interface DailyGoal {
  goal: Goal;
  date: Date;
  dateLabel: string;
  isCompleted: boolean;
  isScheduled: boolean;
}

export default function TodayPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dailyGoals.length > 0 && visibleCount < dailyGoals.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => prev + 1);
      }, 200); // Animation delay between items
      return () => clearTimeout(timer);
    }
  }, [visibleCount, dailyGoals.length]);

  async function fetchData() {
    try {
      const todayStr = formatDateForDB(today);
      const tomorrowStr = formatDateForDB(tomorrow);

      const [goalsRes] = await Promise.all([
        fetch('/api/goals?active=true'),
      ]);

      const goalsData = await goalsRes.json();

      // Fetch completions for today and tomorrow
      const allCompletions: Completion[] = [];
      for (const goal of goalsData) {
        const res = await fetch(`/api/completions?goalId=${goal.id}&startDate=${todayStr}&endDate=${tomorrowStr}`);
        const data = await res.json();
        allCompletions.push(...data);
      }

      setGoals(goalsData);
      setCompletions(allCompletions);

      // Build daily goals list
      const dailyList: DailyGoal[] = [];

      // Today's goals
      const todayDayOfWeek = today.getDay();
      goalsData.forEach((goal: Goal) => {
        const isScheduled = goal.daysOfWeek?.includes(todayDayOfWeek) || false;
        if (isScheduled) {
          const isCompleted = allCompletions.some(
            c => c.goalId === goal.id && c.completionDate === todayStr
          );
          dailyList.push({
            goal,
            date: today,
            dateLabel: 'Today',
            isCompleted,
            isScheduled: true,
          });
        }
      });

      // Tomorrow's goals
      const tomorrowDayOfWeek = tomorrow.getDay();
      goalsData.forEach((goal: Goal) => {
        const isScheduled = goal.daysOfWeek?.includes(tomorrowDayOfWeek) || false;
        if (isScheduled) {
          const isCompleted = allCompletions.some(
            c => c.goalId === goal.id && c.completionDate === tomorrowStr
          );
          dailyList.push({
            goal,
            date: tomorrow,
            dateLabel: 'Tomorrow',
            isCompleted,
            isScheduled: true,
          });
        }
      });

      setDailyGoals(dailyList);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  }

  async function toggleCompletion(dailyGoal: DailyGoal) {
    const dateStr = formatDateForDB(dailyGoal.date);
    const completion = completions.find(
      c => c.goalId === dailyGoal.goal.id && c.completionDate === dateStr
    );

    try {
      if (completion) {
        await fetch(`/api/completions/${completion.id}`, { method: 'DELETE' });
        setCompletions(completions.filter(c => c.id !== completion.id));
      } else {
        const response = await fetch('/api/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId: dailyGoal.goal.id, completionDate: dateStr }),
        });
        const newCompletion = await response.json();
        setCompletions([...completions, newCompletion]);
      }
      
      // Update daily goals list
      setDailyGoals(dailyGoals.map(dg => 
        dg.goal.id === dailyGoal.goal.id && dg.date.getTime() === dailyGoal.date.getTime()
          ? { ...dg, isCompleted: !dg.isCompleted }
          : dg
      ));
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header with Gradient */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
            Daily Focus
          </h1>
          <p className="text-xl text-neutral-600">
            Your goals for{' '}
            <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
              {format(today, 'EEEE')}
            </span>
          </p>
          <p className="text-sm text-neutral-400 mt-2">{format(today, 'MMMM d, yyyy')}</p>
        </div>
        {dailyGoals.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-16 shadow-soft border border-neutral-200">
              <div className="text-6xl mb-4">☀️</div>
              <p className="text-xl text-neutral-600 mb-2 font-medium">All clear!</p>
              <p className="text-neutral-400 mb-8">No goals scheduled for today or tomorrow</p>
              <button
                onClick={() => router.push('/goals')}
                className="px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft font-medium"
              >
                Manage Goals
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {dailyGoals.map((dailyGoal, index) => {
              const isVisible = index < visibleCount;
              const isNewDay = index === 0 || dailyGoals[index - 1].dateLabel !== dailyGoal.dateLabel;

              return (
                <React.Fragment key={`${dailyGoal.goal.id}-${dailyGoal.dateLabel}`}>
                  {/* Modern Day Header */}
                  {isNewDay && (
                    <div
                      className={`transition-all duration-500 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      <h2 className="text-2xl font-semibold text-primary mb-6 mt-8">
                        {dailyGoal.dateLabel === 'Today' ? 'Today' : 'Tomorrow'}
                      </h2>
                    </div>
                  )}

                  {/* Clean Goal Card */}
                  <div
                    className={`transition-all duration-500 transform ${
                      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                    }`}
                    style={{ transitionDelay: `${(index % 10) * 50}ms` }}
                  >
                    <div
                      className={`bg-white rounded-2xl p-6 border-2 transition-smooth hover:shadow-medium cursor-pointer ${
                        dailyGoal.isCompleted
                          ? 'border-success/30 bg-success/5'
                          : 'border-neutral-200 hover:border-accent/30 shadow-soft'
                      }`}
                      onClick={() => toggleCompletion(dailyGoal)}
                    >
                      <div className="flex items-center space-x-5">
                        {/* Minimalist Status Indicator */}
                        <div
                          className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-smooth ${
                            dailyGoal.isCompleted
                              ? 'bg-success'
                              : 'bg-neutral-100 border-2 border-neutral-200'
                          }`}
                        >
                          {dailyGoal.isCompleted ? (
                            <CheckCircleIcon className="w-8 h-8 text-white" />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: dailyGoal.goal.color }}
                            />
                          )}
                        </div>

                        {/* Goal Info */}
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-semibold mb-1 transition-colors ${
                              dailyGoal.isCompleted ? 'text-success/70 line-through' : 'text-neutral-900'
                            }`}
                          >
                            {dailyGoal.goal.name}
                          </h3>
                          {dailyGoal.goal.description && (
                            <p className="text-sm text-neutral-500">{dailyGoal.goal.description}</p>
                          )}
                          {dailyGoal.isCompleted && (
                            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-success/20 text-success font-medium">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Modern Progress Summary */}
            {visibleCount >= dailyGoals.length && (
              <div className="transition-all duration-500 opacity-100 translate-y-0 mt-12">
                <div className="bg-white rounded-2xl p-8 shadow-soft border border-neutral-200">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-primary mb-6">Progress</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
                        <div className="text-4xl font-semibold text-neutral-900 mb-2">
                          {dailyGoals.filter(dg => dg.isCompleted).length}
                        </div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Completed</div>
                      </div>
                      <div className="bg-accent/5 rounded-xl p-6 border border-accent/20">
                        <div className="text-4xl font-semibold text-accent mb-2">
                          {dailyGoals.filter(dg => !dg.isCompleted).length}
                        </div>
                        <div className="text-xs text-accent/70 uppercase tracking-wide font-medium">Remaining</div>
                      </div>
                    </div>
                    {dailyGoals.every(dg => dg.isCompleted) && (
                      <p className="mt-6 text-sm font-medium text-success p-3 bg-success/10 rounded-xl">
                        All goals completed
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
