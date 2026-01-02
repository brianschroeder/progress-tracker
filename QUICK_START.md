# ⚡ Quick Start Guide - Weekly Goal Tracker

## 🎉 Your Application is Running!

### Access Points

**Development Server:**
- URL: http://localhost:3001
- Status: ✅ Running

**Docker Production:**
- URL: http://localhost:3501
- Status: ✅ Running
- Container: `goal-tracker`

---

## 🚀 Immediate Next Steps

### 1. **Open the Application**

**Development:** http://localhost:3001
**Production (Docker):** http://localhost:3501

### 2. **Explore the Features**

- **Dashboard** - View your weekly progress
- **Daily Check-In** - Mark today's completed goals
- **Goals** - Manage your goals and categories
- **History** - Calendar view of past completions
- **Analytics** - Track your streaks and achievements
- **Settings** - Configure preferences and export data

### 3. **Sample Data Included**

The app comes with:
- ✅ 3 sample goals (Gym, Reading, Meditation)
- ✅ 4 categories (Health, Work, Personal, Social)
- ✅ Ready to use database

---

## 🎯 Common Commands

### Development

```bash
# Start dev server
npm run dev

# On specific port
npm run dev -- -p 3001

# Initialize/reset database
npm run initialize

# Build for production
npm run build
```

### Docker

```bash
# Start container
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild image
docker-compose build

# Restart container
docker-compose restart
```

### Database Management

```bash
# Reset database with sample data
npm run initialize

# Backup database
cp data/goals.db data/goals-backup.db

# View database (install sqlite3)
sqlite3 data/goals.db
```

---

## 📊 Application Status

### ✅ Completed Features

| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard | ✅ | Weekly progress overview |
| Daily Check-In | ✅ | Mark goals complete |
| Goals Management | ✅ | CRUD operations |
| History Calendar | ✅ | Past completions view |
| Analytics | ✅ | Streaks & achievements |
| Settings | ✅ | Preferences & export |
| API Endpoints | ✅ | 15+ RESTful routes |
| Database | ✅ | SQLite with sample data |
| Docker | ✅ | Production container |
| Responsive Design | ✅ | Mobile & desktop |

---

## 🔧 Troubleshooting

### Port Already in Use

If you get `EADDRINUSE` error:

```bash
# Find process using the port
netstat -ano | findstr :3501

# Or use a different port
npm run dev -- -p 3002
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Errors

```bash
# Reset database
npm run initialize

# Or delete and recreate
rm data/goals.db
npm run initialize
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `data/goals.db` | Your database (auto-created) |
| `docker-compose.yml` | Docker configuration |
| `Dockerfile` | Container build instructions |
| `package.json` | Dependencies & scripts |
| `README.md` | Full documentation |
| `DEPLOYMENT_GUIDE.md` | Detailed deployment info |

---

## 🎨 Customization Ideas

1. **Add More Goals**
   - Go to Goals page
   - Click "Add Goal"
   - Set name, target frequency, category, color

2. **Create Custom Categories**
   - Create via API: `POST /api/categories`
   - Or add to database initialization script

3. **Change Colors**
   - Edit `tailwind.config.ts`
   - Modify goal colors in UI

4. **Export Your Data**
   - Settings page → Export Data
   - Downloads JSON with all data

---

## 📈 Usage Tips

### Daily Routine

1. **Morning**: Open dashboard to see weekly progress
2. **Throughout Day**: Complete your goals
3. **Evening**: Open Check-In page, mark completed goals
4. **Weekly**: Review Analytics for streaks

### Best Practices

- ✅ Set realistic targets (start with 3x/week)
- ✅ Check in daily for accurate tracking
- ✅ Celebrate streaks and achievements
- ✅ Export data regularly for backup
- ✅ Adjust goals as needed

---

## 🐛 Known Issues

- ⚠️ Port 3500 was in use (using 3501 for Docker instead)
- ⚠️ Some lockfile warnings during build (non-critical)
- ✅ All features working correctly

---

## 📞 Support

If you encounter issues:

1. Check terminal logs for errors
2. Verify database exists: `ls data/`
3. Check Docker logs: `docker-compose logs`
4. Restart services: `docker-compose restart`

---

## 🎊 Success Metrics

Your **Weekly Goal Tracker** includes:

- ✅ **6 Pages** - All functional and responsive
- ✅ **15+ API Routes** - RESTful backend
- ✅ **10+ Components** - Reusable UI library
- ✅ **SQLite Database** - With sample data
- ✅ **Docker Ready** - Production deployment
- ✅ **TypeScript** - Full type safety
- ✅ **~3,500 Lines** - Production-ready code

---

## 🚀 You're All Set!

**Development:** Open http://localhost:3001
**Production:** Open http://localhost:3501

Start tracking your goals and building better habits! 🎯

---

*Built: December 31, 2025*
*Version: 1.0.0*
*Status: Production Ready ✅*
