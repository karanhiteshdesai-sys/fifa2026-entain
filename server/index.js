const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, db } = require('./db/database');

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

// Initialize database and seed if needed, then start server
async function start() {
  await initDb();

  // Seed matches if empty
  const matchCount = await db.getMatchCount();
  if (matchCount === 0) {
    console.log('No matches found, seeding...');
    await require('./db/seed');
  }

  const authRoutes = require('./routes/auth');
  const matchRoutes = require('./routes/matches');
  const betRoutes = require('./routes/bets');
  const leaderboardRoutes = require('./routes/leaderboard');
  const adminRoutes = require('./routes/admin');
  const exportRoutes = require('./routes/export');
  const resultsRoutes = require('./routes/results');
  const chatRoutes = require('./routes/chat');
  const groupChatRoutes = require('./routes/groupchat');
  const notificationRoutes = require('./routes/notifications');
  const dmRoutes = require('./routes/dm');
  const activityRoutes = require('./routes/activity');
  const oddsRoutes = require('./routes/odds');
  const reviewRoutes = require('./routes/reviews');

  app.use('/api/auth', authRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/bets', betRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/results', resultsRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/groupchat', groupChatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dm', dmRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/odds', oddsRoutes);
  app.use('/api/reviews', reviewRoutes);

  // Start live odds auto-sync
  oddsRoutes.startAutoSync();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FIFA 2026 Predictions API' });
  });

  app.listen(PORT, () => {
    console.log(`🏆 FIFA 2026 Predictions API running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
