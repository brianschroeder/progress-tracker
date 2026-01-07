'use client';

import React, { useEffect, useState } from 'react';
import { WorkGoal, WorkTodo } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/solid';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

export default function WorkPage() {
  const [workGoals, setWorkGoals] = useState<WorkGoal[]>([]);
  const [workTodos, setWorkTodos] = useState<{ [key: number]: WorkTodo[] }>({});
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WorkGoal | null>(null);
  const [editingTodo, setEditingTodo] = useState<WorkTodo | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    color: '#3B82F6',
  });
  const [todoFormData, setTodoFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const goalsRes = await fetch('/api/work-goals');
      const goalsData = await goalsRes.json();
      setWorkGoals(goalsData);

      // Fetch todos for each goal
      const todosData: { [key: number]: WorkTodo[] } = {};
      for (const goal of goalsData) {
        if (goal.id) {
          const todosRes = await fetch(`/api/work-todos?workGoalId=${goal.id}`);
          const todos = await todosRes.json();
          todosData[goal.id] = todos;
        }
      }
      setWorkTodos(todosData);

      // Expand all goals by default
      setExpandedGoals(new Set(goalsData.map((g: WorkGoal) => g.id).filter(Boolean)));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Goal handlers
  function openAddGoalModal() {
    setEditingGoal(null);
    setGoalFormData({
      title: '',
      description: '',
      targetDate: '',
      priority: 'medium',
      color: '#3B82F6',
    });
    setIsGoalModalOpen(true);
  }

  function openEditGoalModal(goal: WorkGoal) {
    setEditingGoal(goal);
    setGoalFormData({
      title: goal.title,
      description: goal.description || '',
      targetDate: goal.targetDate || '',
      priority: goal.priority,
      color: goal.color,
    });
    setIsGoalModalOpen(true);
  }

  async function handleGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingGoal) {
        const response = await fetch(`/api/work-goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...goalFormData,
            isCompleted: editingGoal.isCompleted,
            sortOrder: editingGoal.sortOrder,
          }),
        });
        const updated = await response.json();
        setWorkGoals(workGoals.map((g) => (g.id === updated.id ? updated : g)));
      } else {
        const response = await fetch('/api/work-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...goalFormData,
            isCompleted: false,
            sortOrder: workGoals.length,
          }),
        });
        const newGoal = await response.json();
        setWorkGoals([...workGoals, newGoal]);
        setWorkTodos({ ...workTodos, [newGoal.id]: [] });
      }
      setIsGoalModalOpen(false);
    } catch (error) {
      console.error('Failed to save work goal:', error);
    }
  }

  async function toggleGoalComplete(goal: WorkGoal) {
    if (!goal.id) return;
    try {
      const response = await fetch(`/api/work-goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          isCompleted: !goal.isCompleted,
        }),
      });
      const updated = await response.json();
      setWorkGoals(workGoals.map((g) => (g.id === updated.id ? updated : g)));
    } catch (error) {
      console.error('Failed to toggle goal completion:', error);
    }
  }

  async function deleteGoal(id: number) {
    if (!confirm('Are you sure you want to delete this work goal and all its todos?')) return;
    try {
      await fetch(`/api/work-goals/${id}`, { method: 'DELETE' });
      setWorkGoals(workGoals.filter((g) => g.id !== id));
      const newTodos = { ...workTodos };
      delete newTodos[id];
      setWorkTodos(newTodos);
    } catch (error) {
      console.error('Failed to delete work goal:', error);
    }
  }

  // Todo handlers
  function openAddTodoModal(goalId: number) {
    setSelectedGoalId(goalId);
    setEditingTodo(null);
    setTodoFormData({
      title: '',
      description: '',
    });
    setIsTodoModalOpen(true);
  }

  function openEditTodoModal(todo: WorkTodo) {
    setSelectedGoalId(todo.workGoalId);
    setEditingTodo(todo);
    setTodoFormData({
      title: todo.title,
      description: todo.description || '',
    });
    setIsTodoModalOpen(true);
  }

  async function handleTodoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGoalId) return;

    try {
      if (editingTodo) {
        const response = await fetch(`/api/work-todos/${editingTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...todoFormData,
            workGoalId: selectedGoalId,
            isCompleted: editingTodo.isCompleted,
            sortOrder: editingTodo.sortOrder,
          }),
        });
        const updated = await response.json();
        setWorkTodos({
          ...workTodos,
          [selectedGoalId]: workTodos[selectedGoalId].map((t) =>
            t.id === updated.id ? updated : t
          ),
        });
      } else {
        const goalTodos = workTodos[selectedGoalId] || [];
        const response = await fetch('/api/work-todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...todoFormData,
            workGoalId: selectedGoalId,
            isCompleted: false,
            sortOrder: goalTodos.length,
          }),
        });
        const newTodo = await response.json();
        setWorkTodos({
          ...workTodos,
          [selectedGoalId]: [...goalTodos, newTodo],
        });
      }
      setIsTodoModalOpen(false);
    } catch (error) {
      console.error('Failed to save work todo:', error);
    }
  }

  async function toggleTodoComplete(todo: WorkTodo) {
    if (!todo.id) return;
    try {
      const response = await fetch(`/api/work-todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todo,
          isCompleted: !todo.isCompleted,
        }),
      });
      const updated = await response.json();
      setWorkTodos({
        ...workTodos,
        [todo.workGoalId]: workTodos[todo.workGoalId].map((t) =>
          t.id === updated.id ? updated : t
        ),
      });
    } catch (error) {
      console.error('Failed to toggle todo completion:', error);
    }
  }

  async function deleteTodo(todo: WorkTodo) {
    if (!todo.id || !confirm('Are you sure you want to delete this todo?')) return;
    try {
      await fetch(`/api/work-todos/${todo.id}`, { method: 'DELETE' });
      setWorkTodos({
        ...workTodos,
        [todo.workGoalId]: workTodos[todo.workGoalId].filter((t) => t.id !== todo.id),
      });
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  }

  function toggleGoalExpansion(goalId: number) {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const getNextWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Work Goals</h1>
          <p className="text-gray-600">Manage your work goals and tasks for the upcoming week</p>
        </div>

        {/* Add Goal Button */}
        <div className="mb-6">
          <Button onClick={openAddGoalModal} className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Work Goal
          </Button>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {workGoals.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No work goals yet. Add your first goal to get started!</p>
            </div>
          ) : (
            workGoals.map((goal) => {
              if (!goal.id) return null;
              const todos = workTodos[goal.id] || [];
              const isExpanded = expandedGoals.has(goal.id);
              const completedTodos = todos.filter((t) => t.isCompleted).length;
              const totalTodos = todos.length;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-lg shadow overflow-hidden"
                  style={{ borderLeft: `4px solid ${priorityColors[goal.priority]}` }}
                >
                  {/* Goal Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleGoalComplete(goal)}
                          className="mt-1"
                        >
                          <CheckCircleIcon
                            className={`w-6 h-6 ${
                              goal.isCompleted
                                ? 'text-green-500'
                                : 'text-gray-300 hover:text-gray-400'
                            }`}
                          />
                        </button>
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-semibold ${
                              goal.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            {goal.targetDate && (
                              <span className="text-gray-500">
                                Due: {new Date(goal.targetDate).toLocaleDateString()}
                              </span>
                            )}
                            <span className="text-gray-500">
                              {completedTodos}/{totalTodos} todos completed
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: priorityColors[goal.priority] }}
                            >
                              {goal.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleGoalExpansion(goal.id!)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditGoalModal(goal)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <PencilIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id!)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <TrashIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Todos Section */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Tasks</h4>
                        <Button
                          onClick={() => openAddTodoModal(goal.id!)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Task
                        </Button>
                      </div>

                      {todos.length === 0 ? (
                        <p className="text-gray-500 text-sm">No tasks yet</p>
                      ) : (
                        <div className="space-y-2">
                          {todos.map((todo) => (
                            <div
                              key={todo.id}
                              className="flex items-start gap-2 bg-white p-3 rounded border border-gray-200"
                            >
                              <button
                                onClick={() => toggleTodoComplete(todo)}
                                className="mt-0.5"
                              >
                                <CheckCircleIcon
                                  className={`w-5 h-5 ${
                                    todo.isCompleted
                                      ? 'text-green-500'
                                      : 'text-gray-300 hover:text-gray-400'
                                  }`}
                                />
                              </button>
                              <div className="flex-1">
                                <p
                                  className={`text-sm ${
                                    todo.isCompleted
                                      ? 'line-through text-gray-400'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {todo.title}
                                </p>
                                {todo.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {todo.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditTodoModal(todo)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <PencilIcon className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => deleteTodo(todo)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Edit Work Goal' : 'Add Work Goal'}
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              value={goalFormData.title}
              onChange={(e) =>
                setGoalFormData({ ...goalFormData, title: e.target.value })
              }
              placeholder="e.g., Complete Q1 Report"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={goalFormData.description}
              onChange={(e) =>
                setGoalFormData({ ...goalFormData, description: e.target.value })
              }
              placeholder="Add details about this goal..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <Input
              type="date"
              value={goalFormData.targetDate}
              onChange={(e) =>
                setGoalFormData({ ...goalFormData, targetDate: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={goalFormData.priority}
              onChange={(e) =>
                setGoalFormData({
                  ...goalFormData,
                  priority: e.target.value as 'low' | 'medium' | 'high',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGoalFormData({ ...goalFormData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      goalFormData.color === color
                        ? 'border-gray-900'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingGoal ? 'Save Changes' : 'Add Goal'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGoalModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Todo Modal */}
      <Modal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        title={editingTodo ? 'Edit Task' : 'Add Task'}
      >
        <form onSubmit={handleTodoSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              value={todoFormData.title}
              onChange={(e) =>
                setTodoFormData({ ...todoFormData, title: e.target.value })
              }
              placeholder="e.g., Review draft with team"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={todoFormData.description}
              onChange={(e) =>
                setTodoFormData({ ...todoFormData, description: e.target.value })
              }
              placeholder="Add details about this task..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingTodo ? 'Save Changes' : 'Add Task'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTodoModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
