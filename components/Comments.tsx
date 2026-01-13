'use client';

import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Comment {
  id: number;
  workGoalId?: number;
  workTodoId?: number;
  text: string;
  jiraCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentsProps {
  goalId?: number;
  todoId?: number;
}

export function Comments({ goalId, todoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [goalId, todoId, showComments]);

  async function fetchComments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (goalId) params.set('goalId', goalId.toString());
      if (todoId) params.set('todoId', todoId.toString());
      
      const res = await fetch(`/api/comments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workGoalId: goalId,
          workTodoId: todoId,
          text: newComment.trim(),
        }),
      });

      if (res.ok) {
        setNewComment('');
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }

  async function updateComment(id: number) {
    if (!editText.trim()) return;

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditText('');
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  }

  async function deleteComment(id: number) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditText(comment.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-t border-gray-200 mt-2">
      <button
        onClick={() => setShowComments(!showComments)}
        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-between"
      >
        <span>Comments ({comments.length})</span>
        <svg
          className={`w-4 h-4 transition-transform ${showComments ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showComments && (
        <div className="px-3 py-2 space-y-3 bg-gray-50">
          {loading && comments.length === 0 ? (
            <p className="text-xs text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-500">No comments yet</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-2 rounded border border-gray-200">
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded resize-none"
                        rows={2}
                      />
                      <div className="flex gap-1">
                        <Button
                          onClick={() => updateComment(comment.id)}
                          size="sm"
                          className="text-xs py-1 px-2 h-auto"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-gray-900 flex-1">{comment.text}</p>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => startEdit(comment)}
                            className="p-0.5 hover:bg-gray-100 rounded"
                          >
                            <PencilIcon className="w-3 h-3 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="p-0.5 hover:bg-gray-100 rounded"
                          >
                            <TrashIcon className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.jiraCommentId && (
                          <span className="text-[10px] text-blue-600" title="Synced to JIRA">
                            ✓ JIRA
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full text-xs p-2 border border-gray-300 rounded resize-none"
              rows={2}
            />
            <Button
              onClick={addComment}
              disabled={!newComment.trim()}
              size="sm"
              className="text-xs py-1 px-3 h-auto flex items-center gap-1"
            >
              <PlusIcon className="w-3 h-3" />
              Add Comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
