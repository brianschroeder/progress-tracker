'use client';

import React, { useEffect, useState } from 'react';
import { WorkGoal, WorkTodo } from '@/types';
import {
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  PlayIcon,
  PauseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeSlashIcon,
  EyeIcon,
  ArchiveBoxIcon 
} from '@heroicons/react/24/solid';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Comments } from '@/components/Comments';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [showFinished, setShowFinished] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      // Start with all goals collapsed
      setExpandedGoals(new Set());
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
          inProgress: editingGoal.inProgress ?? false,
          isHidden: editingGoal.isHidden ?? false,
          isArchived: editingGoal.isArchived ?? false,
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
          inProgress: false,
          isHidden: false,
          isArchived: false,
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
          inProgress: false,
        }),
      });
      const updated = await response.json();
      setWorkGoals(workGoals.map((g) => (g.id === updated.id ? updated : g)));
    } catch (error) {
      console.error('Failed to toggle goal completion:', error);
    }
  }

  async function toggleGoalHidden(goal: WorkGoal) {
    if (!goal.id) return;
    try {
      const response = await fetch(`/api/work-goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          isHidden: !goal.isHidden,
        }),
      });
      const updated = await response.json();
      setWorkGoals(workGoals.map((g) => (g.id === updated.id ? updated : g)));
    } catch (error) {
      console.error('Failed to toggle goal hidden status:', error);
    }
  }

  async function archiveGoal(goal: WorkGoal) {
    if (!goal.id || !confirm('Archive this goal? It will be removed from the dashboard but kept in the database.')) return;
    try {
      const response = await fetch(`/api/work-goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          isArchived: true,
        }),
      });
      const updated = await response.json();
      // Remove from local state since it's archived
      setWorkGoals(workGoals.filter((g) => g.id !== goal.id));
      // Also remove its todos from local state
      const newTodos = { ...workTodos };
      delete newTodos[goal.id];
      setWorkTodos(newTodos);
    } catch (error) {
      console.error('Failed to archive goal:', error);
    }
  }

  async function toggleGoalInProgress(goal: WorkGoal) {
    if (!goal.id) return;
    const nextInProgress = !goal.inProgress;
    try {
      const response = await fetch(`/api/work-goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...goal,
          inProgress: nextInProgress,
          isCompleted: nextInProgress ? false : goal.isCompleted,
        }),
      });
      const updated = await response.json();
      setWorkGoals(workGoals.map((g) => (g.id === updated.id ? updated : g)));
    } catch (error) {
      console.error('Failed to toggle goal in progress:', error);
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
          inProgress: editingTodo.inProgress ?? false,
          isHidden: editingTodo.isHidden ?? false,
          isArchived: editingTodo.isArchived ?? false,
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
          inProgress: false,
          isHidden: false,
          isArchived: false,
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
          inProgress: false,
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

  async function toggleTodoInProgress(todo: WorkTodo) {
    if (!todo.id) return;
    const nextInProgress = !todo.inProgress;
    try {
      const response = await fetch(`/api/work-todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todo,
          inProgress: nextInProgress,
          isCompleted: nextInProgress ? false : todo.isCompleted,
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
      console.error('Failed to toggle todo in progress:', error);
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

  async function toggleTodoHidden(todo: WorkTodo) {
    if (!todo.id) return;
    try {
      const response = await fetch(`/api/work-todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todo,
          isHidden: !todo.isHidden,
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
      console.error('Failed to toggle todo hidden status:', error);
    }
  }

  async function archiveTodo(todo: WorkTodo) {
    if (!todo.id || !confirm('Archive this task? It will be removed from the dashboard but kept in the database.')) return;
    try {
      await fetch(`/api/work-todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todo,
          isArchived: true,
        }),
      });
      // Remove from local state since it's archived
      setWorkTodos({
        ...workTodos,
        [todo.workGoalId]: workTodos[todo.workGoalId].filter((t) => t.id !== todo.id),
      });
    } catch (error) {
      console.error('Failed to archive todo:', error);
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

  async function syncWithJira(goalId?: number) {
    setSyncing(true);
    setSyncMessage('');
    
    try {
      const response = await fetch('/api/jira/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setSyncMessage(`Error: ${result.error}`);
        return;
      }
      
      // Refresh data to get updated JIRA info
      await fetchData();
      
      const message = [
        `Synced ${result.goalsSynced} goals (${result.goalsCreated} created, ${result.goalsUpdated} updated)`,
        `Synced ${result.todosSynced} tasks (${result.todosCreated} created, ${result.todosUpdated} updated)`,
      ];
      
      if (result.errors && result.errors.length > 0) {
        message.push(`Errors: ${result.errors.join('; ')}`);
      }
      
      setSyncMessage(message.join('. '));
      
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(''), 5000);
    } catch (error: any) {
      setSyncMessage(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeGoals = workGoals.filter(g => !g.isCompleted && !g.isHidden);
      const oldIndex = activeGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = activeGoals.findIndex((goal) => goal.id === over.id);

      const newActiveGoals = arrayMove(activeGoals, oldIndex, newIndex);
      const completedGoals = workGoals.filter(g => g.isCompleted);
      const hiddenGoals = workGoals.filter(g => g.isHidden);
      const newGoals = [...newActiveGoals, ...completedGoals, ...hiddenGoals];
      setWorkGoals(newGoals);

      // Update order in backend
      try {
        await fetch('/api/work-goals/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workGoalIds: newGoals.map(g => g.id) }),
        });
      } catch (error) {
        console.error('Failed to reorder work goals:', error);
      }
    }
  }

  async function handleTodoDragEnd(event: DragEndEvent, goalId: number) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const todos = workTodos[goalId] || [];
      const oldIndex = todos.findIndex((todo) => todo.id === active.id);
      const newIndex = todos.findIndex((todo) => todo.id === over.id);

      const newTodos = arrayMove(todos, oldIndex, newIndex);
      setWorkTodos({
        ...workTodos,
        [goalId]: newTodos,
      });

      // Update order in backend
      try {
        await fetch('/api/work-todos/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workTodoIds: newTodos.map(t => t.id) }),
        });
      } catch (error) {
        console.error('Failed to reorder work todos:', error);
      }
    }
  }

  // Sortable Todo Item Component
  function SortableTodoItem({ todo }: { todo: WorkTodo }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: todo.id! });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isInProgress = !!todo.inProgress && !todo.isCompleted;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex flex-col bg-white rounded border border-gray-200"
      >
        <div className="flex items-start gap-2 p-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing"
          >
            <Bars3Icon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
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
          <button
            onClick={() => toggleTodoInProgress(todo)}
            className="mt-0.5"
            title={isInProgress ? 'Mark not in progress' : 'Mark in progress'}
            disabled={todo.isCompleted}
          >
            {isInProgress ? (
              <PauseIcon className="w-5 h-5 text-blue-500" />
            ) : (
              <PlayIcon className={`w-5 h-5 ${todo.isCompleted ? 'text-gray-200' : 'text-gray-300 hover:text-gray-400'}`} />
            )}
          </button>
          <div className="flex-1">
            <p
              className={`text-sm flex items-center gap-2 ${
                todo.isCompleted
                  ? 'line-through text-gray-400'
                  : 'text-gray-900'
              }`}
            >
              {todo.title}
              {isInProgress && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  In Progress
                </span>
              )}
              {(todo as any).jiraIssueKey && (
                <a
                  href={(todo as any).jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-xs no-underline"
                  title={`View in JIRA: ${(todo as any).jiraIssueKey}`}
                >
                  [{(todo as any).jiraIssueKey}]
                </a>
              )}
            </p>
            {todo.description && (
              <p className="text-xs text-gray-500 mt-1">
                {todo.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleTodoHidden(todo)}
              className="p-1 hover:bg-gray-100 rounded"
              title={todo.isHidden ? 'Unhide from backlog' : 'Hide to backlog'}
            >
              {todo.isHidden ? (
                <EyeIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <EyeSlashIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => openEditTodoModal(todo)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <PencilIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => archiveTodo(todo)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Archive (remove from dashboard)"
            >
              <ArchiveBoxIcon className="w-4 h-4 text-orange-500" />
            </button>
            <button
              onClick={() => deleteTodo(todo)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
        <Comments todoId={todo.id} />
      </div>
    );
  }

  // Sortable Goal Card Component
  function SortableGoalCard({ goal }: { goal: WorkGoal }) {
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

    if (!goal.id) return null;
    const todos = workTodos[goal.id] || [];
    const isExpanded = expandedGoals.has(goal.id);
    const completedTodos = todos.filter((t) => t.isCompleted).length;
    const totalTodos = todos.length;
    const isInProgress = !!goal.inProgress && !goal.isCompleted;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg shadow overflow-hidden"
        data-goal-id={goal.id}
      >
        <div
          className="border-l-4"
          style={{ borderLeftColor: priorityColors[goal.priority] }}
        >
          {/* Goal Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <button
                  {...attributes}
                  {...listeners}
                  className="mt-1 cursor-grab active:cursor-grabbing"
                >
                  <Bars3Icon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
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
                <button
                  onClick={() => toggleGoalInProgress(goal)}
                  className="mt-1"
                  title={isInProgress ? 'Mark not in progress' : 'Mark in progress'}
                  disabled={goal.isCompleted}
                >
                  {isInProgress ? (
                    <PauseIcon className="w-6 h-6 text-blue-500" />
                  ) : (
                    <PlayIcon className={`w-6 h-6 ${goal.isCompleted ? 'text-gray-200' : 'text-gray-300 hover:text-gray-400'}`} />
                  )}
                </button>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold flex items-center gap-2 ${
                      goal.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {goal.title}
                    {isInProgress && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        In Progress
                      </span>
                    )}
                    {(goal as any).jiraIssueKey && (
                      <a
                        href={(goal as any).jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-normal no-underline"
                        title={`View in JIRA: ${(goal as any).jiraIssueKey}`}
                      >
                        [{(goal as any).jiraIssueKey}]
                      </a>
                    )}
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
                {isExpanded && (
                  <>
                    <button
                      onClick={() => toggleGoalHidden(goal)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title={goal.isHidden ? 'Unhide from backlog' : 'Hide to backlog'}
                    >
                      {goal.isHidden ? (
                        <EyeIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditGoalModal(goal)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <PencilIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => archiveGoal(goal)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Archive (remove from dashboard)"
                    >
                      <ArchiveBoxIcon className="w-5 h-5 text-orange-500" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id!)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <TrashIcon className="w-5 h-5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {isExpanded && <Comments goalId={goal.id} />}

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

              {todos.filter(t => !t.isHidden).length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks yet</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleTodoDragEnd(e, goal.id!)}
                >
                  <SortableContext
                    items={todos.filter(t => !t.isHidden).map(t => t.id!)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {todos.filter(t => !t.isHidden).map((todo) => (
                        <SortableTodoItem key={todo.id} todo={todo} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </div>
    );
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

  const allTodos = Object.values(workTodos).flat();
  const goalTitleById = new Map(workGoals.map((goal) => [goal.id, goal.title]));
  const goalOrderById = new Map(workGoals.map((goal) => [goal.id, goal.sortOrder ?? 0]));
  const inProgressTodos = allTodos
    .filter((todo) => todo.inProgress && !todo.isCompleted && !todo.isHidden)
    .sort((a, b) => {
      const goalOrderDiff = (goalOrderById.get(a.workGoalId) ?? 0) - (goalOrderById.get(b.workGoalId) ?? 0);
      if (goalOrderDiff !== 0) return goalOrderDiff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Work Goals</h1>
          <p className="text-gray-600">Manage your work goals and tasks for the upcoming week</p>
        </div>

        {/* Add Goal Button */}
        <div className="mb-6 flex items-center gap-3">
          <Button onClick={openAddGoalModal} className="flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Add Work Goal
          </Button>
          
          <Button 
            onClick={() => syncWithJira()} 
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync with JIRA'}
          </Button>
          
          {syncMessage && (
            <div className={`text-sm px-3 py-2 rounded ${
              syncMessage.includes('Error') || syncMessage.includes('failed')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {syncMessage}
            </div>
          )}
        </div>

        {inProgressTodos.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">In Progress Tasks</h2>
              <span className="text-sm text-gray-500">{inProgressTodos.length}</span>
            </div>
            <div className="space-y-2">
              {inProgressTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between gap-4 rounded border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <span className="truncate">{todo.title}</span>
                      {(todo as any).jiraIssueKey && (
                        <a
                          href={(todo as any).jiraUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-xs no-underline"
                          title={`View in JIRA: ${(todo as any).jiraIssueKey}`}
                        >
                          [{(todo as any).jiraIssueKey}]
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {goalTitleById.get(todo.workGoalId) || 'Goal'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTodoInProgress(todo)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Mark not in progress"
                    >
                      <PauseIcon className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => toggleTodoComplete(todo)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Mark complete"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {workGoals.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No work goals yet. Add your first goal to get started!</p>
            </div>
          ) : (
            <>
              {/* Active Goals Section */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={workGoals.filter(g => !g.isCompleted && !g.isHidden).map(g => g.id!)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {workGoals
                      .filter(g => !g.isCompleted && !g.isHidden)
                      .map((goal) => (
                        <SortableGoalCard key={goal.id} goal={goal} />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Backlog Section */}
              {workGoals.filter(g => g.isHidden && !g.isCompleted).length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowBacklog(!showBacklog)}
                    className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-700">
                        Backlog ({workGoals.filter(g => g.isHidden && !g.isCompleted).length})
                      </span>
                    </div>
                    {showBacklog ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {showBacklog && (
                    <div className="mt-4 space-y-4">
                      {workGoals
                        .filter(g => g.isHidden && !g.isCompleted)
                        .map((goal) => {
                          if (!goal.id) return null;
                          const todos = workTodos[goal.id] || [];
                          const isExpanded = expandedGoals.has(goal.id);
                          const completedTodos = todos.filter((t) => t.isCompleted).length;
                          const totalTodos = todos.length;

                          return (
                            <div
                              key={goal.id}
                              className="bg-white rounded-lg shadow overflow-hidden opacity-75"
                              style={{ borderLeft: `4px solid ${priorityColors[goal.priority]}` }}
                            >
                              {/* Goal Header */}
                              <div className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-gray-900">
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
                                    {isExpanded && (
                                      <>
                                        <button
                                          onClick={() => toggleGoalHidden(goal)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                          title="Unhide from backlog"
                                        >
                                          <EyeIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                        <button
                                          onClick={() => openEditGoalModal(goal)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                        >
                                          <PencilIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                        <button
                                          onClick={() => archiveGoal(goal)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                          title="Archive (remove from dashboard)"
                                        >
                                          <ArchiveBoxIcon className="w-5 h-5 text-orange-500" />
                                        </button>
                                        <button
                                          onClick={() => deleteGoal(goal.id!)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                        >
                                          <TrashIcon className="w-5 h-5 text-red-500" />
                                        </button>
                                      </>
                                    )}
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
                                          className="flex flex-col bg-white rounded border border-gray-200"
                                        >
                                          <div className="flex items-start gap-2 p-3">
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
                                                onClick={() => toggleTodoHidden(todo)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                title="Unhide from backlog"
                                              >
                                                <EyeIcon className="w-4 h-4 text-gray-500" />
                                              </button>
                                              <button
                                                onClick={() => openEditTodoModal(todo)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                              >
                                                <PencilIcon className="w-4 h-4 text-gray-500" />
                                              </button>
                                              <button
                                                onClick={() => archiveTodo(todo)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                title="Archive (remove from dashboard)"
                                              >
                                                <ArchiveBoxIcon className="w-4 h-4 text-orange-500" />
                                              </button>
                                              <button
                                                onClick={() => deleteTodo(todo)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                              >
                                                <TrashIcon className="w-4 h-4 text-red-500" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Finished Goals Section */}
              {workGoals.filter(g => g.isCompleted).length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowFinished(!showFinished)}
                    className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-gray-700">
                        Finished Goals ({workGoals.filter(g => g.isCompleted).length})
                      </span>
                    </div>
                    {showFinished ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {showFinished && (
                    <div className="mt-4 space-y-4">
                      {workGoals
                        .filter(g => g.isCompleted)
                        .map((goal) => {
                          if (!goal.id) return null;
                          const todos = workTodos[goal.id] || [];
                          const isExpanded = expandedGoals.has(goal.id);
                          const completedTodos = todos.filter((t) => t.isCompleted).length;
                          const totalTodos = todos.length;

                          return (
                            <div
                              key={goal.id}
                              className="bg-white rounded-lg shadow overflow-hidden opacity-75"
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
                                    {isExpanded && (
                                      <>
                                        <button
                                          onClick={() => openEditGoalModal(goal)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                        >
                                          <PencilIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                        <button
                                          onClick={() => archiveGoal(goal)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                          title="Archive (remove from dashboard)"
                                        >
                                          <ArchiveBoxIcon className="w-5 h-5 text-orange-500" />
                                        </button>
                                        <button
                                          onClick={() => deleteGoal(goal.id!)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                        >
                                          <TrashIcon className="w-5 h-5 text-red-500" />
                                        </button>
                                      </>
                                    )}
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

                                  {todos.filter(t => !t.isHidden).length === 0 ? (
                                    <p className="text-gray-500 text-sm">No tasks yet</p>
                                  ) : (
                                    <DndContext
                                      sensors={sensors}
                                      collisionDetection={closestCenter}
                                      onDragEnd={(e) => handleTodoDragEnd(e, goal.id!)}
                                    >
                                      <SortableContext
                                        items={todos.filter(t => !t.isHidden).map(t => t.id!)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        <div className="space-y-2">
                                          {todos.filter(t => !t.isHidden).map((todo) => (
                                            <SortableTodoItem key={todo.id} todo={todo} />
                                          ))}
                                        </div>
                                      </SortableContext>
                                    </DndContext>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </>
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
