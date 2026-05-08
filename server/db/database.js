const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Default empty database structure
const defaultData = {
  users: [],
  matches: [],
  bets: [],
  nextId: { users: 1, matches: 1, bets: 1 }
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading database:', err.message);
  }
  return { ...defaultData };
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Simple query-like interface
const db = {
  getData() {
    return loadDb();
  },

  saveData(data) {
    saveDb(data);
  },

  // Users
  findUserByEmail(email) {
    const data = loadDb();
    return data.users.find(u => u.email === email) || null;
  },

  findUserById(id) {
    const data = loadDb();
    return data.users.find(u => u.id === id) || null;
  },

  createUser(user) {
    const data = loadDb();
    user.id = data.nextId.users++;
    user.created_at = new Date().toISOString();
    data.users.push(user);
    saveDb(data);
    return user;
  },

  updateUserPoints(userId, points) {
    const data = loadDb();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.points = points;
      saveDb(data);
    }
  },

  addPoints(userId, amount) {
    const data = loadDb();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.points += amount;
      saveDb(data);
    }
  },

  deductPoints(userId, amount) {
    const data = loadDb();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.points -= amount;
      saveDb(data);
    }
  },

  updateUserPassword(userId, hashedPassword) {
    const data = loadDb();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      saveDb(data);
    }
  },

  getAllUsers() {
    const data = loadDb();
    return data.users.map(({ password, ...rest }) => rest);
  },

  // Matches
  getAllMatches(filters = {}) {
    const data = loadDb();
    let matches = data.matches;
    if (filters.stage) matches = matches.filter(m => m.stage === filters.stage);
    if (filters.status) matches = matches.filter(m => m.status === filters.status);
    if (filters.group) matches = matches.filter(m => m.group_name === filters.group);
    return matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  },

  findMatchById(id) {
    const data = loadDb();
    return data.matches.find(m => m.id === id) || null;
  },

  updateMatch(matchId, updates) {
    const data = loadDb();
    const match = data.matches.find(m => m.id === matchId);
    if (match) {
      Object.assign(match, updates);
      saveDb(data);
    }
    return match;
  },

  createMatch(match) {
    const data = loadDb();
    match.id = data.nextId.matches++;
    match.created_at = new Date().toISOString();
    data.matches.push(match);
    saveDb(data);
    return match;
  },

  // Bets
  createBet(bet) {
    const data = loadDb();
    bet.id = data.nextId.bets++;
    bet.created_at = new Date().toISOString();
    data.bets.push(bet);
    saveDb(data);
    return bet;
  },

  getBetsByUser(userId) {
    const data = loadDb();
    return data.bets
      .filter(b => b.user_id === userId)
      .map(bet => {
        const match = data.matches.find(m => m.id === bet.match_id);
        return {
          ...bet,
          home_team: match?.home_team,
          away_team: match?.away_team,
          match_date: match?.match_date,
          home_score: match?.home_score,
          away_score: match?.away_score,
          match_status: match?.status
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getPendingBetsByMatch(matchId) {
    const data = loadDb();
    return data.bets.filter(b => b.match_id === matchId && b.status === 'pending');
  },

  updateBet(betId, updates) {
    const data = loadDb();
    const bet = data.bets.find(b => b.id === betId);
    if (bet) {
      Object.assign(bet, updates);
      saveDb(data);
    }
    return bet;
  },

  // Leaderboard
  getLeaderboard() {
    const data = loadDb();
    return data.users
      .filter(u => u.role !== 'admin')
      .map(user => {
        const userBets = data.bets.filter(b => b.user_id === user.id);
        return {
          id: user.id,
          name: user.name,
          points: user.points,
          total_bets: userBets.length,
          bets_won: userBets.filter(b => b.status === 'won').length,
          bets_lost: userBets.filter(b => b.status === 'lost').length,
          total_winnings: userBets.filter(b => b.status === 'won').reduce((sum, b) => sum + b.payout, 0)
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 50);
  }
};

module.exports = db;
