const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Running migration: Add daysOfWeek column');
console.log('Database:', DB_PATH);

const db = new Database(DB_PATH);

try {
  // Check if column already exists
  const tableInfo = db.pragma('table_info(goals)');
  const columnExists = tableInfo.some(col => col.name === 'daysOfWeek');
  
  if (columnExists) {
    console.log('✓ Column daysOfWeek already exists, skipping migration');
  } else {
    // Add the column
    db.exec('ALTER TABLE goals ADD COLUMN daysOfWeek TEXT');
    console.log('✓ Added daysOfWeek column to goals table');
  }
  
  console.log('✓ Migration completed successfully!');
} catch (error) {
  console.error('✗ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
