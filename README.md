# 🎯 Weekly Goal Tracker - Simplified

A streamlined, single-page app for planning and tracking your weekly goals.

## ✨ Features

### One Page, Everything You Need
- **Weekly Calendar Grid** - See your entire week at a glance
- **Goals Sidebar** - Quick access to add, edit, and delete goals
- **Dual Mode Toggle** - Switch between Planning and Tracking
- **Week Navigation** - Navigate between weeks easily

### Planning Mode ⭐
- Click stars to assign goals to specific days
- Build your weekly schedule visually
- See which days are planned for each goal

### Tracking Mode ✓
- Click checkboxes to mark goals complete
- Small stars remind you of planned days
- Track your progress throughout the week

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run initialize  # Set up database
npm run dev        # Start on port 3501
```

Open http://localhost:3501

### Docker
```bash
docker-compose up -d
```

Open http://localhost:3501

---

## 📁 Project Structure

```
app/
  ├── api/              # API routes
  ├── page.tsx          # Main single-page app
  ├── layout.tsx        # Root layout
  └── globals.css       # Styles

components/
  ├── ui/               # UI components
  └── DaySelector.tsx   # Day selection component

lib/
  ├── db.ts             # Database operations
  ├── date-utils.ts     # Date helpers
  └── utils.ts          # Utilities

types/
  └── index.ts          # TypeScript types
```

---

## 🎯 Core Functionality

### Must-Have Features (Included)
✅ Add/Edit/Delete Goals
✅ Weekly Calendar Grid View
✅ Toggle between Planning and Tracking modes
✅ Assign goals to specific days
✅ Mark goals as complete
✅ Week-by-week navigation
✅ Color-coded goals
✅ Target days per week
✅ Weekly progress stats

### Removed (Can Add Later)
- ❌ Separate Dashboard page
- ❌ Daily Check-In page
- ❌ History Calendar page
- ❌ Analytics/Streaks page
- ❌ Settings page
- ❌ Navigation sidebar
- ❌ Multiple tabs/pages

---

## 💾 Database

**SQLite Tables:**
- `goals` - Your goals with targets and schedules
- `completions` - Completion records by date
- `categories` - Goal categories
- `user_settings` - User preferences

---

## 🎮 How to Use

1. **Add Goals** - Click + button in goals sidebar
2. **Plan Week** - Toggle to ⭐ Plan mode, click stars to schedule days
3. **Track Progress** - Toggle to ✓ Track mode, click checkboxes to mark complete
4. **Navigate Weeks** - Use ◄ ► buttons or "Current Week" button

---

## 🔧 Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **SQLite** - Database (better-sqlite3)
- **Tailwind CSS** - Styling
- **Docker** - Containerization

---

## 📊 API Endpoints

- `GET/POST /api/goals` - Goals CRUD
- `GET/PUT/DELETE /api/goals/[id]` - Individual goal
- `GET/POST /api/completions` - Completions
- `DELETE /api/completions/[id]` - Remove completion
- `GET /api/categories` - Categories

---

## 🎨 Design Philosophy

**Simple & Focused:**
- One page does everything
- No unnecessary navigation
- Toggle between modes inline
- Clean, minimal interface

**Quick & Efficient:**
- See entire week at once
- Plan and track in same view
- Fast goal management
- No page loads or transitions

---

## 🚀 Future Enhancements

When ready to expand:
- Analytics dashboard
- Streak tracking
- Historical views
- Data export
- More categories
- Mobile app
- Reminders

---

## 📝 Commands

```bash
npm run dev         # Development server
npm run build       # Build for production  
npm run start       # Production server
npm run initialize  # Reset database
npm run migrate     # Run migrations

docker-compose up   # Start in Docker
docker-compose down # Stop Docker
```

---

## 🎯 Perfect For

- Weekly planning sessions
- Building consistent habits
- Simple goal tracking
- Visual progress monitoring
- Structured weekly routines

---

**Built for simplicity. Everything you need, nothing you don't.** 🎯

*Version: 2.0.0 (Consolidated)*
