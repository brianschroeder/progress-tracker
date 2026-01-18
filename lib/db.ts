import Database from 'better-sqlite3';
import path from 'path';
import { Goal, Completion, Category, UserSettings, WeeklyProgress, StreakInfo, YearGoalEntry } from '@/types';
import { formatDateForDB, getCurrentWeek } from './date-utils';

// Database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

// Initialize database connection
let db: Database.Database | null = null;

function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDatabase();
  }
  return db;
}

/**
 * Initialize database schema
 */
function initializeDatabase() {
  const database = getDB();

  // Create goals table
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
    CREATE TABLE IF NOT EXISTS year_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      targetDate TEXT,
      isCompleted BOOLEAN NOT NULL DEFAULT 0,
      progress INTEGER DEFAULT 0,
      color TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0,
      trackingMode TEXT DEFAULT 'percentage',
      currentCount INTEGER DEFAULT 0,
      targetCount INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create year_goal_entries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS year_goal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      yearGoalId INTEGER NOT NULL,
      entryDate TEXT NOT NULL,
      delta INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (yearGoalId) REFERENCES year_goals(id) ON DELETE CASCADE
    )
  `);

  // Create todos table
  database.exec(`
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

  // Create decade_goals table
  database.exec(`
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

  // Create shopping_list table
  database.exec(`
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

  // Create work_goals table
  database.exec(`
    CREATE TABLE IF NOT EXISTS work_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      targetDate TEXT,
      isCompleted BOOLEAN NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      color TEXT DEFAULT '#3B82F6',
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create work_todos table
  database.exec(`
    CREATE TABLE IF NOT EXISTS work_todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workGoalId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      isCompleted BOOLEAN NOT NULL DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workGoalId) REFERENCES work_goals(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  database.exec(`CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completionDate)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_completions_goalId ON completions(goalId)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(isActive)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_year_goal_entries_goalId ON year_goal_entries(yearGoalId)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_year_goal_entries_date ON year_goal_entries(entryDate)`);

  // Insert default settings if none exist
  const settingsCount = database.prepare('SELECT COUNT(*) as count FROM user_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    database.prepare(`
      INSERT INTO user_settings (weekStartsOn, theme, notificationsEnabled) 
      VALUES (0, 'light', 0)
    `).run();
  }

  // Insert default categories if none exist
  const categoriesCount = database.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoriesCount.count === 0) {
    const defaultCategories = [
      { name: 'Health', color: '#10B981', icon: 'heart', sortOrder: 0 },
      { name: 'Work', color: '#3B82F6', icon: 'briefcase', sortOrder: 1 },
      { name: 'Personal', color: '#F59E0B', icon: 'user', sortOrder: 2 },
      { name: 'Social', color: '#8B5CF6', icon: 'users', sortOrder: 3 },
    ];
    
    const insertCategory = database.prepare(`
      INSERT INTO categories (name, color, icon, sortOrder) 
      VALUES (@name, @color, @icon, @sortOrder)
    `);
    
    for (const category of defaultCategories) {
      insertCategory.run(category);
    }
  }
}

// ==================== GOALS ====================

export function getAllGoals(): Goal[] {
  const database = getDB();
  const goals = database.prepare(`
    SELECT g.*, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon
    FROM goals g
    LEFT JOIN categories c ON g.categoryId = c.id
    ORDER BY g.sortOrder ASC, g.id DESC
  `).all() as any[];

  return goals.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    targetDaysPerWeek: g.targetDaysPerWeek,
    daysOfWeek: g.daysOfWeek ? JSON.parse(g.daysOfWeek) : undefined,
    categoryId: g.categoryId,
    color: g.color,
    icon: g.icon,
    isActive: Boolean(g.isActive),
    sortOrder: g.sortOrder,
    createdAt: g.createdAt,
    category: g.categoryId ? {
      id: g.categoryId,
      name: g.categoryName,
      color: g.categoryColor,
      icon: g.categoryIcon,
      sortOrder: 0,
    } : undefined,
  }));
}

export function getActiveGoals(): Goal[] {
  return getAllGoals().filter(g => g.isActive);
}

export function getGoalById(id: number): Goal | null {
  const goals = getAllGoals();
  return goals.find(g => g.id === id) || null;
}

export function createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO goals (name, description, targetDaysPerWeek, daysOfWeek, categoryId, color, icon, isActive, sortOrder)
    VALUES (@name, @description, @targetDaysPerWeek, @daysOfWeek, @categoryId, @color, @icon, @isActive, @sortOrder)
  `).run({
    name: goal.name,
    description: goal.description || null,
    targetDaysPerWeek: goal.targetDaysPerWeek,
    daysOfWeek: goal.daysOfWeek ? JSON.stringify(goal.daysOfWeek) : null,
    categoryId: goal.categoryId || null,
    color: goal.color,
    icon: goal.icon,
    isActive: goal.isActive ? 1 : 0,
    sortOrder: goal.sortOrder,
  });

  return result.lastInsertRowid as number;
}

export function updateGoal(goal: Goal): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE goals
    SET name = @name,
        description = @description,
        targetDaysPerWeek = @targetDaysPerWeek,
        daysOfWeek = @daysOfWeek,
        categoryId = @categoryId,
        color = @color,
        icon = @icon,
        isActive = @isActive,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: goal.id,
    name: goal.name,
    description: goal.description || null,
    targetDaysPerWeek: goal.targetDaysPerWeek,
    daysOfWeek: goal.daysOfWeek ? JSON.stringify(goal.daysOfWeek) : null,
    categoryId: goal.categoryId || null,
    color: goal.color,
    icon: goal.icon,
    isActive: goal.isActive ? 1 : 0,
    sortOrder: goal.sortOrder,
  });

  return result.changes > 0;
}

export function deleteGoal(id: number): boolean {
  const database = getDB();
  // Soft delete - set isActive to false
  const result = database.prepare('UPDATE goals SET isActive = 0 WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderGoals(goalIds: number[]): boolean {
  const database = getDB();
  const updateStmt = database.prepare('UPDATE goals SET sortOrder = ? WHERE id = ?');
  
  const transaction = database.transaction(() => {
    goalIds.forEach((id, index) => {
      updateStmt.run(index, id);
    });
  });

  try {
    transaction();
    return true;
  } catch (error) {
    console.error('Error reordering goals:', error);
    return false;
  }
}

// ==================== COMPLETIONS ====================

export function getCompletionsForDate(date: string): Completion[] {
  const database = getDB();
  const completions = database.prepare(`
    SELECT c.*, g.name as goalName, g.color as goalColor, g.icon as goalIcon
    FROM completions c
    JOIN goals g ON c.goalId = g.id
    WHERE c.completionDate = ?
    ORDER BY g.sortOrder ASC
  `).all(date) as any[];

  return completions.map(c => ({
    id: c.id,
    goalId: c.goalId,
    completionDate: c.completionDate,
    notes: c.notes,
    createdAt: c.createdAt,
    goal: {
      id: c.goalId,
      name: c.goalName,
      color: c.goalColor,
      icon: c.goalIcon,
      targetDaysPerWeek: 0,
      isActive: true,
      sortOrder: 0,
    },
  }));
}

export function getCompletionsForGoal(goalId: number, startDate: string, endDate: string): Completion[] {
  const database = getDB();
  const completions = database.prepare(`
    SELECT * FROM completions
    WHERE goalId = ? AND completionDate BETWEEN ? AND ?
    ORDER BY completionDate DESC
  `).all(goalId, startDate, endDate) as any[];

  return completions.map(c => ({
    id: c.id,
    goalId: c.goalId,
    completionDate: c.completionDate,
    notes: c.notes,
    createdAt: c.createdAt,
  }));
}

export function createCompletion(completion: Omit<Completion, 'id' | 'createdAt'>): number {
  const database = getDB();
  try {
    const result = database.prepare(`
      INSERT INTO completions (goalId, completionDate, notes)
      VALUES (@goalId, @completionDate, @notes)
    `).run({
      goalId: completion.goalId,
      completionDate: completion.completionDate,
      notes: completion.notes || null,
    });

    return result.lastInsertRowid as number;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Goal already completed for this date');
    }
    throw error;
  }
}

export function deleteCompletion(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM completions WHERE id = ?').run(id);
  return result.changes > 0;
}

export function deleteCompletionByGoalAndDate(goalId: number, date: string): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM completions WHERE goalId = ? AND completionDate = ?').run(goalId, date);
  return result.changes > 0;
}

export function isGoalCompletedOnDate(goalId: number, date: string): boolean {
  const database = getDB();
  const result = database.prepare(`
    SELECT COUNT(*) as count FROM completions 
    WHERE goalId = ? AND completionDate = ?
  `).get(goalId, date) as { count: number };
  
  return result.count > 0;
}

// ==================== CATEGORIES ====================

export function getAllCategories(): Category[] {
  const database = getDB();
  return database.prepare(`
    SELECT * FROM categories 
    ORDER BY sortOrder ASC, name ASC
  `).all() as Category[];
}

export function createCategory(category: Omit<Category, 'id' | 'createdAt'>): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO categories (name, color, icon, sortOrder)
    VALUES (@name, @color, @icon, @sortOrder)
  `).run({
    name: category.name,
    color: category.color,
    icon: category.icon,
    sortOrder: category.sortOrder,
  });

  return result.lastInsertRowid as number;
}

export function updateCategory(category: Category): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE categories
    SET name = @name, color = @color, icon = @icon, sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    sortOrder: category.sortOrder,
  });

  return result.changes > 0;
}

export function deleteCategory(id: number): boolean {
  const database = getDB();
  // Remove category reference from goals first
  database.prepare('UPDATE goals SET categoryId = NULL WHERE categoryId = ?').run(id);
  // Delete category
  const result = database.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

// ==================== ANALYTICS ====================

export function getWeeklyProgress(startDate: string, endDate: string): WeeklyProgress[] {
  const database = getDB();
  const goals = getActiveGoals();
  
  const progressData: WeeklyProgress[] = goals.map(goal => {
    const completions = database.prepare(`
      SELECT completionDate FROM completions
      WHERE goalId = ? AND completionDate BETWEEN ? AND ?
      ORDER BY completionDate ASC
    `).all(goal.id, startDate, endDate) as { completionDate: string }[];

    const completionsThisWeek = completions.length;
    const completionRate = (completionsThisWeek / goal.targetDaysPerWeek) * 100;
    
    let status: 'on-track' | 'behind' | 'exceeded';
    if (completionRate >= 100) {
      status = 'exceeded';
    } else if (completionRate >= 70) {
      status = 'on-track';
    } else {
      status = 'behind';
    }

    return {
      goal,
      completionsThisWeek,
      targetDaysPerWeek: goal.targetDaysPerWeek,
      completionDates: completions.map(c => c.completionDate),
      completionRate,
      status,
    };
  });

  return progressData;
}

export function getStreakForGoal(goalId: number): number {
  const database = getDB();
  const completions = database.prepare(`
    SELECT completionDate FROM completions
    WHERE goalId = ?
    ORDER BY completionDate DESC
  `).all(goalId) as { completionDate: string }[];

  if (completions.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completions.length; i++) {
    const completionDate = new Date(completions[i].completionDate + 'T00:00:00');
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getCurrentStreaks(): StreakInfo[] {
  const goals = getActiveGoals();
  
  return goals.map(goal => ({
    goalId: goal.id!,
    goalName: goal.name,
    currentStreak: getStreakForGoal(goal.id!),
    longestStreak: getLongestStreakForGoal(goal.id!),
  }));
}

function getLongestStreakForGoal(goalId: number): number {
  const database = getDB();
  const completions = database.prepare(`
    SELECT completionDate FROM completions
    WHERE goalId = ?
    ORDER BY completionDate ASC
  `).all(goalId) as { completionDate: string }[];

  if (completions.length === 0) {
    return 0;
  }

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completions.length; i++) {
    const prevDate = new Date(completions[i - 1].completionDate);
    const currDate = new Date(completions[i].completionDate);
    
    const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function getUserSettings(): UserSettings {
  const database = getDB();
  const settings = database.prepare('SELECT * FROM user_settings LIMIT 1').get() as UserSettings;
  return settings;
}

export function updateUserSettings(settings: Partial<UserSettings>): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE user_settings
    SET weekStartsOn = COALESCE(@weekStartsOn, weekStartsOn),
        theme = COALESCE(@theme, theme),
        notificationsEnabled = COALESCE(@notificationsEnabled, notificationsEnabled),
        menuOrder = COALESCE(@menuOrder, menuOrder),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run({
    weekStartsOn: settings.weekStartsOn ?? null,
    theme: settings.theme ?? null,
    notificationsEnabled: settings.notificationsEnabled !== undefined ? (settings.notificationsEnabled ? 1 : 0) : null,
    menuOrder: settings.menuOrder ?? null,
  });

  return result.changes > 0;
}

// ============================================
// YEAR GOALS OPERATIONS
// ============================================

export interface YearGoal {
  id?: number;
  title: string;
  description?: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  progress: number;
  color: string;
  sortOrder?: number;
  trackingMode?: 'percentage' | 'count';
  currentCount?: number;
  targetCount?: number;
  createdAt?: string;
}

export function getAllYearGoals(): YearGoal[] {
  const database = getDB();
  const goals = database.prepare('SELECT * FROM year_goals ORDER BY sortOrder ASC, createdAt DESC').all() as YearGoal[];
  return goals;
}

export function getYearGoalById(id: number): YearGoal | undefined {
  const database = getDB();
  const goal = database.prepare('SELECT * FROM year_goals WHERE id = ?').get(id) as YearGoal | undefined;
  return goal;
}

export function createYearGoal(goal: Omit<YearGoal, 'id' | 'createdAt'>): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO year_goals (title, description, category, targetDate, isCompleted, progress, color, sortOrder, trackingMode, currentCount, targetCount)
    VALUES (@title, @description, @category, @targetDate, @isCompleted, @progress, @color, @sortOrder, @trackingMode, @currentCount, @targetCount)
  `).run({
    title: goal.title,
    description: goal.description || null,
    category: goal.category,
    targetDate: goal.targetDate || null,
    isCompleted: goal.isCompleted ? 1 : 0,
    progress: goal.progress,
    color: goal.color,
    sortOrder: goal.sortOrder || 0,
    trackingMode: goal.trackingMode || 'percentage',
    currentCount: goal.currentCount || 0,
    targetCount: goal.targetCount || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateYearGoal(goal: YearGoal): boolean {
  const database = getDB();
  
  // Auto-calculate progress if in count mode
  let progress = goal.progress;
  if (goal.trackingMode === 'count' && goal.targetCount && goal.targetCount > 0) {
    progress = Math.round(((goal.currentCount || 0) / goal.targetCount) * 100);
  }
  
  const result = database.prepare(`
    UPDATE year_goals
    SET title = @title,
        description = @description,
        category = @category,
        targetDate = @targetDate,
        isCompleted = @isCompleted,
        progress = @progress,
        color = @color,
        sortOrder = @sortOrder,
        trackingMode = @trackingMode,
        currentCount = @currentCount,
        targetCount = @targetCount
    WHERE id = @id
  `).run({
    id: goal.id,
    title: goal.title,
    description: goal.description || null,
    category: goal.category,
    targetDate: goal.targetDate || null,
    isCompleted: goal.isCompleted ? 1 : 0,
    progress: progress,
    color: goal.color,
    sortOrder: goal.sortOrder || 0,
    trackingMode: goal.trackingMode || 'percentage',
    currentCount: goal.currentCount || 0,
    targetCount: goal.targetCount || 0,
  });

  return result.changes > 0;
}

export function deleteYearGoal(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM year_goals WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderYearGoals(goalIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE year_goals SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    goalIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

// ============================================
// YEAR GOAL ENTRIES
// ============================================

export function getYearGoalEntries(yearGoalId: number): YearGoalEntry[] {
  const database = getDB();
  return database.prepare(`
    SELECT *
    FROM year_goal_entries
    WHERE yearGoalId = ?
    ORDER BY entryDate DESC, id DESC
  `).all(yearGoalId) as YearGoalEntry[];
}

export function createYearGoalEntry(entry: Omit<YearGoalEntry, 'id' | 'createdAt'>): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO year_goal_entries (yearGoalId, entryDate, delta)
    VALUES (@yearGoalId, @entryDate, @delta)
  `).run({
    yearGoalId: entry.yearGoalId,
    entryDate: entry.entryDate,
    delta: entry.delta,
  });

  return result.lastInsertRowid as number;
}

// ============================================
// DECADE GOALS OPERATIONS
// ============================================

export interface DecadeGoal {
  id?: number;
  title: string;
  description: string;
  category: string;
  milestones: string[];
  isCompleted: boolean;
  color: string;
  createdAt?: string;
}

export function getAllDecadeGoals(): DecadeGoal[] {
  const database = getDB();
  const goals = database.prepare('SELECT * FROM decade_goals ORDER BY sortOrder ASC, createdAt DESC').all() as any[];
  return goals.map(g => ({
    ...g,
    milestones: g.milestones ? JSON.parse(g.milestones) : [],
    isCompleted: Boolean(g.isCompleted),
  }));
}

export function getDecadeGoalById(id: number): DecadeGoal | undefined {
  const database = getDB();
  const goal = database.prepare('SELECT * FROM decade_goals WHERE id = ?').get(id) as any;
  if (!goal) return undefined;
  
  return {
    ...goal,
    milestones: goal.milestones ? JSON.parse(goal.milestones) : [],
    isCompleted: Boolean(goal.isCompleted),
  };
}

export function createDecadeGoal(goal: Omit<DecadeGoal, 'id' | 'createdAt'>): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO decade_goals (title, description, category, milestones, isCompleted, color, sortOrder)
    VALUES (@title, @description, @category, @milestones, @isCompleted, @color, @sortOrder)
  `).run({
    title: goal.title,
    description: goal.description,
    category: goal.category,
    milestones: JSON.stringify(goal.milestones),
    isCompleted: goal.isCompleted ? 1 : 0,
    color: goal.color,
    sortOrder: goal.sortOrder || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateDecadeGoal(goal: DecadeGoal): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE decade_goals
    SET title = @title,
        description = @description,
        category = @category,
        milestones = @milestones,
        isCompleted = @isCompleted,
        color = @color,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    category: goal.category,
    milestones: JSON.stringify(goal.milestones),
    isCompleted: goal.isCompleted ? 1 : 0,
    color: goal.color,
    sortOrder: goal.sortOrder || 0,
  });

  return result.changes > 0;
}

export function deleteDecadeGoal(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM decade_goals WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderDecadeGoals(goalIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE decade_goals SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    goalIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

// ==================== TODO MANAGEMENT ====================

export function getAllTodos() {
  const database = getDB();
  return database.prepare('SELECT * FROM todos ORDER BY sortOrder ASC, createdAt DESC').all();
}

export function getTodoById(id: number) {
  const database = getDB();
  return database.prepare('SELECT * FROM todos WHERE id = ?').get(id);
}

export function createTodo(todo: any): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO todos (title, description, isCompleted, priority, dueDate, sortOrder)
    VALUES (@title, @description, @isCompleted, @priority, @dueDate, @sortOrder)
  `).run({
    title: todo.title,
    description: todo.description || null,
    isCompleted: todo.isCompleted ? 1 : 0,
    priority: todo.priority,
    dueDate: todo.dueDate || null,
    sortOrder: todo.sortOrder || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateTodo(todo: any): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE todos
    SET title = @title,
        description = @description,
        isCompleted = @isCompleted,
        priority = @priority,
        dueDate = @dueDate,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: todo.id,
    title: todo.title,
    description: todo.description || null,
    isCompleted: todo.isCompleted ? 1 : 0,
    priority: todo.priority,
    dueDate: todo.dueDate || null,
    sortOrder: todo.sortOrder || 0,
  });

  return result.changes > 0;
}

export function deleteTodo(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM todos WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderTodos(todoIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE todos SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    todoIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

// ==================== SHOPPING LIST MANAGEMENT ====================

export function getAllShoppingItems() {
  const database = getDB();
  return database.prepare('SELECT * FROM shopping_list ORDER BY sortOrder ASC, createdAt DESC').all();
}

export function getShoppingItemById(id: number) {
  const database = getDB();
  return database.prepare('SELECT * FROM shopping_list WHERE id = ?').get(id);
}

export function createShoppingItem(item: any): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO shopping_list (name, quantity, category, isChecked, sortOrder)
    VALUES (@name, @quantity, @category, @isChecked, @sortOrder)
  `).run({
    name: item.name,
    quantity: item.quantity || null,
    category: item.category || null,
    isChecked: item.isChecked ? 1 : 0,
    sortOrder: item.sortOrder || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateShoppingItem(item: any): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE shopping_list
    SET name = @name,
        quantity = @quantity,
        category = @category,
        isChecked = @isChecked,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: item.id,
    name: item.name,
    quantity: item.quantity || null,
    category: item.category || null,
    isChecked: item.isChecked ? 1 : 0,
    sortOrder: item.sortOrder || 0,
  });

  return result.changes > 0;
}

// ==================== WORK GOALS MANAGEMENT ====================

export function getAllWorkGoals() {
  const database = getDB();
  return database.prepare('SELECT * FROM work_goals ORDER BY sortOrder ASC, createdAt DESC').all();
}

export function getWorkGoalById(id: number) {
  const database = getDB();
  return database.prepare('SELECT * FROM work_goals WHERE id = ?').get(id);
}

export function createWorkGoal(workGoal: any): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO work_goals (title, description, targetDate, isCompleted, priority, color, sortOrder)
    VALUES (@title, @description, @targetDate, @isCompleted, @priority, @color, @sortOrder)
  `).run({
    title: workGoal.title,
    description: workGoal.description || null,
    targetDate: workGoal.targetDate || null,
    isCompleted: workGoal.isCompleted ? 1 : 0,
    priority: workGoal.priority || 'medium',
    color: workGoal.color || '#3B82F6',
    sortOrder: workGoal.sortOrder || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateWorkGoal(workGoal: any): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_goals
    SET title = @title,
        description = @description,
        targetDate = @targetDate,
        isCompleted = @isCompleted,
        priority = @priority,
        color = @color,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: workGoal.id,
    title: workGoal.title,
    description: workGoal.description || null,
    targetDate: workGoal.targetDate || null,
    isCompleted: workGoal.isCompleted ? 1 : 0,
    priority: workGoal.priority || 'medium',
    color: workGoal.color || '#3B82F6',
    sortOrder: workGoal.sortOrder || 0,
  });

  return result.changes > 0;
}

export function deleteWorkGoal(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM work_goals WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderWorkGoals(workGoalIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE work_goals SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    workGoalIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

// ==================== WORK TODOS MANAGEMENT ====================

export function getAllWorkTodos() {
  const database = getDB();
  return database.prepare('SELECT * FROM work_todos ORDER BY sortOrder ASC, createdAt DESC').all();
}

export function getWorkTodosByGoalId(workGoalId: number) {
  const database = getDB();
  return database.prepare('SELECT * FROM work_todos WHERE workGoalId = ? ORDER BY sortOrder ASC, createdAt DESC').all(workGoalId);
}

export function getWorkTodoById(id: number) {
  const database = getDB();
  return database.prepare('SELECT * FROM work_todos WHERE id = ?').get(id);
}

export function createWorkTodo(workTodo: any): number {
  const database = getDB();
  const result = database.prepare(`
    INSERT INTO work_todos (workGoalId, title, description, isCompleted, sortOrder)
    VALUES (@workGoalId, @title, @description, @isCompleted, @sortOrder)
  `).run({
    workGoalId: workTodo.workGoalId,
    title: workTodo.title,
    description: workTodo.description || null,
    isCompleted: workTodo.isCompleted ? 1 : 0,
    sortOrder: workTodo.sortOrder || 0,
  });

  return result.lastInsertRowid as number;
}

export function updateWorkTodo(workTodo: any): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_todos
    SET workGoalId = @workGoalId,
        title = @title,
        description = @description,
        isCompleted = @isCompleted,
        sortOrder = @sortOrder
    WHERE id = @id
  `).run({
    id: workTodo.id,
    workGoalId: workTodo.workGoalId,
    title: workTodo.title,
    description: workTodo.description || null,
    isCompleted: workTodo.isCompleted ? 1 : 0,
    sortOrder: workTodo.sortOrder || 0,
  });

  return result.changes > 0;
}

export function deleteWorkTodo(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM work_todos WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderWorkTodos(workTodoIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE work_todos SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    workTodoIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

// ==================== JIRA INTEGRATION ====================

export function updateWorkGoalJiraInfo(id: number, jiraIssueKey: string, jiraUrl: string): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_goals
    SET jiraIssueKey = ?,
        jiraUrl = ?,
        lastSyncedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(jiraIssueKey, jiraUrl, id);
  
  return result.changes > 0;
}

export function updateWorkTodoJiraInfo(id: number, jiraIssueKey: string, jiraUrl: string): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_todos
    SET jiraIssueKey = ?,
        jiraUrl = ?,
        lastSyncedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(jiraIssueKey, jiraUrl, id);
  
  return result.changes > 0;
}

export function clearWorkGoalJiraInfo(id: number): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_goals
    SET jiraIssueKey = NULL,
        jiraUrl = NULL,
        lastSyncedAt = NULL
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

export function clearWorkTodoJiraInfo(id: number): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE work_todos
    SET jiraIssueKey = NULL,
        jiraUrl = NULL,
        lastSyncedAt = NULL
    WHERE id = ?
  `).run(id);
  
  return result.changes > 0;
}

export function getJiraSettings() {
  const database = getDB();
  const settings = database.prepare('SELECT * FROM user_settings WHERE id = 1').get() as any;
  
  if (!settings) {
    return null;
  }
  
  return {
    jiraEnabled: settings.jiraEnabled === 1,
    jiraDomain: settings.jiraDomain || '',
    jiraEmail: settings.jiraEmail || '',
    jiraApiToken: settings.jiraApiToken || '',
    jiraProjectKey: settings.jiraProjectKey || '',
    jiraComponent: settings.jiraComponent || '',
  };
}

export function updateJiraSettings(settings: {
  jiraEnabled: boolean;
  jiraDomain?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  jiraProjectKey?: string;
  jiraComponent?: string;
}): boolean {
  const database = getDB();
  
  // Ensure settings row exists
  const existing = database.prepare('SELECT id FROM user_settings WHERE id = 1').get();
  if (!existing) {
    database.prepare('INSERT INTO user_settings (id) VALUES (1)').run();
  }
  
  const updates: string[] = [];
  const values: any = {};
  
  updates.push('jiraEnabled = @jiraEnabled');
  values.jiraEnabled = settings.jiraEnabled ? 1 : 0;
  
  if (settings.jiraDomain !== undefined) {
    updates.push('jiraDomain = @jiraDomain');
    values.jiraDomain = settings.jiraDomain;
  }
  
  if (settings.jiraEmail !== undefined) {
    updates.push('jiraEmail = @jiraEmail');
    values.jiraEmail = settings.jiraEmail;
  }
  
  if (settings.jiraApiToken !== undefined) {
    updates.push('jiraApiToken = @jiraApiToken');
    values.jiraApiToken = settings.jiraApiToken;
  }
  
  if (settings.jiraProjectKey !== undefined) {
    updates.push('jiraProjectKey = @jiraProjectKey');
    values.jiraProjectKey = settings.jiraProjectKey;
  }
  
  if (settings.jiraComponent !== undefined) {
    updates.push('jiraComponent = @jiraComponent');
    values.jiraComponent = settings.jiraComponent;
  }
  
  const result = database.prepare(`
    UPDATE user_settings
    SET ${updates.join(', ')},
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(values);
  
  return result.changes > 0;
}

// ==================== SHOPPING LIST ====================

export function deleteShoppingItem(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM shopping_list WHERE id = ?').run(id);
  return result.changes > 0;
}

export function reorderShoppingItems(itemIds: number[]): boolean {
  const database = getDB();
  const update = database.prepare('UPDATE shopping_list SET sortOrder = ? WHERE id = ?');
  
  database.transaction(() => {
    itemIds.forEach((id, index) => {
      update.run(index, id);
    });
  })();

  return true;
}

export function clearCheckedShoppingItems(): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM shopping_list WHERE isChecked = 1').run();
  return result.changes > 0;
}

// ==================== COMMENTS ====================

export interface Comment {
  id: number;
  workGoalId?: number;
  workTodoId?: number;
  text: string;
  jiraCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

export function getCommentById(id: number): Comment | null {
  const database = getDB();
  return database.prepare('SELECT * FROM comments WHERE id = ?').get(id) as Comment | null;
}

export function getCommentsForGoal(goalId: number): Comment[] {
  const database = getDB();
  return database.prepare('SELECT * FROM comments WHERE workGoalId = ? ORDER BY createdAt ASC').all(goalId) as Comment[];
}

export function getCommentsForTodo(todoId: number): Comment[] {
  const database = getDB();
  return database.prepare('SELECT * FROM comments WHERE workTodoId = ? ORDER BY createdAt ASC').all(todoId) as Comment[];
}

export function addComment(data: {
  workGoalId?: number;
  workTodoId?: number;
  text: string;
  jiraCommentId?: string;
}): Comment {
  const database = getDB();
  
  const result = database.prepare(`
    INSERT INTO comments (workGoalId, workTodoId, text, jiraCommentId)
    VALUES (@workGoalId, @workTodoId, @text, @jiraCommentId)
  `).run({
    workGoalId: data.workGoalId || null,
    workTodoId: data.workTodoId || null,
    text: data.text,
    jiraCommentId: data.jiraCommentId || null,
  });

  return database.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;
}

export function updateComment(id: number, text: string): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE comments 
    SET text = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(text, id);
  
  return result.changes > 0;
}

export function deleteComment(id: number): boolean {
  const database = getDB();
  const result = database.prepare('DELETE FROM comments WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateCommentJiraInfo(id: number, jiraCommentId: string): boolean {
  const database = getDB();
  const result = database.prepare(`
    UPDATE comments 
    SET jiraCommentId = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(jiraCommentId, id);
  
  return result.changes > 0;
}

// Export database initialization function
export { initializeDatabase };
