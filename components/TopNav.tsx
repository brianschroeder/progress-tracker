'use client';

import React, { useState } from 'react';
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
  BriefcaseIcon,
  Bars3Icon,
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
  BriefcaseIcon as BriefcaseIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Calendar', path: '/', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
  { name: 'Daily Focus', path: '/today', icon: CheckCircleIcon, iconSolid: CheckCircleIconSolid },
  { name: 'To-Do List', path: '/todos', icon: ListBulletIcon, iconSolid: ListBulletIconSolid },
  { name: 'Work', path: '/work', icon: BriefcaseIcon, iconSolid: BriefcaseIconSolid },
  { name: 'Goals', path: '/goals', icon: RocketLaunchIcon, iconSolid: RocketLaunchIconSolid },
  { name: 'Year Goals', path: '/year-goals', icon: SparklesIcon, iconSolid: SparklesIconSolid },
  { name: '10-Year Vision', path: '/decade-goals', icon: TrophyIcon, iconSolid: TrophyIconSolid },
  { name: 'Shopping List', path: '/shopping-list', icon: ShoppingCartIcon, iconSolid: ShoppingCartIconSolid },
];

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Progress Tracker</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = isActive ? item.iconSolid : item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = isActive ? item.iconSolid : item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-base font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-16"></div>
    </>
  );
}
