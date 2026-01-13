const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'goals.db');

console.log('Starting JIRA fields migration...');

try {
  const db = new Database(DB_PATH);
  
  // Check if columns already exist
  const workGoalsInfo = db.prepare("PRAGMA table_info(work_goals)").all();
  const hasJiraFields = workGoalsInfo.some(col => col.name === 'jiraIssueKey');
  
  if (hasJiraFields) {
    console.log('JIRA fields already exist in work_goals table. Skipping migration.');
  } else {
    console.log('Adding JIRA fields to work_goals table...');
    db.exec(`
      ALTER TABLE work_goals ADD COLUMN jiraIssueKey TEXT;
      ALTER TABLE work_goals ADD COLUMN jiraUrl TEXT;
      ALTER TABLE work_goals ADD COLUMN lastSyncedAt TEXT;
    `);
    console.log('✓ Added JIRA fields to work_goals');
  }
  
  // Check work_todos table
  const workTodosInfo = db.prepare("PRAGMA table_info(work_todos)").all();
  const todosHasJiraFields = workTodosInfo.some(col => col.name === 'jiraIssueKey');
  
  if (todosHasJiraFields) {
    console.log('JIRA fields already exist in work_todos table. Skipping migration.');
  } else {
    console.log('Adding JIRA fields to work_todos table...');
    db.exec(`
      ALTER TABLE work_todos ADD COLUMN jiraIssueKey TEXT;
      ALTER TABLE work_todos ADD COLUMN jiraUrl TEXT;
      ALTER TABLE work_todos ADD COLUMN lastSyncedAt TEXT;
    `);
    console.log('✓ Added JIRA fields to work_todos');
  }
  
  // Add JIRA settings to user_settings if needed
  const settingsInfo = db.prepare("PRAGMA table_info(user_settings)").all();
  const hasJiraSettings = settingsInfo.some(col => col.name === 'jiraEnabled');
  
  if (!hasJiraSettings) {
    console.log('Adding JIRA settings columns...');
    db.exec(`
      ALTER TABLE user_settings ADD COLUMN jiraEnabled BOOLEAN DEFAULT 0;
      ALTER TABLE user_settings ADD COLUMN jiraDomain TEXT;
      ALTER TABLE user_settings ADD COLUMN jiraEmail TEXT;
      ALTER TABLE user_settings ADD COLUMN jiraApiToken TEXT;
      ALTER TABLE user_settings ADD COLUMN jiraProjectKey TEXT;
      ALTER TABLE user_settings ADD COLUMN jiraComponent TEXT;
    `);
    console.log('✓ Added JIRA settings columns');
  } else {
    console.log('JIRA settings columns already exist. Checking for component field...');
    const hasComponent = settingsInfo.some(col => col.name === 'jiraComponent');
    if (!hasComponent) {
      console.log('Adding jiraComponent field...');
      db.exec(`ALTER TABLE user_settings ADD COLUMN jiraComponent TEXT;`);
      console.log('✓ Added jiraComponent field');
    }
  }
  
  db.close();
  console.log('\n✅ Migration completed successfully!');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
