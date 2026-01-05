'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface YearGoal {
  id?: number;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  progress: number;
  color: string;
  sortOrder?: number;
  trackingMode?: 'percentage' | 'count';
  currentCount?: number;
  targetCount?: number;
}

const categories = [
  { name: 'Career', color: '#3B82F6' },
  { name: 'Health', color: '#10B981' },
  { name: 'Finance', color: '#F59E0B' },
  { name: 'Relationships', color: '#EF4444' },
  { name: 'Personal Growth', color: '#8B5CF6' },
  { name: 'Learning', color: '#06B6D4' },
];

export default function YearGoalsPage() {
  const [goals, setGoals] = useState<YearGoal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<YearGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Career',
    targetDate: '',
    color: '#3B82F6',
    trackingMode: 'percentage' as 'percentage' | 'count',
    currentCount: 0,
    targetCount: 0,
  });

  const currentYear = new Date().getFullYear();

  const toggleExpanded = (goalId: number) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const response = await fetch('/api/year-goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch year goals:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGoal) {
        await fetch(`/api/year-goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            isCompleted: editingGoal.isCompleted,
            progress: editingGoal.progress,
          }),
        });
      } else {
        await fetch('/api/year-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            isCompleted: false,
            progress: 0,
          }),
        });
      }
      
      fetchGoals();
      setShowModal(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        category: 'Career',
        targetDate: '',
        color: '#3B82F6',
        trackingMode: 'percentage',
        currentCount: 0,
        targetCount: 0,
      });
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await fetch(`/api/year-goals/${id}`, { method: 'DELETE' });
        fetchGoals();
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const toggleComplete = async (id: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    try {
      await fetch(`/api/year-goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          isCompleted: !goal.isCompleted,
          progress: !goal.isCompleted ? 100 : goal.progress,
        }),
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const updateProgress = async (id: number, progress: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    try {
      await fetch(`/api/year-goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          progress,
          isCompleted: progress === 100,
        }),
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const updateCount = async (id: number, increment: boolean) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal || goal.trackingMode !== 'count') return;

      const newCount = increment 
        ? (goal.currentCount || 0) + 1 
        : Math.max(0, (goal.currentCount || 0) - 1);
      
      const newProgress = goal.targetCount && goal.targetCount > 0
        ? Math.round((newCount / goal.targetCount) * 100)
        : 0;

      await fetch(`/api/year-goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...goal, 
          currentCount: newCount,
          progress: newProgress,
          isCompleted: newProgress >= 100,
        }),
      });

      fetchGoals();
    } catch (error) {
      console.error('Failed to update count:', error);
    }
  };

  const setCount = async (id: number, newCount: number) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal || goal.trackingMode !== 'count') return;

      const count = Math.max(0, newCount);
      const newProgress = goal.targetCount && goal.targetCount > 0
        ? Math.round((count / goal.targetCount) * 100)
        : 0;

      await fetch(`/api/year-goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...goal, 
          currentCount: count,
          progress: newProgress,
          isCompleted: newProgress >= 100,
        }),
      });

      fetchGoals();
    } catch (error) {
      console.error('Failed to set count:', error);
    }
  };

  const moveGoalUp = async (index: number) => {
    if (index === 0) return;
    const newGoals = [...goals];
    [newGoals[index], newGoals[index - 1]] = [newGoals[index - 1], newGoals[index]];
    setGoals(newGoals);
    await reorderGoals(newGoals.map(g => g.id!));
  };

  const moveGoalDown = async (index: number) => {
    if (index === goals.length - 1) return;
    const newGoals = [...goals];
    [newGoals[index], newGoals[index + 1]] = [newGoals[index + 1], newGoals[index]];
    setGoals(newGoals);
    await reorderGoals(newGoals.map(g => g.id!));
  };

  const reorderGoals = async (goalIds: number[]) => {
    try {
      await fetch('/api/year-goals/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds }),
      });
    } catch (error) {
      console.error('Failed to reorder goals:', error);
    }
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      category: 'Career',
      targetDate: '',
      color: '#3B82F6',
      trackingMode: 'percentage',
      currentCount: 0,
      targetCount: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (goal: YearGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      targetDate: goal.targetDate || '',
      color: goal.color,
      trackingMode: goal.trackingMode || 'percentage',
      currentCount: goal.currentCount || 0,
      targetCount: goal.targetCount || 0,
    });
    setShowModal(true);
  };

  const completedGoals = goals.filter(g => g.isCompleted).length;
  const totalGoals = goals.length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Calculate days remaining in the year
  const today = new Date();
  const endOfYear = new Date(currentYear, 11, 31); // December 31st
  const daysRemaining = Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDaysInYear = 365 + (new Date(currentYear, 1, 29).getMonth() === 1 ? 1 : 0); // Check for leap year
  const daysPassed = totalDaysInYear - daysRemaining;
  const yearProgress = Math.round((daysPassed / totalDaysInYear) * 100);

  // Separate goals by tracking mode
  const countGoals = goals.filter(g => g.trackingMode === 'count');
  const percentageGoals = goals.filter(g => g.trackingMode !== 'count');

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="relative mb-16">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-light via-accent to-accent-dark rounded-full blur-3xl opacity-40"></div>
          
          <div className="text-center relative z-10">
            <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
              {currentYear} Goals
            </h1>
            <p className="text-2xl text-neutral-600">
              What do you want to{' '}
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
                achieve this year
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Days Remaining Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 rounded-2xl p-6 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">⏳</div>
                <div>
                  <div className="text-4xl font-bold text-accent mb-1">{daysRemaining}</div>
                  <div className="text-sm font-medium text-neutral-600">Days Remaining in {currentYear}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-neutral-800 mb-1">{yearProgress}%</div>
                <div className="text-xs text-neutral-500">Year Complete</div>
                <div className="w-48 h-2 bg-neutral-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                    style={{ width: `${yearProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-neutral-900 mb-1">{totalGoals}</div>
              <div className="text-sm text-neutral-500">Total Goals</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-success mb-1">{completedGoals}</div>
              <div className="text-sm text-neutral-500">Completed</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-accent mb-1">{completionRate}%</div>
              <div className="text-sm text-neutral-500">Completion Rate</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft hover:shadow-medium font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Year Goal</span>
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-smooth shadow-soft hover:shadow-medium font-medium ${
              editMode 
                ? 'bg-accent text-white hover:bg-accent-light' 
                : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-accent'
            }`}
          >
            <PencilIcon className="w-5 h-5" />
            <span>{editMode ? 'Done Editing' : 'Edit Mode'}</span>
          </button>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-neutral-400">Loading...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-16 shadow-soft border border-neutral-200">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl text-neutral-600 mb-2 font-medium">Set your {currentYear} goals</p>
              <p className="text-neutral-400 mb-8">Create meaningful goals for the year ahead</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Count-Based Goals Section */}
            {countGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent flex-1"></div>
                  <h2 className="text-2xl font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="text-2xl">🔢</span>
                    Count-Based Goals
                    <span className="text-sm font-normal text-neutral-500 ml-1">({countGoals.length})</span>
                  </h2>
                  <div className="h-px bg-gradient-to-r from-accent via-accent to-transparent flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {countGoals.map((goal, index) => {
                    const globalIndex = goals.findIndex(g => g.id === goal.id);
                    return (
                      <div
                        key={goal.id}
                        className={`bg-white rounded-xl shadow-soft border-2 transition-smooth hover:shadow-medium ${
                          goal.isCompleted 
                            ? 'border-success/40 bg-gradient-to-br from-success/5 to-success/10' 
                            : 'border-neutral-200 hover:border-accent/30'
                        }`}
                      >
                        {/* Vertical Card Layout */}
                        <div className="p-4 space-y-3">
                          {/* Header with Complete Checkbox */}
                          <div className="flex items-start justify-between">
                            {editMode && (
                              <div className="flex items-center space-x-2">
                                {/* Reorder Buttons - Only in Edit Mode */}
                                <button
                                  onClick={() => moveGoalUp(globalIndex)}
                                  disabled={globalIndex === 0}
                                  className={`p-1.5 rounded-lg transition-smooth ${
                                    globalIndex === 0
                                      ? 'text-neutral-200 cursor-not-allowed'
                                      : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                                  }`}
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveGoalDown(globalIndex)}
                                  disabled={globalIndex === goals.length - 1}
                                  className={`p-1.5 rounded-lg transition-smooth ${
                                    globalIndex === goals.length - 1
                                      ? 'text-neutral-200 cursor-not-allowed'
                                      : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                                  }`}
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Checkbox */}
                            <button
                              onClick={() => toggleComplete(goal.id!)}
                              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-smooth ${
                                goal.isCompleted
                                  ? 'bg-success text-white'
                                  : 'bg-neutral-100 border-2 border-neutral-200 hover:border-accent'
                              } ${!editMode ? 'ml-auto' : ''}`}
                            >
                              {goal.isCompleted && <CheckCircleIcon className="w-6 h-6" />}
                            </button>
                          </div>

                          {/* Title */}
                          <div>
                            <div className="flex items-start space-x-2">
                              <h3 className={`text-lg font-bold flex-1 ${
                                goal.isCompleted ? 'text-success line-through' : 'text-neutral-900'
                              }`}>
                                {goal.title}
                              </h3>
                              {goal.description && (
                                <button
                                  onClick={() => goal.id && toggleExpanded(goal.id)}
                                  className="p-1 hover:bg-accent/10 rounded-lg transition-smooth flex-shrink-0"
                                  title={expandedGoals.has(goal.id!) ? 'Hide details' : 'Show details'}
                                >
                                  <ChevronDownIcon 
                                    className={`w-4 h-4 text-accent transition-transform ${
                                      expandedGoals.has(goal.id!) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {goal.description && expandedGoals.has(goal.id!) && (
                            <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                              {goal.description}
                            </p>
                          )}
                          
                          {/* Meta Info */}
                          <div className="flex flex-col gap-2">
                            <span
                              className="px-3 py-1 rounded-full font-semibold text-xs inline-block w-fit"
                              style={{ 
                                backgroundColor: `${goal.color}20`,
                                color: goal.color,
                                border: `1px solid ${goal.color}40`
                              }}
                            >
                              {goal.category}
                            </span>
                            {goal.targetDate && (
                              <span className="text-xs text-neutral-500">
                                <span className="font-medium">Target:</span>{' '}
                                <span className="font-semibold text-neutral-700">
                                  {new Date(goal.targetDate).toLocaleDateString()}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Progress - Count Mode */}
                          {!goal.isCompleted && (
                            <div className="pt-3 border-t border-neutral-200">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-neutral-600">Count Progress</span>
                                <span className="text-sm font-bold text-accent">{goal.progress || 0}%</span>
                              </div>
                              
                              <div className="flex items-center gap-3 mb-3">
                                <button
                                  onClick={() => goal.id && updateCount(goal.id, false)}
                                  className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 font-bold text-lg transition-smooth"
                                >
                                  −
                                </button>
                                
                                <div className="flex-1 text-center">
                                  <input
                                    type="number"
                                    value={goal.currentCount || 0}
                                    onChange={(e) => goal.id && setCount(goal.id, parseInt(e.target.value) || 0)}
                                    className="w-full text-center text-2xl font-bold text-accent bg-neutral-50 border-2 border-neutral-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
                                    min="0"
                                  />
                                  <div className="text-xs text-neutral-500 mt-1">
                                    of {goal.targetCount || 0}
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => goal.id && updateCount(goal.id, true)}
                                  className="w-10 h-10 rounded-lg bg-accent hover:bg-accent-light flex items-center justify-center text-white font-bold text-lg transition-smooth"
                                >
                                  +
                                </button>
                              </div>
                              
                              <div className="w-full bg-neutral-200 rounded-full h-2 shadow-inner">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                                  style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Edit/Delete Buttons - Only in Edit Mode */}
                          {editMode && (
                            <div className="pt-3 border-t border-neutral-200 flex gap-2">
                              <button
                                onClick={() => openEditModal(goal)}
                                className="flex-1 px-3 py-2 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-smooth"
                              >
                                Edit Goal
                              </button>
                              <button
                                onClick={() => goal.id && handleDelete(goal.id)}
                                className="px-3 py-2 text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 rounded-lg transition-smooth"
                                title="Delete goal"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Percentage-Based Goals Section */}
            {percentageGoals.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent flex-1"></div>
                  <h2 className="text-2xl font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Percentage-Based Goals
                    <span className="text-sm font-normal text-neutral-500 ml-1">({percentageGoals.length})</span>
                  </h2>
                  <div className="h-px bg-gradient-to-r from-accent via-accent to-transparent flex-1"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {percentageGoals.map((goal) => {
                    const globalIndex = goals.findIndex(g => g.id === goal.id);
                    return (
                      <div
                        key={goal.id}
                        className={`bg-white rounded-xl shadow-soft border-2 transition-smooth hover:shadow-medium ${
                          goal.isCompleted 
                            ? 'border-success/40 bg-gradient-to-br from-success/5 to-success/10' 
                            : 'border-neutral-200 hover:border-accent/30'
                        }`}
                      >
                        {/* Vertical Card Layout */}
                        <div className="p-4 space-y-3">
                          {/* Header with Complete Checkbox */}
                          <div className="flex items-start justify-between">
                            {editMode && (
                              <div className="flex items-center space-x-2">
                                {/* Reorder Buttons - Only in Edit Mode */}
                                <button
                                  onClick={() => moveGoalUp(globalIndex)}
                                  disabled={globalIndex === 0}
                                  className={`p-1.5 rounded-lg transition-smooth ${
                                    globalIndex === 0
                                      ? 'text-neutral-200 cursor-not-allowed'
                                      : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                                  }`}
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveGoalDown(globalIndex)}
                                  disabled={globalIndex === goals.length - 1}
                                  className={`p-1.5 rounded-lg transition-smooth ${
                                    globalIndex === goals.length - 1
                                      ? 'text-neutral-200 cursor-not-allowed'
                                      : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                                  }`}
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Checkbox */}
                            <button
                              onClick={() => toggleComplete(goal.id!)}
                              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-smooth ${
                                goal.isCompleted
                                  ? 'bg-success text-white'
                                  : 'bg-neutral-100 border-2 border-neutral-200 hover:border-accent'
                              } ${!editMode ? 'ml-auto' : ''}`}
                            >
                              {goal.isCompleted && <CheckCircleIcon className="w-6 h-6" />}
                            </button>
                          </div>

                          {/* Title */}
                          <div>
                            <div className="flex items-start space-x-2">
                              <h3 className={`text-lg font-bold flex-1 ${
                                goal.isCompleted ? 'text-success line-through' : 'text-neutral-900'
                              }`}>
                                {goal.title}
                              </h3>
                              {goal.description && (
                                <button
                                  onClick={() => goal.id && toggleExpanded(goal.id)}
                                  className="p-1 hover:bg-accent/10 rounded-lg transition-smooth flex-shrink-0"
                                  title={expandedGoals.has(goal.id!) ? 'Hide details' : 'Show details'}
                                >
                                  <ChevronDownIcon 
                                    className={`w-4 h-4 text-accent transition-transform ${
                                      expandedGoals.has(goal.id!) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {goal.description && expandedGoals.has(goal.id!) && (
                            <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                              {goal.description}
                            </p>
                          )}
                          
                          {/* Meta Info */}
                          <div className="flex flex-col gap-2">
                            <span
                              className="px-3 py-1 rounded-full font-semibold text-xs inline-block w-fit"
                              style={{ 
                                backgroundColor: `${goal.color}20`,
                                color: goal.color,
                                border: `1px solid ${goal.color}40`
                              }}
                            >
                              {goal.category}
                            </span>
                            {goal.targetDate && (
                              <span className="text-xs text-neutral-500">
                                <span className="font-medium">Target:</span>{' '}
                                <span className="font-semibold text-neutral-700">
                                  {new Date(goal.targetDate).toLocaleDateString()}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Progress - Percentage Mode */}
                          {!goal.isCompleted && (
                            <div className="pt-3 border-t border-neutral-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-neutral-600">Progress</span>
                                <span className="text-sm font-bold text-accent">{goal.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2 shadow-inner mb-2">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                                  style={{ width: `${goal.progress || 0}%` }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={goal.progress || 0}
                                onChange={(e) => goal.id && updateProgress(goal.id, parseInt(e.target.value))}
                                className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-accent"
                              />
                            </div>
                          )}

                          {/* Edit/Delete Buttons - Only in Edit Mode */}
                          {editMode && (
                            <div className="pt-3 border-t border-neutral-200 flex gap-2">
                              <button
                                onClick={() => openEditModal(goal)}
                                className="flex-1 px-3 py-2 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-smooth"
                              >
                                Edit Goal
                              </button>
                              <button
                                onClick={() => goal.id && handleDelete(goal.id)}
                                className="px-3 py-2 text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 rounded-lg transition-smooth"
                                title="Delete goal"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {editingGoal ? 'Edit Goal' : 'New Year Goal'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Launch my own business"
                    required
                    className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your goal..."
                    rows={3}
                    className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                  />
                </div>

                {/* Category and Target Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const cat = categories.find(c => c.name === e.target.value);
                        setFormData({ 
                          ...formData, 
                          category: e.target.value,
                          color: cat?.color || '#3B82F6'
                        });
                      }}
                      className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-smooth"
                    >
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                    />
                  </div>
                </div>

                {/* Tracking Mode */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Progress Tracking
                  </label>
                  <select
                    value={formData.trackingMode}
                    onChange={(e) => setFormData({ ...formData, trackingMode: e.target.value as 'percentage' | 'count' })}
                    className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-smooth"
                  >
                    <option value="percentage">Percentage (0-100%)</option>
                    <option value="count">Count (e.g., 175 workouts)</option>
                  </select>
                </div>

                {/* Count Target (only in count mode) */}
                {formData.trackingMode === 'count' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                      Target Count *
                    </label>
                    <input
                      type="number"
                      value={formData.targetCount}
                      onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) || 0 })}
                      placeholder="e.g., 175"
                      min="1"
                      required={formData.trackingMode === 'count'}
                      className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                    />
                    <p className="text-xs text-neutral-400 mt-1">
                      Total number you want to achieve (e.g., 175 workouts this year)
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 border-2 border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl transition-smooth font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft font-medium"
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
