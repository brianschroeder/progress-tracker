const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Adding menuOrder column to user_settings table...');

const db = new Database(DB_PATH);

try {
  // Check if column exists
  const tableInfo = db.prepare("PRAGMA table_info(user_settings)").all();
  const hasMenuOrder = tableInfo.some(col => col.name === 'menuOrder');

  if (!hasMenuOrder) {
    console.log('Adding menuOrder column...');
    db.exec('ALTER TABLE user_settings ADD COLUMN menuOrder TEXT');
    console.log('✓ menuOrder column added successfully!');
  } else {
    console.log('✓ menuOrder column already exists');
  }
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('✓ Migration completed!');
