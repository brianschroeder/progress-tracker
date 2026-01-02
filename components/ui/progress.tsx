'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function Progress({ value, max = 100, className, showLabel = false, color = 'primary' }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  
  return (
    <div className={cn('w-full', className)}>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {value} / {max}
        </div>
      )}
    </div>
  );
}
