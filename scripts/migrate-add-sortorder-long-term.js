const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Starting migration: Adding sortOrder to year_goals and decade_goals tables...');

try {
  const db = new Database(DB_PATH);
  
  // Check if sortOrder column exists in year_goals
  const yearGoalsColumns = db.prepare("PRAGMA table_info(year_goals)").all();
  const hasSortOrderYear = yearGoalsColumns.some(col => col.name === 'sortOrder');
  
  if (!hasSortOrderYear) {
    console.log('Adding sortOrder column to year_goals table...');
    db.exec('ALTER TABLE year_goals ADD COLUMN sortOrder INTEGER DEFAULT 0');
    console.log('✓ sortOrder column added to year_goals');
  } else {
    console.log('✓ sortOrder column already exists in year_goals');
  }
  
  // Check if sortOrder column exists in decade_goals
  const decadeGoalsColumns = db.prepare("PRAGMA table_info(decade_goals)").all();
  const hasSortOrderDecade = decadeGoalsColumns.some(col => col.name === 'sortOrder');
  
  if (!hasSortOrderDecade) {
    console.log('Adding sortOrder column to decade_goals table...');
    db.exec('ALTER TABLE decade_goals ADD COLUMN sortOrder INTEGER DEFAULT 0');
    console.log('✓ sortOrder column added to decade_goals');
  } else {
    console.log('✓ sortOrder column already exists in decade_goals');
  }
  
  db.close();
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
