# Weekly Goal Tracker - Project Documentation

This folder contains complete technical specifications for building a **Weekly Goal Tracker** application using the same technology stack as the Finance Tracker.

## 📋 Documents Overview

### 1. **GOAL_TRACKER_SPEC.md** (Comprehensive Specification)
**Purpose**: Detailed technical specification with full architecture, database design, and implementation details.

**Contents**:
- Complete technology stack
- Database schema with all tables
- API endpoint documentation
- Component architecture
- Page routing structure
- UI/UX guidelines
- Docker deployment configuration
- Implementation phases
- Edge cases and error handling

**Use Case**: Reference document for understanding the complete system architecture and design decisions.

---

### 2. **AI_BUILD_PROMPT.md** (AI-Ready Build Instructions)
**Purpose**: Complete, actionable prompt that can be given to AI assistants (Claude, ChatGPT, etc.) to build the entire application.

**Contents**:
- Clear project overview and user flow
- Required tech stack
- Complete database schema with SQL
- All required API endpoints
- Required pages and features
- Key components to build
- Code examples and logic implementations
- Docker configuration
- Step-by-step implementation guide
- Success criteria

**Use Case**: Copy this entire document and paste it into an AI chat to have the AI build the application from scratch.

---

## 🎯 Application Purpose

Track daily progress toward weekly goals and habits:
- Define goals with target completion frequencies (e.g., "Gym 3x per week")
- Check off goals each day you complete them
- View weekly progress with visual indicators
- Analyze trends, streaks, and completion rates over time
- Stay accountable and build consistency

---

## 🛠️ Technology Stack

Same as Finance Tracker:
- **Next.js** (App Router) with **TypeScript**
- **SQLite** with **better-sqlite3**
- **Tailwind CSS** for styling
- **React** for UI components
- **Chart.js** and **Recharts** for visualizations
- **Docker** for containerized deployment
- **date-fns** for date handling
- **@dnd-kit** for drag-and-drop

---

## 🚀 How to Use These Documents

### Option 1: Build with AI (Recommended for Speed)
1. Open your preferred AI assistant (Claude, ChatGPT, etc.)
2. Copy the entire contents of **AI_BUILD_PROMPT.md**
3. Paste into the AI chat
4. Ask the AI to "Build this application following these specifications"
5. The AI will generate all the code files needed
6. Review and run the generated code

### Option 2: Manual Development
1. Read through **GOAL_TRACKER_SPEC.md** for architecture understanding
2. Follow the implementation phases outlined in Section 15
3. Use **AI_BUILD_PROMPT.md** as a checklist for required features
4. Reference specific sections as needed during development

### Option 3: Hybrid Approach (Best for Learning)
1. Use AI to scaffold the initial project structure
2. Manually implement core features to understand the system
3. Use AI for repetitive tasks (CRUD operations, similar components)
4. Refer to spec documents for design decisions and patterns

---

## 📊 Key Differences from Finance Tracker

| Aspect | Finance Tracker | Goal Tracker |
|--------|----------------|--------------|
| **Purpose** | Financial management | Habit/goal tracking |
| **Database Tables** | 15+ tables | 4 tables |
| **Complexity** | Complex calculations | Simple binary tracking |
| **Time Focus** | Pay periods | Weekly cycles |
| **Primary Metric** | Dollars | Completion counts |
| **Analytics** | Budget vs actual | Completion rates, streaks |

**Simpler but focused**: Goal Tracker has fewer moving parts but still uses the same robust architecture.

---

## 🗂️ Database Schema (4 Tables)

1. **goals** - User's goals with target frequencies
2. **completions** - Records of completed goals by date
3. **categories** - Organize goals into categories
4. **user_settings** - User preferences (week start day, etc.)

Simple schema compared to Finance Tracker's 15+ tables!

---

## ✨ Key Features

### MVP (Phase 1)
- ✅ Add, edit, delete goals
- ✅ Mark goals complete for today
- ✅ View weekly progress dashboard
- ✅ Basic categories

### Enhanced (Phase 2)
- ✅ Historical calendar view
- ✅ Drag-and-drop goal reordering
- ✅ Category management
- ✅ Completion trends

### Advanced (Phase 3)
- ✅ Streak tracking
- ✅ Analytics and charts
- ✅ Achievement badges
- ✅ Data export/import

---

## 🐳 Docker Deployment

Application runs on **port 3501** in a Docker container:

```bash
docker-compose up -d
```

Data persists in `./data/goals.db` via volume mounting.

---

## 📱 User Experience

**Daily Workflow**:
1. Morning: Open app, check yesterday's completed goals
2. View dashboard: See weekly progress at a glance
3. Motivated by streaks and completion rates
4. Weekly review: Analyze trends and adjust goals

**Mobile-First**: Optimized for quick daily check-ins on phone.

---

## 🎨 UI/UX Highlights

- **Clean, minimal interface** focused on daily check-ins
- **Visual progress bars** for each goal
- **Color-coded status** (on track, behind, exceeded)
- **Satisfying animations** when completing goals
- **Calendar heatmap** for historical view
- **Streak counters** for motivation
- **Drag-and-drop** for easy reordering

---

## 📈 Analytics Features

- **Weekly completion rates** over time (line chart)
- **Current streaks** per goal
- **Best performing goals** (highest completion rates)
- **Completion by day of week** (which days are you most productive?)
- **Heatmap calendar** (GitHub-style contribution graph)

---

## 🔧 Development Timeline

**MVP (Core Features)**: 1-2 weeks
- Database setup
- Basic CRUD operations
- Daily check-in interface
- Weekly progress dashboard

**Enhanced Features**: 1-2 weeks
- Historical views
- Analytics and charts
- Categories and organization
- UI polish

**Total Estimated Time**: 3-4 weeks for fully featured application

---

## 🤖 AI Implementation Tips

When using AI to build this:

1. **Start with database**: Get the schema and `lib/db.ts` functions right first
2. **Build API routes next**: Ensure data layer works before UI
3. **Test as you go**: Ask AI to test each endpoint
4. **Component-by-component**: Build one page/component at a time
5. **Iterate**: Start simple, add features incrementally

**Sample AI Prompts**:
- "Implement the database layer with all functions from the spec"
- "Create the API route for goals management"
- "Build the DailyCheckIn component with checkboxes"
- "Implement the weekly progress calculation logic"
- "Add drag-and-drop reordering to the goals list"

---

## 📚 Additional Resources

- **Finance Tracker Reference**: See the original finance tracker codebase for patterns
- **Next.js Docs**: https://nextjs.org/docs
- **better-sqlite3 Docs**: https://github.com/WiseLibs/better-sqlite3
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Chart.js Docs**: https://www.chartjs.org/docs

---

## ⚠️ Important Notes

- **Date Format**: Always use `YYYY-MM-DD` for dates in database
- **Unique Constraint**: Prevent duplicate completions per goal per day
- **Soft Deletes**: Keep completion history when goals are deleted
- **Week Calculation**: Handle different week start days (Sunday vs Monday)
- **Timezone**: Calculate weeks in user's local timezone

---

## 🎯 Success Criteria

Application is complete when:

✅ User can add goals with target days per week  
✅ User can check off goals daily  
✅ Dashboard shows clear weekly progress  
✅ Historical data is viewable and accurate  
✅ Works in Docker container  
✅ Mobile responsive  
✅ Data persists correctly  

---

## 🆘 Troubleshooting

**Database Issues**:
- Ensure `data/` directory exists
- Check file permissions for SQLite
- Run initialization script: `npm run initialize`

**Docker Issues**:
- Ensure port 3501 is available
- Check volume mounting for data persistence
- Rebuild with `docker-compose up --build`

**AI Generation Issues**:
- Break prompt into smaller pieces if AI gets stuck
- Ask for one file at a time
- Use specific section references from spec docs

---

## 🤝 Contributing

This is a personal project specification, but you can:
- Extend the spec for additional features
- Add new analytics or visualization ideas
- Improve the AI prompt for better results
- Share your implementation experiences

---

## 📝 License

These specification documents are provided as-is for building your own goal tracking application. Use freely!

---

## 🚀 Get Started

**Quick Start**:
1. Copy **AI_BUILD_PROMPT.md** into Claude or ChatGPT
2. Ask: "Build this application step by step"
3. Follow along and test each generated component
4. Deploy with Docker when complete

**Estimated Time**: 4-8 hours with AI assistance

---

**Built with the same solid architecture as Finance Tracker, adapted for habit tracking! 🎯**
