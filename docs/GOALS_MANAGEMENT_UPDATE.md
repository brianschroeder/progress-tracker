# Goals Management Update

## Overview
Added a dedicated goals management page with full CRUD operations and reordering capabilities.

## New Features

### 1. Separate Goals Management Page (`/goals`)
- **Full-featured goal editor** with all fields
- **Goal reordering** with up/down arrow buttons
- **Comprehensive goal information display**:
  - Name and description
  - Target days per week
  - Scheduled days
  - Category
  - Color indicator
- **Easy navigation** back to the main calendar view

### 2. Enhanced Main Page
- **Full-width calendar view** - Maximum space for your weekly goals grid
- **Clean, focused interface** - Only the calendar, no distractions
- **"Manage Goals" button** in the header for easy access to full management page
- **Streamlined experience** - All goal management happens on the dedicated page

## User Flow

### Adding a New Goal
1. Click "Manage Goals" in the header to navigate to `/goals`
2. Click the "Add Goal" button
3. Fill in goal details:
   - Name (required)
   - Description (optional)
   - Target days per week (required, 1-7)
   - Specific days (optional - select which days of the week)
   - Category (optional)
   - Color (defaults to blue)
3. Click "Create Goal"

### Editing a Goal
1. Navigate to `/goals` page via "Manage Goals" button
2. Click the pencil icon next to any goal
3. Modify the fields you want to change
4. Click "Update Goal"

### Reordering Goals
1. Navigate to `/goals` page
2. Use the up/down arrow buttons next to each goal
3. Goals will reorder immediately
4. Order is preserved across all views (calendar, sidebar, etc.)

### Deleting a Goal
1. Navigate to `/goals` page
2. Click the trash icon next to the goal
3. Confirm deletion (this will also delete all associated completions)

## Technical Details

### New Files
- `app/goals/page.tsx` - Full goals management page with CRUD and reordering

### Modified Files
- `app/page.tsx` - Added navigation button to goals page, simplified sidebar view

### API Endpoints Used
- `GET /api/goals?active=true` - Fetch all active goals
- `POST /api/goals` - Create new goal
- `PUT /api/goals/[id]` - Update existing goal
- `DELETE /api/goals/[id]` - Delete goal
- `POST /api/goals/reorder` - Update goal order
- `GET /api/categories` - Fetch categories for goal assignment

### Key Components
- **DaySelector** - Interactive day-of-week selector with quick presets
- **Modal** - Reusable modal for goal forms
- **Goal reordering** - Swap-based reordering with immediate persistence

## Benefits

1. **Maximum Screen Space** - Full-width calendar view for better visibility
2. **Cleaner Main View** - Focus exclusively on tracking your week
3. **Better Organization** - Dedicated space for comprehensive goal management
4. **Flexible Planning** - Reorder goals to match your priorities
5. **Intuitive UX** - Separate concerns: calendar for tracking, goals page for managing
6. **Distraction-Free** - No sidebar clutter, just your weekly progress at a glance

## Next Steps

The application now has:
- ✅ Calendar view with 3-state cells (empty → planned → completed)
- ✅ Goal management with full CRUD operations
- ✅ Goal reordering capabilities
- ✅ Day-specific planning with visual indicators
- ✅ Clean, focused single-page experience for the main view
- ✅ Dedicated management page for power users

You can access the application at:
- Main Calendar: http://localhost:3001
- Goals Management: http://localhost:3001/goals
