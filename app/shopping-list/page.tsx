'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, EnvelopeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ShoppingListItem } from '@/types';

const categories = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care',
  'Other',
];

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    // Load saved email from localStorage
    const savedEmail = localStorage.getItem('shoppingListEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/shopping-list');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching shopping items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          quantity: newItemQuantity,
          category: newItemCategory || 'Other',
          isChecked: false,
        }),
      });

      if (response.ok) {
        await fetchItems();
        setNewItemName('');
        setNewItemQuantity('');
        setNewItemCategory('');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleToggleCheck = async (item: ShoppingListItem) => {
    try {
      const response = await fetch(`/api/shopping-list/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isChecked: !item.isChecked,
        }),
      });

      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const response = await fetch(`/api/shopping-list/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleClearChecked = async () => {
    if (!confirm('Clear all checked items?')) return;

    try {
      const response = await fetch('/api/shopping-list/clear-checked', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Error clearing checked items:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    // Save email to localStorage
    localStorage.setItem('shoppingListEmail', email);

    try {
      const response = await fetch('/api/shopping-list/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        // Open mailto link
        window.location.href = data.mailtoUrl;
        setShowEmailModal(false);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  // Group items by category
  const groupedItems: { [key: string]: ShoppingListItem[] } = {};
  items.forEach((item) => {
    const category = item.category || 'Other';
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  const uncheckedCount = items.filter(item => !item.isChecked).length;
  const checkedCount = items.filter(item => item.isChecked).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-800 mb-2">🛒 Shopping List</h1>
          <p className="text-neutral-600">
            {uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} to buy
            {checkedCount > 0 && ` • ${checkedCount} checked off`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Item
          </button>
          
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={items.length === 0}
            className="btn-secondary flex items-center gap-2"
          >
            <EnvelopeIcon className="w-5 h-5" />
            Email List
          </button>

          {checkedCount > 0 && (
            <button
              onClick={handleClearChecked}
              className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
            >
              <TrashIcon className="w-5 h-5" />
              Clear Checked
            </button>
          )}
        </div>

        {/* Shopping List by Category */}
        {items.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-neutral-500 mb-4">Your shopping list is empty</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedItems).sort().map((category) => (
              <div key={category} className="card">
                <h2 className="text-lg font-semibold text-neutral-700 mb-4 border-b border-neutral-200 pb-2">
                  {category}
                </h2>
                <div className="space-y-2">
                  {groupedItems[category].map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        item.isChecked
                          ? 'bg-neutral-50 opacity-60'
                          : 'bg-white hover:bg-accent/5'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleCheck(item)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          item.isChecked
                            ? 'bg-accent border-accent'
                            : 'border-neutral-300 hover:border-accent'
                        }`}
                      >
                        {item.isChecked && <CheckIcon className="w-4 h-4 text-white" />}
                      </button>

                      <div className="flex-1">
                        <p className={`${item.isChecked ? 'line-through text-neutral-500' : 'text-neutral-800'}`}>
                          {item.name}
                        </p>
                        {item.quantity && (
                          <p className="text-sm text-neutral-500">{item.quantity}</p>
                        )}
                      </div>

                      <button
                        onClick={() => item.id && handleDeleteItem(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Add New Item</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., Milk, Eggs, Bread"
                    className="input-field w-full"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="e.g., 2 gallons, 1 lb"
                    className="input-field w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddItem}
                  disabled={!newItemName.trim()}
                  className="btn-primary flex-1"
                >
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewItemName('');
                    setNewItemQuantity('');
                    setNewItemCategory('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">📧 Email Shopping List</h3>
              
              <p className="text-neutral-600 mb-4">
                Enter your email address to send the shopping list
              </p>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="input-field w-full mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleSendEmail()}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={!email.trim()}
                  className="btn-primary flex-1"
                >
                  Send Email
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
