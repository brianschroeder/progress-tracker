'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, CheckCircleIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, ChevronUpIcon, Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DecadeGoal {
  id?: number;
  title: string;
  description: string;
  category: string;
  milestones: string[];
  isCompleted: boolean;
  color: string;
  sortOrder?: number;
}

const categories = [
  { name: 'Career & Business', color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Health & Fitness', color: '#10B981', gradient: 'from-green-500 to-emerald-600' },
  { name: 'Financial Freedom', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Relationships & Family', color: '#EF4444', gradient: 'from-red-500 to-pink-600' },
  { name: 'Personal Mastery', color: '#8B5CF6', gradient: 'from-purple-500 to-violet-600' },
  { name: 'Impact & Legacy', color: '#06B6D4', gradient: 'from-cyan-500 to-blue-500' },
];

export default function DecadeGoalsPage() {
  const [goals, setGoals] = useState<DecadeGoal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DecadeGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<DecadeGoal | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Career & Business',
    milestones: ['', '', '', ''],
    color: '#3B82F6',
  });

  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + 10;

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
      resetForm();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await fetch(`/api/decade-goals/${id}`, { method: 'DELETE' });
        fetchGoals();
        setSelectedGoal(null);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const toggleComplete = async (goal: DecadeGoal) => {
    try {
      await fetch(`/api/decade-goals/${goal.id}`, {
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

  const toggleExpanded = (goalId: number) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const openAddModal = () => {
    setEditingGoal(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (goal: DecadeGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      milestones: [...goal.milestones, '', '', '', ''].slice(0, 4),
      color: goal.color,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Career & Business',
      milestones: ['', '', '', ''],
      color: '#3B82F6',
    });
  };

  const getCategoryInfo = (categoryName: string) => {
    return categories.find(c => c.name === categoryName) || categories[0];
  };

  const completedGoals = goals.filter(g => g.isCompleted).length;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = goals.findIndex((goal) => goal.id === active.id);
      const newIndex = goals.findIndex((goal) => goal.id === over.id);

      const newGoals = arrayMove(goals, oldIndex, newIndex);
      setGoals(newGoals);

      // Update order in backend
      try {
        await fetch('/api/decade-goals/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalIds: newGoals.map(g => g.id) }),
        });
      } catch (error) {
        console.error('Failed to reorder goals:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-accent rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-slate-700 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/5 sticky top-0">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white tracking-wide mb-1">
                10-Year Vision
              </h1>
              <p className="text-white/50 text-sm font-light">
                {currentYear} — {targetYear}
              </p>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-2xl font-light text-white/90">{goals.length}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Goals</div>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="text-right">
                <div className="text-2xl font-light text-white/90">{completedGoals}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Complete</div>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div className="flex gap-3">
                <button
                  onClick={openAddModal}
                  className="px-6 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-all duration-200 text-sm font-medium"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-6 py-2 rounded-lg backdrop-blur-sm transition-all duration-200 text-sm font-medium ${
                    editMode 
                      ? 'bg-white/20 text-white border border-white/20' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {editMode ? 'Done' : 'Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-white/60 text-lg">Loading...</div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-3xl font-light text-white mb-3 tracking-wide">No Goals Yet</h3>
            <p className="text-lg text-white/50 mb-12 font-light">Define your 10-year vision</p>
            <button
              onClick={openAddModal}
              className="px-8 py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-all duration-200 text-sm font-medium"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={goals.map(g => g.id!)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {goals.map((goal) => (
                  <SortableGoalCard
                    key={goal.id}
                    goal={goal}
                    categoryInfo={getCategoryInfo(goal.category)}
                    expandedGoals={expandedGoals}
                    toggleExpanded={toggleExpanded}
                    toggleComplete={toggleComplete}
                    openEditModal={openEditModal}
                    handleDelete={handleDelete}
                    editMode={editMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 animate-scale-in">
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-light text-white tracking-wide">
                  {editingGoal ? 'Edit Goal' : 'New Goal'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Achieve $1 million net worth"
                    required
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all duration-200 text-white placeholder-white/30 font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your vision..."
                    required
                    rows={4}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all duration-200 resize-none text-white placeholder-white/30 font-light leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
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
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all duration-200 text-white font-light cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-neutral-900 py-2">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                    Milestones
                  </label>
                  <div className="space-y-2">
                    {formData.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-white/10 rounded-md flex items-center justify-center text-white/50 text-xs font-medium">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={milestone}
                          onChange={(e) => {
                            const newMilestones = [...formData.milestones];
                            newMilestones[index] = e.target.value;
                            setFormData({ ...formData, milestones: newMilestones });
                          }}
                          placeholder={`Milestone ${index + 1}`}
                          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all duration-200 text-white placeholder-white/30 font-light text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingGoal(null);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium text-sm border border-white/20"
                  >
                    {editingGoal ? 'Save Changes' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sortable Goal Card Component
function SortableGoalCard({
  goal,
  categoryInfo,
  expandedGoals,
  toggleExpanded,
  toggleComplete,
  openEditModal,
  handleDelete,
  editMode,
}: {
  goal: any;
  categoryInfo: any;
  expandedGoals: Set<number>;
  toggleExpanded: (id: number) => void;
  toggleComplete: (goal: any) => void;
  openEditModal: (goal: any) => void;
  handleDelete: (id: number) => void;
  editMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white/5 backdrop-blur-sm rounded-xl border transition-all duration-200 overflow-hidden ${
        goal.isCompleted
          ? 'border-white/20 bg-white/10'
          : 'border-white/10 hover:border-white/20 hover:bg-white/10'
      } ${isDragging ? 'shadow-2xl z-50' : ''}`}
    >
      {/* Goal Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 transition-colors p-1 -ml-1"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div className="flex-1">
            {/* Category Badge */}
            <div className="mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${categoryInfo.color}20`,
                  color: categoryInfo.color,
                  border: `1px solid ${categoryInfo.color}40`,
                }}
              >
                {goal.category}
              </span>
            </div>
            <h3 className={`text-base font-medium leading-snug ${
              goal.isCompleted ? 'text-white/60 line-through' : 'text-white'
            }`}>
              {goal.title}
            </h3>
          </div>
          <button
            onClick={() => toggleComplete(goal)}
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
              goal.isCompleted
                ? 'bg-white/20 border-white/40'
                : 'border-white/30 hover:border-white/50'
            }`}
          >
            {goal.isCompleted && (
              <CheckCircleIcon className="w-full h-full text-white" />
            )}
          </button>
        </div>

        {/* Description Preview */}
        <p className="text-sm text-white/50 leading-relaxed line-clamp-2 mb-4">
          {goal.description}
        </p>

        {/* Milestones Count */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/40">
            {goal.milestones.length} milestone{goal.milestones.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => goal.id && toggleExpanded(goal.id)}
            className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1 transition-colors"
          >
            {expandedGoals.has(goal.id!) ? (
              <>
                Less
                <ChevronUpIcon className="w-3 h-3" />
              </>
            ) : (
              <>
                More
                <ChevronDownIcon className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expandedGoals.has(goal.id!) && (
        <div className="border-t border-white/10 bg-white/5 p-5 space-y-3">
          <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
            Milestones
          </div>
          <div className="space-y-2">
            {goal.milestones.map((milestone: string, index: number) => (
              <div key={index} className="flex items-start gap-2 text-sm text-white/70">
                <div className="flex-shrink-0 w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-xs text-white/60 mt-0.5">
                  {index + 1}
                </div>
                <span className="leading-relaxed">{milestone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Mode Actions */}
      {editMode && (
        <div className="border-t border-white/10 p-3 flex gap-2 bg-black/20">
          <button
            onClick={() => openEditModal(goal)}
            className="flex-1 px-4 py-2 text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => goal.id && handleDelete(goal.id)}
            className="px-4 py-2 text-xs font-medium text-white/80 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
