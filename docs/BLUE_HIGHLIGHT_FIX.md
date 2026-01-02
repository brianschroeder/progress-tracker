# Blue Highlight Fix

## Issue
Selected days in the goal form were not being saved to the database, so planned days weren't showing up as blue on the calendar.

## Root Cause
The API endpoints for creating and updating goals were missing the `daysOfWeek` field. When you selected days in the form, they weren't being sent to or saved in the database.

## Fixes Applied

### 1. Fixed POST Endpoint (`/api/goals/route.ts`)
Added `daysOfWeek` to the goal object when creating new goals:

```typescript
const goal: Omit<Goal, 'id' | 'createdAt'> = {
  name: body.name,
  description: body.description,
  targetDaysPerWeek: body.targetDaysPerWeek,
  daysOfWeek: body.daysOfWeek || undefined,  // ✅ ADDED
  categoryId: body.categoryId,
  color: body.color || '#3B82F6',
  icon: body.icon || 'target',
  isActive: body.isActive !== undefined ? body.isActive : true,
  sortOrder: body.sortOrder || 0,
};
```

### 2. Fixed PUT Endpoint (`/api/goals/[id]/route.ts`)
Added `daysOfWeek` to the goal object when updating existing goals:

```typescript
const goal: Goal = {
  id: Number(params.id),
  name: body.name,
  description: body.description,
  targetDaysPerWeek: body.targetDaysPerWeek,
  daysOfWeek: body.daysOfWeek || undefined,  // ✅ ADDED
  categoryId: body.categoryId,
  color: body.color,
  icon: body.icon,
  isActive: body.isActive,
  sortOrder: body.sortOrder,
};
```

### 3. Added Visual Day Indicator
Added a small day-of-week indicator below each goal name in the calendar view, so you can see which days are selected:

```
Goal Name
S M T W T F S   <- Blue = selected, Gray = not selected
```

### 4. Added Debug Logging
Added console logging to help diagnose issues with goal loading.

## How to Test

### For NEW Goals:
1. Go to "Manage Goals" page
2. Click "Add Goal"
3. Fill in the goal details
4. In the "Specific Days" section, select days (e.g., Mon, Wed, Fri)
5. Click "Create Goal"
6. Go back to the main calendar
7. ✅ Those days should now be **highlighted in BLUE** for that goal

### For EXISTING Goals:
Your existing goals won't have days selected yet. To add them:

1. Go to "Manage Goals" page
2. Click the pencil icon (✏️) next to a goal
3. Select the days you want for that goal
4. Click "Update Goal"
5. Go back to the main calendar
6. ✅ Those days should now be **highlighted in BLUE** for that goal

## Visual Guide

### Calendar States:
- **White (Empty)**: Day is not planned for this goal
- **Blue (Planned)**: Day is planned - you scheduled this goal for this day
- **Green (Completed)**: Goal was completed on this day ✓

### Click Cycle:
```
Empty → (click) → Planned (Blue) → (click) → Completed (Green) → (click) → Empty
```

### Day Indicator in Goal List:
```
🔵 Gym
   S M T W T F S     <- Shows M,W,F in blue (Monday, Wednesday, Friday)
```

## Database Notes

The `daysOfWeek` field is stored as JSON in the database:
- Empty/not set: `NULL`
- Some days: `[1,3,5]` (e.g., Monday, Wednesday, Friday)
- All days: `[0,1,2,3,4,5,6]`

Day numbers follow JavaScript's convention:
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

## Troubleshooting

If blue highlights still don't appear:

1. **Check browser console** for the debug log showing goal data
2. **Refresh the page** to reload goal data
3. **Try editing an existing goal** and re-saving it with selected days
4. **Create a new test goal** with selected days to verify the fix works
5. **Check the day indicator** below the goal name to see if days are saved

## Next Steps

After the fix:
1. Edit your existing goals to select their planned days
2. New goals will automatically save selected days
3. Blue highlights will appear on the calendar for all planned days
