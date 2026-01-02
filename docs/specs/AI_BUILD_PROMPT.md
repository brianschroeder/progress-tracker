# AI Build Prompt: Weekly Goal Tracker Application

## Project Overview

Build a **Weekly Goal Tracker** web application that helps users track their daily progress toward weekly goals and habits. Users can define goals (e.g., "Go to the gym 3 times per week"), check them off each day they complete them, and view their progress over time with analytics and visualizations.

## Core User Flow

1. User adds goals with target frequencies (e.g., "Gym 3x/week", "Read 5x/week")
2. Each day, user opens the app and checks off completed goals
3. Dashboard shows weekly progress for all goals (3/3 days complete this week)
4. Historical view shows trends, streaks, and completion rates over time

## Technology Stack (Required)

- **Framework**: Next.js (App Router) with TypeScript
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Charts**: chart.js with react-chartjs-2 and/or recharts
- **UI Components**: @heroicons/react, lucide-react, @radix-ui/react-progress
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit/core and @dnd-kit/sortable (for goal reordering)
- **Deployment**: Docker with docker-compose

## Database Schema (SQLite)

### Table: goals
```sql
CREATE TABLE goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  targetDaysPerWeek INTEGER NOT NULL,
  categoryId INTEGER,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'target',
  isActive BOOLEAN NOT NULL DEFAULT 1,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
)
```

### Table: completions
```sql
CREATE TABLE completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId INTEGER NOT NULL,
  completionDate TEXT NOT NULL,
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE,
  UNIQUE(goalId, completionDate)
)
```

### Table: categories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### Table: user_settings
```sql
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekStartsOn INTEGER DEFAULT 0,
  theme TEXT DEFAULT 'light',
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## Required API Endpoints

### Goals
- `GET /api/goals` - Get all active goals
- `POST /api/goals` - Create goal
  - Body: `{ name, description?, targetDaysPerWeek, categoryId?, color?, icon? }`
- `PUT /api/goals/[id]` - Update goal
- `DELETE /api/goals/[id]` - Soft delete (set isActive = false)
- `POST /api/goals/reorder` - Update sortOrder for drag-and-drop

### Completions
- `GET /api/completions?date=YYYY-MM-DD` - Get completions for date
- `GET /api/completions?goalId={id}&startDate={date}&endDate={date}` - Get completions for goal in range
- `POST /api/completions` - Mark goal complete
  - Body: `{ goalId, completionDate, notes? }`
- `DELETE /api/completions/[id]` - Unmark completion

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Analytics
- `GET /api/weekly-summary?date=YYYY-MM-DD` - Get current week's progress
  - Returns: Array of goals with completion counts vs targets for the week
- `GET /api/analytics/streaks` - Get current streak for each goal

## Required Pages

### 1. Dashboard (`/dashboard`)
**Main view showing current week's progress**
- Display current week date range (e.g., "Jan 13 - Jan 19, 2025")
- Show card for each active goal:
  - Goal name and icon
  - Progress bar: X/Y days completed this week
  - Visual day indicators (dots or checkmarks for M T W T F S S)
  - Status badge (on track / behind / exceeded)
- Summary card: Overall weekly completion rate
- Quick link to today's check-in

### 2. Daily Check-In (`/check-in`)
**Simple interface to mark today's completions**
- Display today's date prominently
- List all active goals with large checkboxes
- Show if already completed today (checked + disabled or visual indicator)
- Add optional notes field per completion
- Show motivational message/progress after checking off goals

### 3. Goals Management (`/goals`)
**CRUD interface for goals**
- List all goals (active and inactive)
- Add new goal button → form modal or page
- Goal form fields:
  - Name (required)
  - Description (optional)
  - Target days per week (1-7, required)
  - Category dropdown
  - Color picker
  - Icon selector
- Edit/Delete actions per goal
- Drag-and-drop to reorder goals

### 4. History View (`/history`)
**Calendar view of past completions**
- Month calendar with dots/colors showing which goals were completed each day
- Click a day to see details
- Navigate between months
- Optional: List view as alternative

### 5. Analytics (`/analytics`)
**Trends and statistics**
- Line chart: Weekly completion rates over time (last 8-12 weeks)
- Streak information per goal (current streak, longest streak)
- Completion rate by day of week (bar chart)
- Best performing goals (highest completion rate)

### 6. Settings (`/settings`)
**User preferences**
- Week starts on: Sunday or Monday
- Data export (JSON)
- Data import (JSON)

## Key Components to Build

### Core Components
1. **DailyCheckIn.tsx** - Today's goal checklist with checkboxes
2. **WeeklyProgress.tsx** - Progress cards for current week
3. **GoalForm.tsx** - Form for add/edit goal
4. **GoalList.tsx** - Sortable list of goals with drag-and-drop
5. **GoalCard.tsx** - Individual goal display with progress
6. **HistoryCalendar.tsx** - Month view calendar with completion indicators
7. **TrendChart.tsx** - Line chart for completion trends
8. **StreakDisplay.tsx** - Show streak information
9. **Sidebar.tsx** - Navigation sidebar

### UI Primitives (components/ui/)
- Button, Card, Input, Checkbox
- Progress (use @radix-ui/react-progress)
- Modal/Dialog for forms

## Database Layer (lib/db.ts)

All database operations should be in `lib/db.ts`. Implement these functions:

```typescript
// Goals
export function getAllGoals(): Goal[]
export function getActiveGoals(): Goal[]
export function getGoalById(id: number): Goal | null
export function createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): number
export function updateGoal(goal: Goal): boolean
export function deleteGoal(id: number): boolean // Set isActive = false
export function reorderGoals(goalIds: number[]): void

// Completions
export function getCompletionsForDate(date: string): Completion[]
export function getCompletionsForGoal(goalId: number, startDate: string, endDate: string): Completion[]
export function createCompletion(completion: Omit<Completion, 'id' | 'createdAt'>): number
export function deleteCompletion(id: number): boolean
export function isGoalCompletedOnDate(goalId: number, date: string): boolean

// Categories
export function getAllCategories(): Category[]
export function createCategory(category: Omit<Category, 'id' | 'createdAt'>): number
export function updateCategory(category: Category): boolean
export function deleteCategory(id: number): boolean

// Analytics
export function getWeeklyProgress(startDate: string, endDate: string): WeeklyProgress[]
export function getStreakForGoal(goalId: number): number
export function getCurrentStreaks(): Array<{ goalId: number; goalName: string; streak: number }>
```

## TypeScript Interfaces (types/index.ts)

```typescript
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
}

export interface Completion {
  id?: number;
  goalId: number;
  completionDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  goal?: Goal;
}

export interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt?: string;
}

export interface WeeklyProgress {
  goal: Goal;
  completionsThisWeek: number;
  targetDaysPerWeek: number;
  completionDates: string[];
  completionRate: number; // Percentage
  status: 'on-track' | 'behind' | 'exceeded';
}
```

## Key Logic to Implement

### Week Calculation
```typescript
// Get current week's start and end dates
function getCurrentWeek(weekStartsOn: number = 0): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek - weekStartsOn;
  
  const start = new Date(today);
  start.setDate(today.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
```

### Completion Status
```typescript
function getStatus(completions: number, target: number): 'on-track' | 'behind' | 'exceeded' {
  const rate = (completions / target) * 100;
  if (rate >= 100) return 'exceeded';
  if (rate >= 70) return 'on-track';
  return 'behind';
}
```

### Streak Calculation
```typescript
function calculateStreak(goalId: number): number {
  // Get all completions for goal, ordered by date descending
  // Starting from most recent, count consecutive days
  // Return streak count (could be 0 if no recent completions)
}
```

## Docker Setup

### Dockerfile
```dockerfile
FROM node:18-slim AS base
RUN apt-get update && apt-get install -y python3 make g++ gcc sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm ci && npm rebuild better-sqlite3 --build-from-source
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3501
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

RUN mkdir -p data && chown -R nextjs:nodejs data
USER nextjs
EXPOSE 3501
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  goal-tracker:
    build: .
    container_name: goal-tracker
    ports:
      - "3501:3501"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/goals.db
    restart: unless-stopped
```

## Configuration Files

### next.config.ts
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
};

export default nextConfig;
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "next dev -p 3501",
    "build": "next build",
    "start": "next start -p 3501",
    "lint": "next lint",
    "initialize": "node scripts/setup-database.js"
  }
}
```

## UI/UX Guidelines

### Design Principles
- **Clean and minimal**: Focus on clarity and usability
- **Visual feedback**: Animations on check-off, progress bars, success states
- **Color-coded**: Use colors to distinguish categories and status
- **Mobile-friendly**: Touch-optimized for daily check-ins on phone

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981) - on track, completed
- **Warning**: Orange (#F59E0B) - behind on goals
- **Neutral**: Gray scale for backgrounds and text

### Layout
- Sidebar navigation (collapsible on mobile)
- Card-based layout for goals and progress
- Responsive grid for dashboard
- Sticky header with current date

## Implementation Steps

1. **Setup Project**
   - Initialize Next.js with TypeScript
   - Install dependencies
   - Setup Tailwind CSS
   - Create folder structure

2. **Database Layer**
   - Create `lib/db.ts` with schema initialization
   - Implement all database functions
   - Add TypeScript interfaces

3. **API Routes**
   - Implement all endpoints in `app/api/`
   - Add error handling and validation

4. **Core Components**
   - Build UI primitives (Button, Card, etc.)
   - Create form components
   - Build data display components

5. **Pages**
   - Dashboard with weekly progress
   - Daily check-in interface
   - Goals management page
   - History calendar view
   - Analytics page

6. **Features**
   - Drag-and-drop goal reordering
   - Category management
   - Streak calculation
   - Charts and visualizations

7. **Polish**
   - Add animations and transitions
   - Optimize performance
   - Add loading states
   - Error handling UI

8. **Docker**
   - Create Dockerfile
   - Create docker-compose.yml
   - Test containerized deployment

## Key Features Summary

✅ **Must Have (MVP)**
- Add/edit/delete goals
- Mark goals complete for today
- View weekly progress
- Basic categories

✅ **Should Have**
- Historical calendar view
- Drag-and-drop reordering
- Streak tracking
- Trend charts

✅ **Nice to Have**
- Achievement badges
- Export/import data
- Custom week start day
- Notes on completions

## Success Criteria

The application is complete when:
1. User can add goals with target days per week
2. User can check off goals daily
3. Dashboard shows clear weekly progress for each goal
4. Historical data is viewable and accurate
5. Application works in Docker container
6. Mobile responsive and touch-friendly
7. Data persists in SQLite database

## Additional Notes

- **Prevent duplicate completions**: Add UNIQUE constraint on (goalId, completionDate)
- **Soft delete goals**: Keep completion history even after goal is "deleted"
- **Date handling**: Always use YYYY-MM-DD format for dates in database
- **Optimistic UI**: Update UI immediately when checking off goals, then sync with API
- **Error handling**: Show toast notifications for errors
- **Loading states**: Show spinners/skeletons while loading data

---

## Example User Story

**Sarah wants to build healthy habits:**
1. She opens the app and adds three goals:
   - "Go to gym" - 3 times per week
   - "Read books" - 5 times per week
   - "Meditate" - 7 times per week
2. Each morning, she opens the check-in page and marks what she did yesterday
3. Dashboard shows she's at 2/3 for gym this week (on track!)
4. History view shows she has a 12-day streak on meditation
5. Analytics show her reading has improved from 60% to 85% over 8 weeks

Build this application to make Sarah's goal tracking effortless and motivating!

---

**Start with the database setup and API endpoints, then build the UI components and pages. Test thoroughly and ensure Docker deployment works correctly.**
