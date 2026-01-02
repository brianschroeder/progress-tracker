'use client';

import React, { useEffect, useState } from 'react';
import { Goal, Category } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DaySelector } from '@/components/DaySelector';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDaysPerWeek: 3,
    daysOfWeek: [] as number[],
    categoryId: undefined as number | undefined,
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [goalsRes, categoriesRes] = await Promise.all([
        fetch('/api/goals?active=true'),
        fetch('/api/categories'),
      ]);

      const goalsData = await goalsRes.json();
      const categoriesData = await categoriesRes.json();

      setGoals(goalsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingGoal(null);
    setFormData({ 
      name: '', 
      description: '',
      targetDaysPerWeek: 3, 
      daysOfWeek: [], 
      categoryId: undefined, 
      color: '#3B82F6' 
    });
    setIsModalOpen(true);
  }

  function openEditModal(goal: Goal) {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      targetDaysPerWeek: goal.targetDaysPerWeek,
      daysOfWeek: goal.daysOfWeek || [],
      categoryId: goal.categoryId,
      color: goal.color,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingGoal) {
        await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...formData, 
            isActive: editingGoal.isActive, 
            sortOrder: editingGoal.sortOrder, 
            icon: 'target'
          }),
        });
      } else {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...formData, 
            isActive: true, 
            sortOrder: goals.length, 
            icon: 'target'
          }),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  }

  async function handleDelete(goalId: number) {
    if (!confirm('Are you sure you want to delete this goal? This will also delete all associated completions.')) return;
    try {
      await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  }

  async function moveGoalUp(index: number) {
    if (index === 0) return;
    const newGoals = [...goals];
    [newGoals[index], newGoals[index - 1]] = [newGoals[index - 1], newGoals[index]];
    setGoals(newGoals);
    await reorderGoals(newGoals);
  }

  async function moveGoalDown(index: number) {
    if (index === goals.length - 1) return;
    const newGoals = [...goals];
    [newGoals[index], newGoals[index + 1]] = [newGoals[index + 1], newGoals[index]];
    setGoals(newGoals);
    await reorderGoals(newGoals);
  }

  async function reorderGoals(reorderedGoals: Goal[]) {
    try {
      const goalIds = reorderedGoals.map(g => g.id!);
      await fetch('/api/goals/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds }),
      });
    } catch (error) {
      console.error('Failed to reorder goals:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Centered Header */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
            Manage Your Goals
          </h1>
          <p className="text-xl text-neutral-600">
            Plan your{' '}
            <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
              weekly schedule
            </span>
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <button 
            onClick={openAddModal} 
            className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft hover:shadow-medium font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Goals List */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
          {goals.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-neutral-400 mb-6 text-base">No goals yet</p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Your First Goal</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {goals.map((goal, index) => (
                <div key={goal.id} className="p-6 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {/* Minimalist Reorder buttons */}
                    <div className="flex flex-col space-y-1 pt-1">
                      <button
                        onClick={() => moveGoalUp(index)}
                        disabled={index === 0}
                        className={`p-1.5 rounded-lg transition-smooth ${
                          index === 0
                            ? 'text-neutral-200 cursor-not-allowed'
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
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
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
                        }`}
                        title="Move down"
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Goal info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: goal.color }} />
                        <h3 className="text-lg font-semibold text-neutral-900">{goal.name}</h3>
                      </div>
                      
                      {goal.description && (
                        <p className="text-sm text-neutral-500 mb-3">{goal.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-neutral-400">Target:</span>
                          <span className="font-medium text-neutral-700">{goal.targetDaysPerWeek} days/week</span>
                        </div>
                        {goal.daysOfWeek && goal.daysOfWeek.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-neutral-400">Schedule:</span>
                            <div className="flex space-x-0.5">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-md font-semibold ${
                                    goal.daysOfWeek?.includes(idx)
                                      ? 'bg-accent/20 text-accent'
                                      : 'bg-neutral-100 text-neutral-300'
                                  }`}
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {goal.categoryId && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-neutral-400">Category:</span>
                            <span className="font-medium text-neutral-700">
                              {categories.find(c => c.id === goal.categoryId)?.name || 'Unknown'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clean Action buttons */}
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => openEditModal(goal)} 
                        className="p-2.5 hover:bg-neutral-100 rounded-xl transition-smooth"
                        title="Edit goal"
                      >
                        <PencilIcon className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button 
                        onClick={() => handleDelete(goal.id!)} 
                        className="p-2.5 hover:bg-danger/10 rounded-xl transition-smooth"
                        title="Delete goal"
                      >
                        <TrashIcon className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Goal Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingGoal ? 'Edit Goal' : 'New Goal'} 
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Name - Clean Design */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
              Goal Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Exercise, Reading, Meditation"
              required
              className="text-base text-neutral-900 font-medium"
            />
          </div>

          {/* Description - Minimal */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
              Description <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              className="text-base text-neutral-900"
            />
          </div>

          {/* Target Days - Clean */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
              Target Days Per Week *
            </label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                min="1"
                max="7"
                value={formData.targetDaysPerWeek}
                onChange={(e) => setFormData({ ...formData, targetDaysPerWeek: parseInt(e.target.value) })}
                required
                className="w-20 text-2xl font-semibold text-center text-neutral-900"
              />
              <span className="text-neutral-500 font-medium text-sm">days per week</span>
            </div>
          </div>

          {/* Specific Days - Modern */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-3 uppercase tracking-wide">
              Weekly Schedule <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <DaySelector 
              selectedDays={formData.daysOfWeek} 
              onChange={(days) => setFormData({ ...formData, daysOfWeek: days })} 
            />
            <p className="text-xs text-neutral-400 mt-2">
              Select specific days to highlight on your calendar
            </p>
          </div>

          {/* Category and Color Row - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                Category
              </label>
              <select
                className="w-full h-11 rounded-xl border-2 border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 font-medium focus:border-accent focus:ring-2 focus:ring-accent/20 transition-smooth"
                value={formData.categoryId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  categoryId: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              >
                <option value="">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <Input 
                  type="color" 
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                  className="h-11 w-14 cursor-pointer border-2" 
                />
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-neutral-200 shadow-sm" 
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-xs font-mono text-neutral-500 font-medium">{formData.color}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Minimalist */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="px-6 bg-accent hover:bg-accent-light"
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
