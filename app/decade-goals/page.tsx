'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, SparklesIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

interface DecadeGoal {
  id?: number;
  title: string;
  description: string;
  category: string;
  milestones: string[];
  isCompleted: boolean;
  color: string;
}

const categories = [
  { name: 'Career & Business', color: '#3B82F6' },
  { name: 'Health & Fitness', color: '#10B981' },
  { name: 'Financial Freedom', color: '#F59E0B' },
  { name: 'Relationships & Family', color: '#EF4444' },
  { name: 'Personal Mastery', color: '#8B5CF6' },
  { name: 'Impact & Legacy', color: '#06B6D4' },
];

export default function DecadeGoalsPage() {
  const [goals, setGoals] = useState<DecadeGoal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DecadeGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Career & Business',
    milestones: ['', '', ''],
    color: '#3B82F6',
  });

  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + 10;

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
      const response = await fetch('/api/decade-goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch decade goals:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredMilestones = formData.milestones.filter(m => m.trim() !== '');
    
    try {
      if (editingGoal) {
        await fetch(`/api/decade-goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            milestones: filteredMilestones,
            isCompleted: editingGoal.isCompleted,
          }),
        });
      } else {
        await fetch('/api/decade-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            milestones: filteredMilestones,
            isCompleted: false,
          }),
        });
      }
      
      fetchGoals();
      setShowModal(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        category: 'Career & Business',
        milestones: ['', '', ''],
        color: '#3B82F6',
      });
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this 10-year goal?')) {
      try {
        await fetch(`/api/decade-goals/${id}`, { method: 'DELETE' });
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
      await fetch(`/api/decade-goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          isCompleted: !goal.isCompleted,
        }),
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to toggle completion:', error);
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
      await fetch('/api/decade-goals/reorder', {
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
      category: 'Career & Business',
      milestones: ['', '', ''],
      color: '#3B82F6',
    });
    setShowModal(true);
  };

  const openEditModal = (goal: DecadeGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      milestones: [...goal.milestones, '', ''].slice(0, 3),
      color: goal.color,
    });
    setShowModal(true);
  };

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = value;
    setFormData({ ...formData, milestones: newMilestones });
  };

  const completedGoals = goals.filter(g => g.isCompleted).length;
  const totalGoals = goals.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="relative mb-16">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent-light via-accent to-accent-dark rounded-full blur-3xl opacity-30"></div>
          
          <div className="text-center relative z-10">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <SparklesIcon className="w-10 h-10 text-accent" />
              <h1 className="text-5xl font-semibold text-neutral-900">
                10-Year Vision
              </h1>
              <SparklesIcon className="w-10 h-10 text-accent" />
            </div>
            <p className="text-2xl text-neutral-600">
              Where do you see yourself in{' '}
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
                {targetYear}
              </span>
              ?
            </p>
            <p className="text-sm text-neutral-400 mt-2">Think big. Dream bigger.</p>
          </div>
        </div>

        {/* Stats Cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-neutral-900 mb-1">{totalGoals}</div>
              <div className="text-sm text-neutral-500">Big Goals</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center">
              <div className="text-3xl font-semibold text-success mb-1">{completedGoals}</div>
              <div className="text-sm text-neutral-500">Achieved</div>
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
            <span>New 10-Year Goal</span>
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
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-xl text-neutral-600 mb-2 font-medium">Define Your Decade</p>
              <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                Set ambitious goals that will transform your life over the next 10 years
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className={`bg-white rounded-xl shadow-soft border-2 transition-smooth hover:shadow-medium ${
                  goal.isCompleted 
                    ? 'border-success/40 bg-gradient-to-br from-success/5 to-success/10' 
                    : 'border-neutral-200 hover:border-accent/30'
                }`}
              >
                {/* Vertical Card Layout */}
                <div className="p-5 space-y-3">
                  {/* Header with Complete Checkbox */}
                  <div className="flex items-start justify-between">
                    {editMode && (
                      <div className="flex items-center space-x-2">
                        {/* Reorder Buttons - Only in Edit Mode */}
                        <button
                          onClick={() => moveGoalUp(index)}
                          disabled={index === 0}
                          className={`p-1.5 rounded-lg transition-smooth ${
                            index === 0
                              ? 'text-neutral-200 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                          }`}
                          title="Move up"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveGoalDown(index)}
                          disabled={index === goals.length - 1}
                          className={`p-1.5 rounded-lg transition-smooth ${
                            index === goals.length - 1
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
                      <h3 className={`text-xl font-bold flex-1 ${
                        goal.isCompleted ? 'text-success line-through' : 'text-neutral-900'
                      }`}>
                        {goal.title}
                      </h3>
                      {(goal.description || goal.milestones.length > 0) && (
                        <button
                          onClick={() => goal.id && toggleExpanded(goal.id)}
                          className="p-1 hover:bg-accent/10 rounded-lg transition-smooth flex-shrink-0"
                          title={expandedGoals.has(goal.id!) ? 'Hide details' : 'Show details'}
                        >
                          <ChevronDownIcon 
                            className={`w-5 h-5 text-accent transition-transform ${
                              expandedGoals.has(goal.id!) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  <div>
                    <span
                      className="inline-block px-3 py-1 rounded-full font-semibold text-xs"
                      style={{ 
                        backgroundColor: `${goal.color}20`,
                        color: goal.color,
                        border: `1px solid ${goal.color}40`
                      }}
                    >
                      {goal.category}
                    </span>
                  </div>
                  
                  {/* Description - Expandable */}
                  {goal.description && expandedGoals.has(goal.id!) && (
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">Vision</p>
                      <p className="text-xs text-neutral-700 leading-relaxed">{goal.description}</p>
                    </div>
                  )}
                  
                  {/* Milestones - Expandable */}
                  {goal.milestones.length > 0 && expandedGoals.has(goal.id!) && (
                    <div className="pt-3 border-t border-neutral-200">
                      <h4 className="text-xs font-semibold text-neutral-700 mb-3 flex items-center space-x-2">
                        <span>Key Milestones</span>
                        <span className="text-xs text-neutral-400">({goal.milestones.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start space-x-2.5 p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <p className="text-xs text-neutral-700 flex-1 pt-0.5 leading-relaxed">{milestone}</p>
                          </div>
                        ))}
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
            ))}
          </div>
        )}

        {/* Inspirational Quote */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-accent/10 to-accent-dark/10 rounded-2xl p-8 border border-accent/20">
            <p className="text-lg italic text-neutral-700 mb-2">
              "The best time to plant a tree was 20 years ago. The second best time is now."
            </p>
            <p className="text-sm text-neutral-500">— Chinese Proverb</p>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {editingGoal ? 'Edit 10-Year Goal' : 'New 10-Year Goal'}
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
                    placeholder="e.g., Build a multi-million dollar company"
                    required
                    className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Vision Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Paint a vivid picture of what achieving this goal looks like..."
                    rows={4}
                    required
                    className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Life Area
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

                {/* Milestones */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                    Key Milestones (Optional)
                  </label>
                  <p className="text-xs text-neutral-400 mb-3">Break down your 10-year goal into major checkpoints</p>
                  <div className="space-y-3">
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        value={formData.milestones[index]}
                        onChange={(e) => updateMilestone(index, e.target.value)}
                        placeholder={`Milestone ${index + 1}`}
                        className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-smooth"
                      />
                    ))}
                  </div>
                </div>

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
