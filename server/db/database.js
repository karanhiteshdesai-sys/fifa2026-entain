const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fifa2026_db_user:rR8QlA7YhOPS6Qp9e2neCMW9Qzl1HevH@dpg-d80uhjvaqgkc73afiosg-a/fifa2026_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

// Initialize tables
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      department TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'pending',
      points INTEGER DEFAULT 100,
      referred_by INTEGER,
      referral_code TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      group_name TEXT,
      stage TEXT DEFAULT 'group',
      match_date TIMESTAMP NOT NULL,
      venue TEXT,
      home_score INTEGER,
      away_score INTEGER,
      status TEXT DEFAULT 'upcoming',
      home_odds REAL DEFAULT 2.0,
      draw_odds REAL DEFAULT 3.0,
      away_odds REAL DEFAULT 2.5,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bets (
      id SERIAL PRIMARY KEY,
      bet_number TEXT UNIQUE,
      user_id INTEGER REFERENCES users(id),
      match_id INTEGER REFERENCES matches(id),
      bet_type TEXT NOT NULL,
      prediction TEXT NOT NULL,
      stake INTEGER NOT NULL,
      odds REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payout INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT NOT NULL,
      user_role TEXT DEFAULT 'user',
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS broadcasts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id SERIAL PRIMARY KEY,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add new columns for existing databases (safe to run multiple times)
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT');
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''");
    await pool.query('ALTER TABLE bets ADD COLUMN IF NOT EXISTS bet_number TEXT');
  } catch (e) { /* columns may already exist */ }

  console.log('✅ Database tables initialized');
}

// ===== USERS =====
const db = {
  async findUserByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findUserById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async createUser(user) {
    // Generate unique referral code: first 3 chars of name + random 5 chars
    const prefix = user.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referralCode = `FIFA-${prefix}${randomPart}`;

    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password, department, country, role, status, points, referred_by, referral_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [user.name, user.email, user.password, user.department || '', user.country || '', user.role, user.status || 'pending', user.points || 100, user.referred_by || null, referralCode]
    );
    return rows[0];
  },

  async updateUserPoints(userId, points) {
    await pool.query('UPDATE users SET points = $1 WHERE id = $2', [points, userId]);
  },

  async addPoints(userId, amount) {
    await pool.query('UPDATE users SET points = points + $1 WHERE id = $2', [amount, userId]);
  },

  async deductPoints(userId, amount) {
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [amount, userId]);
  },

  async updateUserPassword(userId, hashedPassword) {
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
  },

  async updateUserStatus(userId, status) {
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
  },

  async deleteUser(userId) {
    await pool.query('DELETE FROM bets WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  },

  async getAllUsers() {
    const { rows } = await pool.query('SELECT id, name, email, department, role, status, points, created_at FROM users WHERE role != $1 ORDER BY created_at DESC', ['admin']);
    return rows;
  },

  async getAllUsersIncludingStatus() {
    const { rows } = await pool.query('SELECT id, name, email, department, role, status, points, created_at FROM users WHERE role != $1 ORDER BY created_at DESC', ['admin']);
    return rows;
  },

  // ===== MATCHES =====
  async getAllMatches(filters = {}) {
    let query = 'SELECT * FROM matches WHERE 1=1';
    const params = [];
    let i = 1;

    if (filters.stage) { query += ` AND stage = $${i++}`; params.push(filters.stage); }
    if (filters.status) { query += ` AND status = $${i++}`; params.push(filters.status); }
    if (filters.group) { query += ` AND group_name = $${i++}`; params.push(filters.group); }

    query += ' ORDER BY match_date ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findMatchById(id) {
    const { rows } = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async updateMatch(matchId, updates) {
    const sets = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }
    params.push(matchId);
    await pool.query(`UPDATE matches SET ${sets.join(', ')} WHERE id = $${i}`, params);
  },

  // ===== BETS =====
  async createBet(bet) {
    // Generate unique bet number: EFIFA + 4 digit sequential number
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as count FROM bets');
    const nextNum = Number(countRows[0].count) + 1;
    const betNumber = `EFIFA${String(nextNum).padStart(4, '0')}`;

    const { rows } = await pool.query(
      'INSERT INTO bets (bet_number, user_id, match_id, bet_type, prediction, stake, odds, status, payout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [betNumber, bet.user_id, bet.match_id, bet.bet_type, bet.prediction, bet.stake, bet.odds, bet.status || 'pending', bet.payout || 0]
    );
    return rows[0];
  },

  async getBetsByUser(userId) {
    const { rows } = await pool.query(`
      SELECT b.*, m.home_team, m.away_team, m.match_date, m.home_score, m.away_score, m.status as match_status
      FROM bets b JOIN matches m ON b.match_id = m.id
      WHERE b.user_id = $1 ORDER BY b.created_at DESC
    `, [userId]);
    return rows;
  },

  async getPendingBetsByMatch(matchId) {
    const { rows } = await pool.query('SELECT * FROM bets WHERE match_id = $1 AND status = $2', [matchId, 'pending']);
    return rows;
  },

  async updateBet(betId, updates) {
    const sets = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(updates)) {
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }
    params.push(betId);
    await pool.query(`UPDATE bets SET ${sets.join(', ')} WHERE id = $${i}`, params);
  },

  async getAllBets() {
    const { rows } = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, m.home_team, m.away_team, m.match_date, m.group_name
      FROM bets b
      JOIN users u ON b.user_id = u.id
      JOIN matches m ON b.match_id = m.id
      ORDER BY b.created_at DESC
    `);
    return rows;
  },

  // ===== LEADERBOARD =====
  async getLeaderboard() {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.department, u.country, u.points,
        COUNT(b.id) as total_bets,
        SUM(CASE WHEN b.status = 'won' THEN 1 ELSE 0 END) as bets_won,
        SUM(CASE WHEN b.status = 'lost' THEN 1 ELSE 0 END) as bets_lost,
        COALESCE(SUM(CASE WHEN b.status = 'won' THEN b.payout ELSE 0 END), 0) as total_winnings
      FROM users u
      LEFT JOIN bets b ON u.id = b.user_id
      WHERE u.email != 'admin@entaingroup.com' AND u.status != 'pending' AND u.status != 'rejected'
      GROUP BY u.id
      HAVING COUNT(b.id) >= 1
      ORDER BY u.points DESC
      LIMIT 50
    `);
    return rows.map(r => {
      const totalBets = Number(r.total_bets);
      const betsWon = Number(r.bets_won);
      const points = Number(r.points);
      const winRate = totalBets > 0 ? (betsWon / totalBets) * 100 : 0;

      // Composite score: 60% EP balance + 40% win rate
      const score = Math.round((points * 0.6) + (winRate * 0.4 * 100));

      return {
        ...r,
        total_bets: totalBets,
        bets_won: betsWon,
        bets_lost: Number(r.bets_lost),
        total_winnings: Number(r.total_winnings),
        win_rate: Math.round(winRate),
        score
      };
    }).sort((a, b) => b.score - a.score || b.total_bets - a.total_bets);
  },

  // ===== CHAT =====
  async getChatMessages() {
    const { rows } = await pool.query('SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 100');
    return rows;
  },

  async createChatMessage(msg) {
    const { rows } = await pool.query(
      'INSERT INTO chat_messages (user_id, user_name, user_role, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [msg.user_id, msg.user_name, msg.user_role, msg.message]
    );
    return rows[0];
  },

  // ===== NOTIFICATIONS =====
  async getNotifications(userId) {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
    return rows;
  },

  async getUnreadCount(userId) {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false', [userId]);
    return Number(rows[0].count);
  },

  async markNotificationsRead(userId) {
    await pool.query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
  },

  async createNotification(userId, title, message) {
    await pool.query('INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)', [userId, title, message]);
  },

  // ===== BROADCASTS =====
  async createBroadcast(title, message) {
    const { rows } = await pool.query(
      'INSERT INTO broadcasts (title, message) VALUES ($1, $2) RETURNING *',
      [title, message]
    );
    return rows[0];
  },

  async getLatestBroadcast(since) {
    const { rows } = await pool.query(
      'SELECT * FROM broadcasts WHERE created_at > $1 ORDER BY created_at DESC LIMIT 1',
      [since]
    );
    return rows[0] || null;
  },

  // ===== UTILITY =====
  async getMatchCount() {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM matches');
    return Number(rows[0].count);
  },

  async getReferralsByUser(userId) {
    const { rows } = await pool.query(
      'SELECT id, name, email, status, created_at FROM users WHERE referred_by = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findUserByReferralCode(code) {
    const { rows } = await pool.query('SELECT * FROM users WHERE referral_code = $1', [code.toUpperCase().trim()]);
    return rows[0] || null;
  },

  async updateUserReferralCode(userId, code) {
    await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);
  },

  // ===== DIRECT MESSAGES =====
  async sendDirectMessage(fromUserId, toUserId, message) {
    const { rows } = await pool.query(
      'INSERT INTO direct_messages (from_user_id, to_user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [fromUserId, toUserId, message]
    );
    return rows[0];
  },

  async getDirectMessages(userId) {
    const { rows } = await pool.query(`
      SELECT dm.*, 
        sender.name as from_name, sender.role as from_role,
        receiver.name as to_name
      FROM direct_messages dm
      JOIN users sender ON dm.from_user_id = sender.id
      JOIN users receiver ON dm.to_user_id = receiver.id
      WHERE dm.to_user_id = $1 OR dm.from_user_id = $1
      ORDER BY dm.created_at DESC
      LIMIT 100
    `, [userId]);
    return rows;
  },

  async getConversation(userId1, userId2) {
    const { rows } = await pool.query(`
      SELECT dm.*, 
        sender.name as from_name, sender.role as from_role
      FROM direct_messages dm
      JOIN users sender ON dm.from_user_id = sender.id
      WHERE (dm.from_user_id = $1 AND dm.to_user_id = $2)
         OR (dm.from_user_id = $2 AND dm.to_user_id = $1)
      ORDER BY dm.created_at ASC
      LIMIT 100
    `, [userId1, userId2]);
    return rows;
  },

  async markDirectMessagesRead(userId, fromUserId) {
    await pool.query(
      'UPDATE direct_messages SET read = true WHERE to_user_id = $1 AND from_user_id = $2 AND read = false',
      [userId, fromUserId]
    );
  },

  async getUnreadDMCount(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM direct_messages WHERE to_user_id = $1 AND read = false',
      [userId]
    );
    return Number(rows[0].count);
  }
};

module.exports = { pool, initDb, db };
