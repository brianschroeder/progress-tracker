const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'goals.db');

console.log('Initializing database at:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create goals table
db.exec(`
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    targetDaysPerWeek INTEGER NOT NULL,
    daysOfWeek TEXT,
    categoryId INTEGER,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'target',
    isActive BOOLEAN NOT NULL DEFAULT 1,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
  )
`);

// Create completions table
db.exec(`
  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goalId INTEGER NOT NULL,
    completionDate TEXT NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE CASCADE,
    UNIQUE(goalId, completionDate)
  )
`);

// Create categories table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create user_settings table
db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weekStartsOn INTEGER DEFAULT 0,
    theme TEXT DEFAULT 'light',
    notificationsEnabled BOOLEAN DEFAULT 0,
    menuOrder TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create year_goals table
db.exec(`
  CREATE TABLE IF NOT EXISTS year_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    targetDate TEXT,
    isCompleted BOOLEAN NOT NULL DEFAULT 0,
    progress INTEGER DEFAULT 0,
    color TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create decade_goals table
db.exec(`
  CREATE TABLE IF NOT EXISTS decade_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    milestones TEXT,
    isCompleted BOOLEAN NOT NULL DEFAULT 0,
    color TEXT NOT NULL,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create todos table
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    isCompleted BOOLEAN NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    dueDate TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create shopping_list table
db.exec(`
  CREATE TABLE IF NOT EXISTS shopping_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity TEXT,
    category TEXT,
    isChecked BOOLEAN NOT NULL DEFAULT 0,
    sortOrder INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create indexes
db.exec(`CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completionDate)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_completions_goalId ON completions(goalId)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(isActive)`);

// Insert default settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM user_settings').get();
if (settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO user_settings (weekStartsOn, theme, notificationsEnabled) 
    VALUES (0, 'light', 0)
  `).run();
  console.log('✓ Created default user settings');
}

// Insert default categories
const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (categoriesCount.count === 0) {
  const defaultCategories = [
    { name: 'Health', color: '#10B981', icon: 'heart', sortOrder: 0 },
    { name: 'Work', color: '#3B82F6', icon: 'briefcase', sortOrder: 1 },
    { name: 'Personal', color: '#F59E0B', icon: 'user', sortOrder: 2 },
    { name: 'Social', color: '#8B5CF6', icon: 'users', sortOrder: 3 },
  ];
  
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, color, icon, sortOrder) 
    VALUES (@name, @color, @icon, @sortOrder)
  `);
  
  for (const category of defaultCategories) {
    insertCategory.run(category);
  }
  console.log('✓ Created default categories');
}

// Insert sample goals for testing
const goalsCount = db.prepare('SELECT COUNT(*) as count FROM goals').get();
if (goalsCount.count === 0) {
  const sampleGoals = [
    { name: 'Go to the gym', description: 'Exercise and stay fit', targetDaysPerWeek: 3, categoryId: 1, color: '#10B981', icon: 'dumbbell', isActive: 1, sortOrder: 0 },
    { name: 'Read books', description: 'Read for at least 30 minutes', targetDaysPerWeek: 5, categoryId: 3, color: '#F59E0B', icon: 'book', isActive: 1, sortOrder: 1 },
    { name: 'Meditate', description: 'Daily meditation practice', targetDaysPerWeek: 7, categoryId: 1, color: '#8B5CF6', icon: 'sparkles', isActive: 1, sortOrder: 2 },
  ];
  
  const insertGoal = db.prepare(`
    INSERT INTO goals (name, description, targetDaysPerWeek, categoryId, color, icon, isActive, sortOrder)
    VALUES (@name, @description, @targetDaysPerWeek, @categoryId, @color, @icon, @isActive, @sortOrder)
  `);
  
  for (const goal of sampleGoals) {
    insertGoal.run(goal);
  }
  console.log('✓ Created sample goals');
}

db.close();
console.log('✓ Database initialized successfully!');
