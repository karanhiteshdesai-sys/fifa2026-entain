/**
 * Option C Reset: Keep all user accounts, delete all bets, reset everyone to 100 EP.
 * Also clears notifications and chat messages.
 * 
 * Run: node server/db/reset-bets.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fifa2026_db_user:rR8QlA7YhOPS6Qp9e2neCMW9Qzl1HevH@dpg-d80uhjvaqgkc73afiosg-a/fifa2026_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function reset() {
  console.log('🔄 Starting Option C reset...');
  console.log('   - Keeping all user accounts');
  console.log('   - Deleting all bets');
  console.log('   - Resetting all points to 100 EP');
  console.log('   - Clearing notifications and messages');
  console.log('');

  try {
    // Delete all bets
    const bets = await pool.query('DELETE FROM bets');
    console.log(`✅ Deleted ${bets.rowCount} bets`);

    // Reset all user points to 100
    const users = await pool.query('UPDATE users SET points = 100');
    console.log(`✅ Reset ${users.rowCount} users to 100 EP`);

    // Clear notifications
    const notifs = await pool.query('DELETE FROM notifications');
    console.log(`✅ Deleted ${notifs.rowCount} notifications`);

    // Clear DMs/messages
    try {
      const dms = await pool.query('DELETE FROM direct_messages');
      console.log(`✅ Deleted ${dms.rowCount} direct messages`);
    } catch (e) { console.log('   (no direct_messages table)'); }

    // Clear group chat
    try {
      const chat = await pool.query('DELETE FROM group_messages');
      console.log(`✅ Deleted ${chat.rowCount} group chat messages`);
    } catch (e) { console.log('   (no group_messages table)'); }

    // Reset match statuses back to upcoming (optional — uncomment if needed)
    // await pool.query("UPDATE matches SET status = 'upcoming', home_score = NULL, away_score = NULL");

    console.log('\n🏁 Reset complete! All users keep their accounts with 100 EP. Ready for fresh start.');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  } finally {
    await pool.end();
  }
}

reset();
