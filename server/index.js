const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Auto-seed if database is missing
const dbPath = path.join(__dirname, 'db', 'data.json');
if (!fs.existsSync(dbPath)) {
  require('./db/seed');
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
app.use('/api/chat', chatRoutes);
app.use('/api/groupchat', groupChatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FIFA 2026 Predictions API' });
});

app.listen(PORT, () => {
  console.log(`🏆 FIFA 2026 Predictions API running on http://localhost:${PORT}`);
});
