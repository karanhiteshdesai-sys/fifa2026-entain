const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-seed if database is missing or outdated
const dbPath = path.join(__dirname, 'db', 'data.json');
if (!fs.existsSync(dbPath)) {
  require('./db/seed');
} else {
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    // Re-seed if users don't have status field
    if (data.users && data.users[0] && !data.users[0].status) {
      console.log('Database outdated, re-seeding...');
      require('./db/seed');
    }
  } catch (e) {
    require('./db/seed');
  }
}

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const betRoutes = require('./routes/bets');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');
const resultsRoutes = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://fifa2026-entain.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/results', resultsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FIFA 2026 Predictions API' });
});

app.listen(PORT, () => {
  console.log(`🏆 FIFA 2026 Predictions API running on http://localhost:${PORT}`);
});
