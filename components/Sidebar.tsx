'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  ListBulletIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  SparklesIcon as SparklesIconSolid,
  TrophyIcon as TrophyIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const defaultNavItems: NavItem[] = [
  { name: 'Home', path: '/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'To-Do List', path: '/todos', icon: ListBulletIcon, iconSolid: ListBulletIconSolid },
  { name: 'Shopping List', path: '/shopping-list', icon: ShoppingCartIcon, iconSolid: ShoppingCartIconSolid },
  { name: 'Calendar', path: '/', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
  { name: 'Daily Focus', path: '/today', icon: CheckCircleIcon, iconSolid: CheckCircleIconSolid },
  { name: 'Goals', path: '/goals', icon: RocketLaunchIcon, iconSolid: RocketLaunchIconSolid },
  { name: 'Year Goals', path: '/year-goals', icon: SparklesIcon, iconSolid: SparklesIconSolid },
  { name: '10-Year Vision', path: '/decade-goals', icon: TrophyIcon, iconSolid: TrophyIconSolid },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizeItems, setCustomizeItems] = useState<NavItem[]>(defaultNavItems);

  useEffect(() => {
    fetchMenuOrder();
  }, []);

  const fetchMenuOrder = async () => {
    try {
      const response = await fetch('/api/settings/menu-order');
      if (response.ok) {
        const data = await response.json();
        if (data.menuOrder && Array.isArray(data.menuOrder)) {
          const orderedItems = data.menuOrder
            .map((path: string) => defaultNavItems.find(item => item.path === path))
            .filter((item): item is NavItem => item !== undefined);
          
          // Add any new items that weren't in the saved order
          const newItems = defaultNavItems.filter(
            item => !data.menuOrder.includes(item.path)
          );
          
          setNavItems([...orderedItems, ...newItems]);
        }
      }
    } catch (error) {
      console.error('Error fetching menu order:', error);
    }
  };

  const saveMenuOrder = async (items: NavItem[]) => {
    try {
      const menuOrder = items.map(item => item.path);
      const response = await fetch('/api/settings/menu-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuOrder }),
      });

      if (response.ok) {
        setNavItems(items);
      }
    } catch (error) {
      console.error('Error saving menu order:', error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...customizeItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setCustomizeItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === customizeItems.length - 1) return;
    const newItems = [...customizeItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setCustomizeItems(newItems);
  };

  const handleSaveOrder = () => {
    saveMenuOrder(customizeItems);
    setShowCustomizeModal(false);
  };

  const handleOpenCustomize = () => {
    setCustomizeItems([...navItems]);
    setShowCustomizeModal(true);
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-6 z-30">
        {/* Navigation Icons */}
        <nav className="flex flex-col space-y-4 mt-4 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = isActive ? item.iconSolid : item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>

        {/* Customize Menu Button */}
        <button
          onClick={handleOpenCustomize}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all mt-auto"
          title="Customize Menu"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Customize Menu Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-neutral-800">Customize Menu</h3>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-neutral-600 mb-4">Reorder navigation items</p>

            <div className="space-y-2 mb-6">
              {customizeItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.path}
                    className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
                  >
                    <Icon className="w-5 h-5 text-neutral-600" />
                    <span className="flex-1 text-neutral-800">{item.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        <ChevronUpIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === customizeItems.length - 1}
                        className={`p-1 rounded ${
                          index === customizeItems.length - 1
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        <ChevronDownIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveOrder}
                className="btn-primary flex-1"
              >
                Save Order
              </button>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
