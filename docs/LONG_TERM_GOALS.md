# Long-Term Goals Feature

## Overview
Added two new pages for long-term goal planning: **Year Goals** and **10-Year Vision**. These complement the existing weekly goal tracking system with broader time horizons.

## New Pages

### 1. Year Goals (`/year-goals`)

**Purpose**: Annual goal planning and tracking

**Features**:
- ✅ Create yearly goals with categories
- ✅ Set target dates within the year
- ✅ Track progress with visual progress bars
- ✅ Drag slider to update progress percentage
- ✅ Mark goals as complete
- ✅ Stats dashboard (Total, Completed, Completion Rate)
- ✅ Color-coded categories

**Categories**:
- Career (Blue)
- Health (Green)
- Finance (Amber)
- Relationships (Red)
- Personal Growth (Purple)
- Learning (Cyan)

**Goal Structure**:
```typescript
interface YearGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  isCompleted: boolean;
  progress: number; // 0-100
  color: string;
}
```

**UI Elements**:
- Hero header: "{Current Year} Goals"
- Gradient text: "achieve this year"
- Progress slider for each goal
- Category badges with category colors
- Completion toggle button

### 2. 10-Year Vision (`/decade-goals`)

**Purpose**: Long-term visionary goal setting

**Features**:
- ✅ Create aspirational 10-year goals
- ✅ Define key milestones for each goal
- ✅ Rich descriptions with vision statements
- ✅ Category-based organization
- ✅ Achievement tracking
- ✅ Inspirational quote section

**Categories**:
- Career & Business (Blue)
- Health & Fitness (Green)
- Financial Freedom (Amber)
- Relationships & Family (Red)
- Personal Mastery (Purple)
- Impact & Legacy (Cyan)

**Goal Structure**:
```typescript
interface DecadeGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  milestones: string[]; // Up to 3 key milestones
  isCompleted: boolean;
  color: string;
}
```

**UI Elements**:
- Hero header: "10-Year Vision" with sparkle icons
- Target year display: "Where do you see yourself in {Year}?"
- Milestone bullets with numbered badges
- Larger cards with more emphasis
- Inspirational quote at bottom

## Navigation Updates

### Sidebar Icons
Added two new navigation items to the sidebar:

1. **Calendar Icon** (📅) - Year Goals
   - Outline: `CalendarIcon`
   - Solid: `CalendarIconSolid`

2. **Trophy Icon** (🏆) - 10-Year Goals
   - Outline: `TrophyIcon`
   - Solid: `TrophyIconSolid`

### Navigation Order
1. Calendar (Weekly tracking)
2. Daily Focus
3. Goals (Weekly goals management)
4. Year Goals ← NEW
5. 10 Year Goals ← NEW

## Design Consistency

Both pages follow the same design system:

### Layout
- Centered content (max-w-5xl)
- Generous whitespace (py-12, px-6)
- Hero section at top
- Stats cards when goals exist
- Action button (Create goal)
- Goals list or empty state

### Colors
- Accent: Blue (#3B82F6)
- Success: Green (#22C55E)
- Category-specific colors
- Gradient orbs for decoration

### Typography
- Hero title: text-5xl font-semibold
- Subtitle: text-2xl with gradient accent
- Card titles: text-lg to text-2xl
- Labels: text-xs uppercase tracking-wide

### Components
- Rounded-2xl cards
- Shadow-soft borders
- Transition-smooth animations
- Modal overlays for forms
- Color-coded category badges

## User Flows

### Year Goals Flow
1. Click **Calendar icon** in sidebar
2. View current year goals or empty state
3. Click **"New Year Goal"** button
4. Fill in form:
   - Goal title
   - Description (optional)
   - Category (auto-colors)
   - Target date
5. Submit to create
6. Track progress:
   - Drag slider to update %
   - Click checkbox when complete
7. Edit or delete as needed

### 10-Year Goals Flow
1. Click **Trophy icon** in sidebar
2. View 10-year vision or empty state
3. Click **"New 10-Year Goal"** button
4. Fill in form:
   - Goal title
   - Vision description (required)
   - Life area category
   - 3 optional milestones
5. Submit to create
6. Review and reflect:
   - Read vision statement
   - Check milestone progress
   - Mark as achieved (long-term)
7. Edit or delete as needed

## Key Differences

### Year Goals vs Weekly Goals
- **Time Horizon**: 12 months vs 1 week
- **Tracking**: Progress percentage vs daily checkmarks
- **Focus**: Project completion vs habit formation
- **Examples**: "Launch business" vs "Exercise 3x/week"

### Year Goals vs 10-Year Goals
- **Time Horizon**: 1 year vs 10 years
- **Specificity**: Concrete & achievable vs aspirational
- **Milestones**: Target date vs key checkpoints
- **Tracking**: Progress slider vs achievement flag
- **Examples**: "Get promoted" vs "Build financial empire"

## Data Persistence

Currently using **in-memory state** (useState):
- Goals reset on page refresh
- Suitable for demo/prototype
- Future: Add database persistence

**Implementation Options**:
1. **SQLite** (like weekly goals)
   - Create `year_goals` table
   - Create `decade_goals` table
   - Use same API pattern

2. **LocalStorage** (quick solution)
   - Save to browser storage
   - Persist across sessions
   - No backend needed

3. **API Endpoints** (full solution)
   - `/api/year-goals` - CRUD operations
   - `/api/decade-goals` - CRUD operations
   - Sync with database

## Future Enhancements

### Year Goals
- [ ] Monthly breakdown view
- [ ] Quarterly review reminders
- [ ] Progress charts/graphs
- [ ] Goal templates by category
- [ ] Import from previous year
- [ ] Export to PDF report
- [ ] Habit linking (connect to weekly goals)

### 10-Year Goals
- [ ] 1-3-5-10 year milestone view
- [ ] Vision board (images)
- [ ] Journal/reflection entries
- [ ] Progress photos
- [ ] Share your vision (social)
- [ ] Mentor comments
- [ ] Related resources/books

### Both
- [ ] Reminders/notifications
- [ ] Goal dependencies
- [ ] Tags/keywords
- [ ] Search & filter
- [ ] Archive completed goals
- [ ] Statistics & insights
- [ ] Goal templates library
- [ ] Collaboration (shared goals)

## Benefits

### Personal Development
- **Multiple time horizons**: Daily, weekly, yearly, decade
- **Comprehensive planning**: Short and long-term alignment
- **Visual progress**: See how daily actions lead to big dreams
- **Reflection tool**: Review and adjust over time

### User Experience
- **Consistent design**: Same look/feel as weekly goals
- **Easy navigation**: Sidebar always accessible
- **Clear hierarchy**: Different pages for different timeframes
- **Motivational**: Inspirational quotes and vision statements

### Goal Psychology
- **SMART goals**: Year goals are specific and measurable
- **Big Hairy Audacious Goals**: 10-year vision thinks bigger
- **Milestone thinking**: Break down large goals
- **Category balance**: Ensure life area coverage

## Files Added

1. `app/year-goals/page.tsx` - Year goals page
2. `app/decade-goals/page.tsx` - 10-year goals page
3. `LONG_TERM_GOALS.md` - This documentation

## Files Modified

1. `components/Sidebar.tsx` - Added two new navigation items

## Usage Examples

### Year Goal Examples
- "Save $10,000 for emergency fund"
- "Run a half marathon"
- "Get AWS certification"
- "Read 24 books"
- "Launch side business"

### 10-Year Goal Examples
- "Build a multi-million dollar company"
- "Achieve financial independence"
- "Write and publish a book"
- "Create a lasting positive impact on 1000+ lives"
- "Master 3 languages fluently"
- "Own a home with no mortgage"

## Conclusion

These new pages provide a complete goal-setting system:
- **Daily**: Daily Focus page
- **Weekly**: Main calendar + goals management
- **Yearly**: Year Goals page
- **Decade**: 10-Year Vision page

Users can now plan and track goals across all time horizons in one cohesive app with a beautiful, consistent interface.
