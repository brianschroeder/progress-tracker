const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'goals.db');
const db = new Database(DB_PATH);

console.log('Starting comments migration...');

try {
  // Check if comments table already exists
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'")
    .get();

  if (tableExists) {
    console.log('Comments table already exists. Skipping creation.');
  } else {
    // Create comments table
    db.exec(`
      CREATE TABLE comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workGoalId INTEGER,
        workTodoId INTEGER,
        text TEXT NOT NULL,
        jiraCommentId TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workGoalId) REFERENCES work_goals(id) ON DELETE CASCADE,
        FOREIGN KEY (workTodoId) REFERENCES work_todos(id) ON DELETE CASCADE,
        CHECK (
          (workGoalId IS NOT NULL AND workTodoId IS NULL) OR 
          (workGoalId IS NULL AND workTodoId IS NOT NULL)
        )
      )
    `);
    console.log('✓ Created comments table');
  }

  // Create index for faster lookups
  const indexExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_comments_work_goal'")
    .get();

  if (!indexExists) {
    db.exec('CREATE INDEX idx_comments_work_goal ON comments(workGoalId)');
    db.exec('CREATE INDEX idx_comments_work_todo ON comments(workTodoId)');
    console.log('✓ Created indexes on comments table');
  }

  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
