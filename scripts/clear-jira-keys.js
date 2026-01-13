const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'goals.db');
const db = new Database(DB_PATH);

console.log('Clearing old JIRA keys from database...');

try {
  // Clear JIRA info from work_goals
  const goalsResult = db.prepare(`
    UPDATE work_goals
    SET jiraIssueKey = NULL,
        jiraUrl = NULL,
        lastSyncedAt = NULL
  `).run();
  
  console.log(`✓ Cleared JIRA keys from ${goalsResult.changes} work goals`);

  // Clear JIRA info from work_todos
  const todosResult = db.prepare(`
    UPDATE work_todos
    SET jiraIssueKey = NULL,
        jiraUrl = NULL,
        lastSyncedAt = NULL
  `).run();
  
  console.log(`✓ Cleared JIRA keys from ${todosResult.changes} work todos`);

  // Clear JIRA comment IDs
  const commentsResult = db.prepare(`
    UPDATE comments
    SET jiraCommentId = NULL
  `).run();
  
  console.log(`✓ Cleared JIRA comment IDs from ${commentsResult.changes} comments`);

  console.log('\nJIRA keys cleared successfully!');
  console.log('Next sync will search for existing JIRA issues by title and link them properly.');
} catch (error) {
  console.error('Failed to clear JIRA keys:', error);
  process.exit(1);
} finally {
  db.close();
}
