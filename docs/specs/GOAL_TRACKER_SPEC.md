# Weekly Goal Tracker - Technical Specification

## 1. Application Overview

**Purpose**: Track daily progress toward weekly goals and habits, providing historical insights and trend analysis to maintain accountability and build consistency.

**Core Concept**: Users define goals with target completion frequencies (e.g., "Gym 3x/week"), check them off daily, and review progress over time with visualizations and statistics.

## 2. Technology Stack (Same as Finance Tracker)

### Core Framework
- **Next.js** (App Router) with **TypeScript**
- **React** for UI components
- **Tailwind CSS** for styling
- **SQLite** with **better-sqlite3** for database

### Key Libraries
- **UI Components**: @heroicons/react, react-icons, lucide-react, @radix-ui/react-progress
- **Charts & Visualization**: chart.js, react-chartjs-2, recharts, @nivo/bar
- **Utilities**: date-fns (date handling), clsx, tailwind-merge
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable (for reordering goals)

### Development Tools
- **TypeScript** (strict mode)
- **ESLint** with Next.js config
- **Docker** for containerized deployment

## 3. Architecture Pattern

### Project Structure
```
app/
  ├── api/
  │   ├── goals/                # CRUD for goals
  │   ├── completions/          # Mark goals complete
  │   ├── categories/           # Goal categories
  │   ├── analytics/            # Statistics and trends
  │   ├── weekly-summary/       # Current week overview
  │   └── export-data/          # Data backup
  ├── dashboard/                # Main view with weekly progress
  ├── goals/                    # Goal management page
  ├── history/                  # Historical data view
  ├── analytics/                # Trends and insights
  ├── settings/                 # App settings
  ├── layout.tsx                # Root layout with nav
  └── globals.css               # Tailwind styles
components/
  ├── DailyCheckIn.tsx          # Today's goal checklist
  ├── WeeklyProgress.tsx        # Current week progress cards
  ├── GoalForm.tsx              # Add/edit goal form
  ├── GoalList.tsx              # List of all goals
  ├── HistoryCalendar.tsx       # Calendar view of completions
  ├── TrendChart.tsx            # Progress trends over time
  ├── StreakTracker.tsx         # Streak visualization
  ├── CategoryManager.tsx       # Category CRUD
  ├── Sidebar.tsx               # Navigation
  └── ui/                       # Reusable UI primitives
lib/
  ├── db.ts                     # All database operations
  ├── date-utils.ts             # Week calculations
  └── utils.ts                  # Helper functions
types/
  └── index.ts                  # TypeScript interfaces
scripts/
  └── setup-database.js         # Database initialization
data/
  └── goals.db                  # SQLite database
```

## 4. Database Schema (SQLite)

### goals
Primary table for tracking goals/habits
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

### completions
Records each time a goal is completed
```sql
CREATE TABLE completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId INTEGER NOT NULL,
  completionDate TEXT NOT NULL,  -- YYYY-MM-DD format
  notes TEXT,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE
)
```

### categories
Organize goals into categories (Health, Work, Personal, etc.)
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

### user_settings
Store user preferences
```sql
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekStartsOn INTEGER DEFAULT 0,  -- 0 = Sunday, 1 = Monday
  theme TEXT DEFAULT 'light',
  notificationsEnabled BOOLEAN DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## 5. API Endpoints (RESTful)

All endpoints return JSON with standard HTTP status codes.

### Goals Management
- **GET /api/goals** - Get all active goals
- **GET /api/goals/[id]** - Get specific goal
- **POST /api/goals** - Create new goal
- **PUT /api/goals/[id]** - Update goal
- **DELETE /api/goals/[id]** - Delete goal (soft delete to inactive)
- **POST /api/goals/reorder** - Update sortOrder for multiple goals

### Completions
- **GET /api/completions?date={YYYY-MM-DD}** - Get completions for specific date
- **GET /api/completions?goalId={id}&startDate={date}&endDate={date}** - Get completions for goal in range
- **POST /api/completions** - Mark goal complete for a date
  ```json
  { "goalId": 1, "completionDate": "2025-01-15", "notes": "Great workout!" }
  ```
- **DELETE /api/completions/[id]** - Unmark completion

### Categories
- **GET /api/categories** - Get all categories
- **POST /api/categories** - Create category
- **PUT /api/categories/[id]** - Update category
- **DELETE /api/categories/[id]** - Delete category

### Analytics & Summaries
- **GET /api/weekly-summary?date={YYYY-MM-DD}** - Get current week's progress
  - Returns: goals with completion count vs target for the week
- **GET /api/analytics/trends?weeks={number}** - Get completion trends
  - Returns: Weekly completion rates over time
- **GET /api/analytics/streaks** - Get current streaks for all goals
- **GET /api/analytics/stats** - Overall statistics
  - Total goals, average completion rate, best performing goals, etc.

### Data Management
- **GET /api/export-data** - Export all data as JSON
- **POST /api/import-data** - Import data from JSON

## 6. Core Features

### 6.1 Daily Check-In
**Primary Interface**: Simple checklist for today's goals
- Show all active goals
- Checkbox to mark as complete for today
- Visual indicator if already completed today
- Quick add notes option
- Progress bar showing daily completion percentage

### 6.2 Weekly Progress Dashboard
**Main Dashboard View**:
- Current week overview (Monday-Sunday or Sunday-Saturday)
- For each goal:
  - Progress bar: X/Y days completed this week
  - Visual dots/checkmarks for each day
  - Percentage completion
  - Status indicator (on track, behind, exceeded)
- Overall weekly completion summary
- Quick stats cards (streak count, goals on track, completion rate)

### 6.3 Goal Management
- Add new goals with:
  - Name and description
  - Target days per week (1-7)
  - Category selection
  - Color and icon picker
- Edit existing goals
- Delete/archive goals
- Reorder goals via drag-and-drop
- View goal details and history

### 6.4 Category Management
- Create custom categories (Health, Work, Personal, Social, etc.)
- Assign colors and icons to categories
- Filter goals by category
- Category-based analytics

### 6.5 Historical View
**Multiple View Options**:
- **Calendar View**: Month calendar with dots/colors showing completions
- **List View**: Chronological list of completions with filters
- **Timeline View**: Visual timeline of goal progress

### 6.6 Analytics & Insights
**Trend Analysis**:
- Line charts showing weekly completion rates over time
- Heatmap calendar (like GitHub contributions)
- Completion rate by day of week
- Best performing goals
- Consistency scores

**Streak Tracking**:
- Current streak for each goal
- Longest streak achieved
- Streak milestones and badges

**Comparative Stats**:
- Week-over-week comparison
- Month-over-month trends
- Goal performance rankings

### 6.7 Additional Features (Creative Additions)

**Motivational Elements**:
- Achievement badges (7-day streak, 30-day streak, 100% week, etc.)
- Motivational quotes/messages
- Celebration animations on completion

**Smart Reminders** (Future Enhancement):
- Daily reminder notifications
- Custom reminder times per goal
- Missed goal notifications

**Goal Templates**:
- Pre-defined popular goals (Exercise 3x/week, Read daily, etc.)
- Quick-add from templates

**Notes & Reflection**:
- Daily journal entries
- Goal-specific notes
- Weekly reflection prompts

**Social Features** (Future Enhancement):
- Share progress with accountability partners
- Compare with friends (opt-in)

## 7. Database Operations (lib/db.ts)

### TypeScript Interfaces
```typescript
interface Goal {
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

interface Completion {
  id?: number;
  goalId: number;
  completionDate: string;  // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
  goal?: Goal;
}

interface Category {
  id?: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt?: string;
}

interface WeeklyProgress {
  goal: Goal;
  completionsThisWeek: number;
  targetDaysPerWeek: number;
  completionDates: string[];
  completionRate: number;
  status: 'on-track' | 'behind' | 'exceeded';
}
```

### Key Database Functions
```typescript
// Goals
export function getAllGoals(): Goal[]
export function getActiveGoals(): Goal[]
export function getGoalById(id: number): Goal | null
export function createGoal(goal: Goal): number
export function updateGoal(goal: Goal): boolean
export function deleteGoal(id: number): boolean
export function reorderGoals(goalIds: number[]): boolean

// Completions
export function getCompletionsForDate(date: string): Completion[]
export function getCompletionsForGoal(goalId: number, startDate: string, endDate: string): Completion[]
export function createCompletion(completion: Completion): number
export function deleteCompletion(id: number): boolean
export function isGoalCompletedOnDate(goalId: number, date: string): boolean

// Categories
export function getAllCategories(): Category[]
export function createCategory(category: Category): number
export function updateCategory(category: Category): boolean
export function deleteCategory(id: number): boolean

// Analytics
export function getWeeklyProgress(startDate: string, endDate: string): WeeklyProgress[]
export function getCompletionStats(startDate: string, endDate: string): Stats
export function getStreakForGoal(goalId: number): number
export function getCurrentStreaks(): Array<{ goalId: number; streak: number }>
```

## 8. Component Structure

### Key Components

**DailyCheckIn.tsx** (Client Component)
- Today's date display
- List of active goals with checkboxes
- Optimistic UI updates
- Completion animations

**WeeklyProgress.tsx** (Client Component)
- Week selector (current/previous weeks)
- Progress cards for each goal
- Visual day indicators (M T W T F S S)
- Completion percentage calculations

**GoalForm.tsx** (Client Component)
- Form for adding/editing goals
- Category dropdown
- Color picker
- Icon selector
- Target days input (1-7)

**GoalList.tsx** (Client Component)
- Sortable list with drag-and-drop
- Goal cards with edit/delete actions
- Filter by category
- Search functionality

**HistoryCalendar.tsx** (Client Component)
- Month view calendar
- Color-coded completion indicators
- Click to see details for a day
- Navigation between months

**TrendChart.tsx** (Client Component)
- Line chart of weekly completion rates
- Multiple goals comparison
- Time range selector

**StreakTracker.tsx** (Client Component)
- Current streak display per goal
- Streak history
- Milestone badges

**CategoryManager.tsx** (Client Component)
- CRUD interface for categories
- Color and icon selection
- Goal count per category

## 9. Page Routes

- `/` - Landing page or redirect to dashboard
- `/dashboard` - Main weekly progress dashboard
- `/check-in` - Daily check-in interface
- `/goals` - Goal management page
- `/history` - Historical calendar/list view
- `/analytics` - Trends and statistics
- `/categories` - Category management
- `/settings` - User preferences

## 10. UI/UX Design

### Visual Design
- **Clean, minimalist interface**
- **Card-based layouts** for goals and progress
- **Color-coded categories** for quick visual scanning
- **Progress bars** and **circular progress indicators**
- **Checkmark animations** on completion
- **Responsive design** (mobile-first)

### Navigation
- **Sidebar navigation** (desktop) with:
  - Dashboard
  - Today's Check-in
  - Goals
  - History
  - Analytics
  - Settings
- **Bottom tab bar** (mobile)

### Color Scheme
- Primary action: Blue (#3B82F6)
- Success/Complete: Green (#10B981)
- Warning/Behind: Yellow/Orange (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray scale for backgrounds

### Interactions
- **Quick check-in**: Single tap to complete goal
- **Swipe actions**: Swipe to complete or undo (mobile)
- **Drag-and-drop**: Reorder goals
- **Hover states**: Show additional options
- **Animations**: Satisfying completion animations

## 11. Deployment (Docker)

### Dockerfile
```dockerfile
FROM node:18-slim AS base

# Install dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 make g++ gcc sqlite3 libsqlite3-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm rebuild better-sqlite3 --build-from-source
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3501

RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

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

## 12. Development Workflow

### Setup
1. Clone repository
2. `npm install`
3. `npm run initialize` (creates database)
4. `npm run dev`
5. Access: http://localhost:3501

### Scripts
```json
{
  "dev": "next dev -p 3501",
  "build": "next build",
  "start": "next start -p 3501",
  "lint": "next lint",
  "initialize": "node scripts/setup-database.js"
}
```

## 13. Key Calculations & Logic

### Week Calculation
```typescript
// Get start and end of current week
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

### Completion Rate
```typescript
function calculateCompletionRate(
  completionsThisWeek: number,
  targetDaysPerWeek: number
): number {
  return (completionsThisWeek / targetDaysPerWeek) * 100;
}

function getStatus(completionRate: number): 'on-track' | 'behind' | 'exceeded' {
  if (completionRate >= 100) return 'exceeded';
  if (completionRate >= 70) return 'on-track';
  return 'behind';
}
```

### Streak Calculation
```typescript
function calculateStreak(goalId: number): number {
  // Get all completions for goal, ordered by date desc
  // Count consecutive days from most recent
  // Return streak count
}
```

## 14. Data Flow Examples

### Marking a Goal Complete
```
User clicks checkbox
  → POST /api/completions { goalId, completionDate, notes }
    → lib/db.ts: createCompletion()
      → Insert into completions table
      → Return completion ID
  → Component updates UI (optimistic)
  → Show success animation
  → Update weekly progress counts
```

### Viewing Weekly Progress
```
User navigates to dashboard
  → GET /api/weekly-summary?date=2025-01-15
    → lib/db.ts: getWeeklyProgress()
      → Calculate week range
      → Query goals and completions
      → Calculate rates and status
      → Return WeeklyProgress[]
  → Component renders progress cards
  → Show visual indicators for each day
```

## 15. Implementation Priority (Phases)

### Phase 1 - MVP (Core Functionality)
- Database setup with goals and completions tables
- Basic goal CRUD
- Daily check-in interface
- Weekly progress dashboard
- Simple completion marking

### Phase 2 - Enhanced UX
- Categories
- Drag-and-drop reordering
- Historical calendar view
- Basic analytics (completion rates)

### Phase 3 - Analytics & Insights
- Trend charts
- Streak tracking
- Comparative statistics
- Heatmap visualizations

### Phase 4 - Polish & Features
- Achievement badges
- Data export/import
- Advanced settings
- Performance optimizations

## 16. Error Handling & Edge Cases

### Edge Cases to Handle
- **Same-day multiple completions**: Prevent duplicate completions for same goal/date
- **Future dates**: Optionally allow/prevent marking goals complete for future dates
- **Deleted goals**: Keep completion history even after goal deleted
- **Week boundaries**: Handle week transitions correctly
- **Timezone considerations**: Store dates in YYYY-MM-DD format, calculate weeks in user's timezone

### Validation
- Target days per week: Must be 1-7
- Goal name: Required, max length
- Completion date: Valid date format, not in distant future
- Category assignment: Ensure category exists

## 17. Mobile Considerations

- **Touch-friendly**: Large tap targets for checkboxes
- **Swipe gestures**: Swipe to complete/undo
- **Bottom navigation**: Easy thumb access
- **Portrait-optimized**: Vertical scrolling layouts
- **PWA ready**: Installable web app
- **Offline support** (Future): Service workers for offline check-ins

## 18. Performance Optimizations

- **Indexed queries**: Index on completionDate and goalId
- **Efficient weekly queries**: Single query for week range
- **Optimistic UI**: Update UI before API response
- **Lazy loading**: Load analytics data on-demand
- **Caching**: Cache weekly summaries (short TTL)

---

## Summary: Building the Goal Tracker

This Weekly Goal Tracker uses the **exact same tech stack** as the Finance Tracker (Next.js, TypeScript, SQLite, Docker, Tailwind CSS) but with a **simpler, focused schema** designed for habit tracking.

### Key Differences from Finance Tracker:
- **Simpler database**: 4 tables vs 15+
- **Weekly cycles**: Instead of pay periods
- **Binary tracking**: Complete/incomplete vs financial amounts
- **Visual progress**: Emphasis on streaks, calendars, trends
- **Lighter analytics**: Focus on completion rates vs complex financial calculations

### Core Value Proposition:
Help users build consistency and accountability by making it **dead simple** to track daily progress toward weekly goals, with satisfying visual feedback and insightful trend analysis.

**Estimated Development Time**: 2-3 weeks for MVP, 4-6 weeks for full feature set.

---

**Specification Version**: 1.0  
**Target Port**: 3501  
**Database**: goals.db
