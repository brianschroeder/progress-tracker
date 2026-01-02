'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

const DAYS = [
  { value: 0, label: 'Sun', fullName: 'Sunday' },
  { value: 1, label: 'Mon', fullName: 'Monday' },
  { value: 2, label: 'Tue', fullName: 'Tuesday' },
  { value: 3, label: 'Wed', fullName: 'Wednesday' },
  { value: 4, label: 'Thu', fullName: 'Thursday' },
  { value: 5, label: 'Fri', fullName: 'Friday' },
  { value: 6, label: 'Sat', fullName: 'Saturday' },
];

export function DaySelector({ selectedDays, onChange, disabled = false }: DaySelectorProps) {
  const toggleDay = (dayValue: number) => {
    if (disabled) return;
    
    if (selectedDays.includes(dayValue)) {
      onChange(selectedDays.filter(d => d !== dayValue));
    } else {
      onChange([...selectedDays, dayValue].sort());
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const selectWeekdays = () => {
    if (disabled) return;
    onChange([1, 2, 3, 4, 5]);
  };

  const selectWeekend = () => {
    if (disabled) return;
    onChange([0, 6]);
  };

  return (
    <div className="space-y-3">
      {/* Day Buttons */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                'hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-primary border-primary text-white font-semibold'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-primary'
              )}
              title={day.fullName}
            >
              <span className="text-sm font-medium">{day.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          All Days
        </button>
        <button
          type="button"
          onClick={selectWeekdays}
          disabled={disabled}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={selectWeekend}
          disabled={disabled}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Weekend
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-red-600"
        >
          Clear All
        </button>
      </div>

      {/* Selected Days Summary */}
      {selectedDays.length > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Selected:</span>{' '}
          {selectedDays.length === 7 ? (
            <span>Every day</span>
          ) : (
            <span>
              {selectedDays.map(d => DAYS[d].fullName).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get day names from numbers
export function getDayNames(dayNumbers: number[]): string[] {
  return dayNumbers.map(d => DAYS[d]?.fullName || '').filter(Boolean);
}

// Helper function to get short day names
export function getShortDayNames(dayNumbers: number[]): string[] {
  return dayNumbers.map(d => DAYS[d]?.label || '').filter(Boolean);
}
