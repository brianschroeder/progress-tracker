'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, ...props }, ref) => {
    return (
      <label className="flex items-center cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            checked={checked}
            {...props}
          />
          <div
            className={cn(
              'w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all',
              checked
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-300 group-hover:border-gray-400',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
          >
            {checked && (
              <CheckIcon className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
        {label && (
          <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
