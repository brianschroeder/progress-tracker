export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  createdAt?: string;
}

export interface Goal {
  id?: number;
  name: string;
  description?: string;
  targetDaysPerWeek: number;
  categoryId?: number;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  category?: Category;
  daysOfWeek?: number[];
}

export interface Completion {
  id?: number;
  goalId: number;
  completedAt: string;
  notes?: string;
  createdAt?: string;
  goal?: Goal;
}

export interface WeeklySummary {
  week: string;
  totalCompletions: number;
  goalProgress: Array<{
    goalId: number;
    goalName: string;
    completions: number;
    target: number;
  }>;
}

export interface Streak {
  goalId: number;
  goalName: string;
  currentStreak: number;
  longestStreak: number;
}

export interface UserSettings {
  id?: number;
  weekStartDay: number; // 0 = Sunday, 1 = Monday
  dailyGoalReminder: boolean;
  reminderTime?: string;
  theme: 'light' | 'dark';
  createdAt?: string;
  updatedAt?: string;
}

export interface YearGoal {
  id?: number;
  title: string;
  description?: string;
  category: string; // e.g., "Career", "Health"
  targetDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  progress: number; // 0-100
  color: string;
  sortOrder: number;
  createdAt?: string;
  // Count-based tracking
  trackingMode?: 'percentage' | 'count'; // Mode for progress tracking
  currentCount?: number; // Current count (e.g., 45 workouts done)
  targetCount?: number; // Target count (e.g., 175 workouts)
}

export interface DecadeGoal {
  id?: number;
  title: string;
  vision: string; // Detailed description of the vision
  lifeArea: string; // e.g., "Career & Business", "Health & Fitness"
  milestones: string[]; // JSON string of milestones
  isCompleted: boolean;
  color: string;
  sortOrder: number;
  createdAt?: string;
}

export interface Todo {
  id?: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // YYYY-MM-DD
  sortOrder: number;
  createdAt?: string;
}
