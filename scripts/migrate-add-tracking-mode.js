const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Starting migration: Adding tracking mode columns to year_goals table...');

try {
  const db = new Database(DB_PATH);
  
  // Check if columns exist
  const columns = db.prepare("PRAGMA table_info(year_goals)").all();
  const hasTrackingMode = columns.some(col => col.name === 'trackingMode');
  const hasCurrentCount = columns.some(col => col.name === 'currentCount');
  const hasTargetCount = columns.some(col => col.name === 'targetCount');
  
  if (!hasTrackingMode) {
    console.log('Adding trackingMode column to year_goals table...');
    db.exec("ALTER TABLE year_goals ADD COLUMN trackingMode TEXT DEFAULT 'percentage'");
    console.log('✓ trackingMode column added');
  } else {
    console.log('✓ trackingMode column already exists');
  }
  
  if (!hasCurrentCount) {
    console.log('Adding currentCount column to year_goals table...');
    db.exec('ALTER TABLE year_goals ADD COLUMN currentCount INTEGER DEFAULT 0');
    console.log('✓ currentCount column added');
  } else {
    console.log('✓ currentCount column already exists');
  }
  
  if (!hasTargetCount) {
    console.log('Adding targetCount column to year_goals table...');
    db.exec('ALTER TABLE year_goals ADD COLUMN targetCount INTEGER DEFAULT 0');
    console.log('✓ targetCount column added');
  } else {
    console.log('✓ targetCount column already exists');
  }
  
  db.close();
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
