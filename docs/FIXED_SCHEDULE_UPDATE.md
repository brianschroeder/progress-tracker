# Fixed Schedule Update

## Overview
Updated the app to use a **fixed weekly schedule** model where planning is separate from tracking. This creates a clearer workflow and helps you know what to expect every week.

## Key Changes

### 1. Two-Page Workflow

#### Goals Page (`/goals`) - PLANNING
- **Set your weekly schedule** here
- Select which days each goal should be done
- Reorder goals to match your priorities
- This is your "weekly template"

#### Home Page (`/`) - TRACKING
- **Track completions only** - no planning
- See your schedule (blue highlights)
- Mark goals complete/incomplete
- View progress against your schedule

### 2. Calendar Cell Behavior

#### NEW Behavior (Fixed Schedule)
Cells now have **3 distinct visual states**:

1. **Not Scheduled** (White/Gray)
   - No blue highlight
   - Empty cell
   - Click to mark complete anyway (off-schedule completion)

2. **Scheduled** (Blue)
   - Light blue background
   - Blue border with ring effect
   - Small blue dot indicator
   - Click to mark complete

3. **Completed** (Green)
   - Green background with checkmark
   - If it's a scheduled day: **blue border remains visible**
   - Click to unmark completion

#### OLD Behavior (Removed)
- ❌ No more 3-state cycle (empty → planned → completed → empty)
- ❌ Can't change planning from the main calendar
- ❌ Planning is now ONLY done from Goals page

### 3. Visual Indicators

#### Always-Visible Schedule
- **Blue highlights persist** even when goals are completed
- You always see your weekly plan at a glance
- Completed scheduled days show green with a **blue border**
- This way you know "I'm on track with my schedule"

#### Cell States Visual Guide
```
┌──────────────┬────────────────────┬────────────────┐
│ State        │ Appearance         │ What it means  │
├──────────────┼────────────────────┼────────────────┤
│ Not          │ ⬜ White/Gray      │ Not on your    │
│ Scheduled    │    Empty           │ schedule       │
├──────────────┼────────────────────┼────────────────┤
│ Scheduled    │ 🔵 Blue bg         │ On your        │
│ (Incomplete) │    Blue border     │ schedule,      │
│              │    Blue ring       │ not done yet   │
│              │    • Blue dot      │                │
├──────────────┼────────────────────┼────────────────┤
│ Completed    │ ✅ Green bg        │ Done!          │
│ (Scheduled)  │    Blue border     │ (Scheduled day)│
│              │    ✓ Checkmark     │                │
├──────────────┼────────────────────┼────────────────┤
│ Completed    │ ✅ Green bg        │ Done!          │
│ (Not Sched.) │    Green border    │ (Off-schedule) │
│              │    ✓ Checkmark     │                │
└──────────────┴────────────────────┴────────────────┘
```

### 4. UI Enhancements

#### Info Banner
Added a helpful banner at the top explaining:
- How the system works
- Where to set your schedule
- What the colors mean

#### Legend
Visual legend showing:
- Not scheduled (white)
- Scheduled (blue)
- Completed (green)

#### Day Indicators
Below each goal name, see which days are scheduled:
```
🔵 Gym
   S M T W T F S
   ⚪🔵⚪🔵⚪🔵⚪  <- Blue = scheduled
```

## User Workflow

### Initial Setup
1. Go to **"Manage Goals"** page
2. Click **"Add Goal"**
3. Fill in goal details
4. **Select specific days** in the day selector
5. Save the goal
6. Repeat for all your weekly goals

### Weekly Usage
1. Look at your **main calendar**
2. See blue highlights for scheduled days
3. **Click cells** to mark goals complete as you do them
4. Green checkmarks show your progress
5. Blue borders on completed cells remind you of your schedule

### Adjusting Schedule
1. Go to **"Manage Goals"** page
2. Click the **pencil icon** to edit a goal
3. Change the selected days
4. Save
5. Calendar updates automatically

## Benefits

### 1. Clarity
- Clear separation between planning and tracking
- No confusion about what "clicking" does
- Visual feedback matches mental model

### 2. Consistency
- Your schedule is visible every week
- Blue highlights show "this is when I do this"
- Even when complete, you see the schedule

### 3. Accountability
- See at a glance: "Did I do my scheduled tasks?"
- Off-schedule completions are still tracked (no blue border)
- Progress tracker shows adherence to your plan

### 4. Flexibility
- Can still mark goals complete on non-scheduled days
- Schedule is a guide, not a restriction
- Easy to adjust schedule in Goals page

## Examples

### Example 1: Gym (M/W/F)
```
Goal: Gym
Days: Mon, Wed, Fri

Calendar view:
Mon  Tue  Wed  Thu  Fri  Sat  Sun
🔵   ⬜   🔵   ⬜   🔵   ⬜   ⬜   <- Scheduled

After working out Mon & Wed:
✅🔵  ⬜   ✅🔵  ⬜   🔵   ⬜   ⬜   <- Blue border on completed
```

### Example 2: Reading (Daily)
```
Goal: Reading
Days: All 7 days

Calendar view:
Mon  Tue  Wed  Thu  Fri  Sat  Sun
🔵   🔵   🔵   🔵   🔵   🔵   🔵   <- All scheduled

After reading 5 days:
✅🔵 ✅🔵 ✅🔵 🔵  ✅🔵  ⬜   ✅🔵
```

## Technical Details

### Cell Click Handler
```typescript
async function handleCellClick(goal: Goal, date: Date) {
  // Simple toggle: only mark complete or incomplete
  // Planning is ONLY done from the Goals page
  await toggleCompletion(goal, date);
}
```

### Cell Styling Logic
```typescript
isCompleted && isPlanned
  ? 'bg-success border-blue-400'  // Green with blue border
  : isCompleted
  ? 'bg-success border-success'    // All green
  : isPlanned
  ? 'bg-blue-100 border-blue-500'  // Blue scheduled
  : 'border-gray-300 bg-white'     // Not scheduled
```

### Database
- `daysOfWeek` field stores the schedule: `[1,3,5]` = Mon/Wed/Fri
- Completions tracked separately in `completions` table
- Schedule persists week-to-week

## Migration Notes

### For Existing Users
Your existing goals won't have scheduled days set. To add them:

1. Visit the Goals page
2. Edit each goal
3. Select the days you want
4. Save

The calendar will immediately show your schedule.

## Future Enhancements

Potential additions:
- Copy schedule to next week
- Schedule templates (e.g., "MWF Template")
- Bulk edit schedules
- Schedule history/versioning
- "Reschedule" feature for missed days
