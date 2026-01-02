'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  ListBulletIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ListBulletIcon as ListBulletIconSolid,
  SparklesIcon as SparklesIconSolid,
  TrophyIcon as TrophyIconSolid,
  RocketLaunchIcon as RocketLaunchIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  iconSolid: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/home', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'To-Do List', path: '/todos', icon: ListBulletIcon, iconSolid: ListBulletIconSolid },
  { name: 'Calendar', path: '/', icon: CalendarDaysIcon, iconSolid: CalendarDaysIconSolid },
  { name: 'Daily Focus', path: '/today', icon: CheckCircleIcon, iconSolid: CheckCircleIconSolid },
  { name: 'Goals', path: '/goals', icon: RocketLaunchIcon, iconSolid: RocketLaunchIconSolid },
  { name: 'Year Goals', path: '/year-goals', icon: SparklesIcon, iconSolid: SparklesIconSolid },
  { name: '10-Year Vision', path: '/decade-goals', icon: TrophyIcon, iconSolid: TrophyIconSolid },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-neutral-200 flex flex-col items-center py-6 z-30">
      {/* Navigation Icons */}
      <nav className="flex flex-col space-y-4 mt-4">
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
    </div>
  );
}
