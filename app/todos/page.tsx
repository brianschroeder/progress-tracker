'use client';

import React, { useEffect, useState } from 'react';
import { Todo } from '@/types';
import { PlusIcon, CheckCircleIcon, TrashIcon, PencilIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const priorityColors = {
  low: '#10B981', // green
  medium: '#F59E0B', // orange
  high: '#EF4444', // red
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTodo(null);
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setShowModal(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const todoData = {
      ...formData,
      description: formData.description || undefined,
      dueDate: formData.dueDate || undefined,
      sortOrder: editingTodo ? editingTodo.sortOrder : todos.length,
      isCompleted: editingTodo ? editingTodo.isCompleted : false,
    };

    try {
      if (editingTodo) {
        const response = await fetch(`/api/todos/${editingTodo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...todoData, id: editingTodo.id }),
        });
        const updated = await response.json();
        setTodos(todos.map(t => t.id === updated.id ? updated : t));
      } else {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todoData),
        });
        const newTodo = await response.json();
        setTodos([...todos, newTodo]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save todo:', error);
    }
  };

  const toggleComplete = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todo, isCompleted: !todo.isCompleted }),
      });
      const updated = await response.json();
      setTodos(todos.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newTodos = [...todos];
    [newTodos[index], newTodos[index - 1]] = [newTodos[index - 1], newTodos[index]];
    setTodos(newTodos);
    await reorderTodos(newTodos.map(t => t.id!));
  };

  const moveDown = async (index: number) => {
    if (index === todos.length - 1) return;
    const newTodos = [...todos];
    [newTodos[index], newTodos[index + 1]] = [newTodos[index + 1], newTodos[index]];
    setTodos(newTodos);
    await reorderTodos(newTodos.map(t => t.id!));
  };

  const reorderTodos = async (todoIds: number[]) => {
    try {
      await fetch('/api/todos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todoIds }),
      });
    } catch (error) {
      console.error('Failed to reorder todos:', error);
    }
  };

  const activeTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="relative mb-12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-light via-accent to-accent-dark rounded-full blur-3xl opacity-40"></div>
          
          <div className="text-center relative z-10">
            <h1 className="text-5xl font-semibold text-neutral-900 mb-3">
              To-Do List
            </h1>
            <p className="text-2xl text-neutral-600">
              Organize your{' '}
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent font-semibold">
                tasks & priorities
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-light transition-smooth shadow-soft hover:shadow-medium font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Task</span>
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

        {/* Active Todos */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Active Tasks</h2>
          
          {loading ? (
            <div className="text-center py-8 text-neutral-400">Loading...</div>
          ) : activeTodos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-neutral-500">No active tasks</p>
              <p className="text-sm text-neutral-400 mt-2">Add a new task to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTodos.map((todo, index) => (
                <div
                  key={todo.id}
                  className="p-4 rounded-xl border-2 border-neutral-200 hover:border-accent/30 transition-smooth bg-neutral-50"
                >
                  <div className="flex items-start space-x-3">
                    {editMode && (
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveUp(todos.indexOf(todo))}
                          disabled={index === 0}
                          className={`p-1 rounded-lg transition-smooth ${
                            index === 0 ? 'text-neutral-200' : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                          }`}
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveDown(todos.indexOf(todo))}
                          disabled={index === activeTodos.length - 1}
                          className={`p-1 rounded-lg transition-smooth ${
                            index === activeTodos.length - 1 ? 'text-neutral-200' : 'text-neutral-400 hover:text-accent hover:bg-accent/10'
                          }`}
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => todo.id && toggleComplete(todo.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg border-2 border-neutral-300 hover:border-accent transition-smooth bg-white"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-900">{todo.title}</h3>
                      {todo.description && (
                        <p className="text-sm text-neutral-500 mt-1">{todo.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${priorityColors[todo.priority]}20`,
                            color: priorityColors[todo.priority],
                          }}
                        >
                          {todo.priority}
                        </span>
                        {todo.dueDate && (
                          <span className="text-xs text-neutral-500">
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(todo)}
                          className="p-2 hover:bg-accent/10 rounded-lg transition-smooth"
                        >
                          <PencilIcon className="w-4 h-4 text-accent" />
                        </button>
                        <button
                          onClick={() => todo.id && handleDelete(todo.id)}
                          className="p-2 hover:bg-danger/10 rounded-lg transition-smooth"
                        >
                          <TrashIcon className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Completed Tasks</h2>
            
            <div className="space-y-3">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="p-4 rounded-xl border-2 border-success/30 bg-success/5"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => todo.id && toggleComplete(todo.id)}
                      className="flex-shrink-0 w-10 h-10 rounded-lg bg-success text-white flex items-center justify-center transition-smooth"
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-success line-through">{todo.title}</h3>
                      {todo.description && (
                        <p className="text-sm text-neutral-500 mt-1 line-through">{todo.description}</p>
                      )}
                    </div>

                    {editMode && (
                      <button
                        onClick={() => todo.id && handleDelete(todo.id)}
                        className="p-2 hover:bg-danger/10 rounded-lg transition-smooth"
                      >
                        <TrashIcon className="w-4 h-4 text-danger" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTodo ? 'Edit Task' : 'New Task'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent-light">
                {editingTodo ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
