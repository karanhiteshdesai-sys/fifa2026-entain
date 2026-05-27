const express = require('express');
const https = require('https');
const { db, pool } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const ODDS_API_KEY = process.env.ODDS_API_KEY || '';
const SPORT_KEY = 'soccer_fifa_world_cup';
const REGIONS = 'uk'; // UK bookmakers for decimal odds
const ODDS_FORMAT = 'decimal';

// Team name mapping: The Odds API may use slightly different names
// Add mappings here if needed (API name -> your DB name)
const TEAM_NAME_MAP = {
  'Republic of Ireland': 'Ireland',
  'Korea Republic': 'South Korea',
  'Ivory Coast': 'Ivory Coast',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Türkiye': 'Turkiye',
  'Turkey': 'Turkiye',
  'Czech Republic': 'Czechia',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Cape Verde': 'Cabo Verde',
  'DR Congo': 'DR Congo',
  'Congo DR': 'DR Congo',
  'Dem. Rep. Congo': 'DR Congo',
};

function normalizeTeamName(name) {
  return TEAM_NAME_MAP[name] || name;
}

// Fetch odds from The Odds API
function fetchOddsFromAPI() {
  return new Promise((resolve, reject) => {
    if (!ODDS_API_KEY) {
      return reject(new Error('ODDS_API_KEY not configured'));
    }

    const url = `/v4/sports/${SPORT_KEY}/odds/?apiKey=${ODDS_API_KEY}&regions=${REGIONS}&markets=h2h&oddsFormat=${ODDS_FORMAT}`;

    const options = {
      hostname: 'api.the-odds-api.com',
      path: url,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error(`Odds API returned ${res.statusCode}:`, data);
            return reject(new Error(`Odds API error: ${res.statusCode}`));
          }

          const remaining = res.headers['x-requests-remaining'];
          const used = res.headers['x-requests-used'];
          console.log(`📊 Odds API quota: ${used} used, ${remaining} remaining`);

          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Match API event to our database match using team names
async function matchEventToDbMatch(event) {
  const homeTeam = normalizeTeamName(event.home_team);
  const awayTeam = normalizeTeamName(event.away_team);

  // Try exact match first
  const { rows } = await pool.query(
    'SELECT id, home_team, away_team FROM matches WHERE LOWER(home_team) = LOWER($1) AND LOWER(away_team) = LOWER($2) AND status = $3',
    [homeTeam, awayTeam, 'upcoming']
  );

  if (rows.length > 0) return rows[0];

  // Try reversed (in case API has teams swapped)
  const { rows: reversed } = await pool.query(
    'SELECT id, home_team, away_team FROM matches WHERE LOWER(home_team) = LOWER($1) AND LOWER(away_team) = LOWER($2) AND status = $3',
    [awayTeam, homeTeam, 'upcoming']
  );

  if (reversed.length > 0) return reversed[0];

  return null;
}

// Extract average odds from bookmakers
function extractAverageOdds(bookmakers) {
  let homeOdds = [], drawOdds = [], awayOdds = [];

  for (const bookmaker of bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket || !h2hMarket.outcomes) continue;

    for (const outcome of h2hMarket.outcomes) {
      // h2h market has 3 outcomes for soccer: home, away, draw
      // The outcome name matches the team name, or "Draw"
      if (outcome.name === 'Draw') {
        drawOdds.push(outcome.price);
      }
      // We'll figure out home/away by position or name matching later
    }
  }

  // For soccer h2h, outcomes are [home_team, away_team, Draw]
  for (const bookmaker of bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket || !h2hMarket.outcomes) continue;

    const outcomes = h2hMarket.outcomes;
    // Typically: outcomes[0] = team1, outcomes[1] = team2, outcomes[2] = Draw (if 3-way)
    // But names are used, so we match by name
    for (const outcome of outcomes) {
      if (outcome.name === 'Draw') {
        // already handled
      }
    }
  }

  // Simpler approach: collect all bookmaker odds by position
  let allHome = [], allDraw = [], allAway = [];

  for (const bookmaker of bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket || !h2hMarket.outcomes || h2hMarket.outcomes.length < 3) continue;

    // For 3-way soccer markets, outcomes are named by team + "Draw"
    const homeOutcome = h2hMarket.outcomes.find(o => o.name !== 'Draw' && o === h2hMarket.outcomes[0]);
    const awayOutcome = h2hMarket.outcomes.find(o => o.name !== 'Draw' && o !== h2hMarket.outcomes[0]);
    const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

    if (homeOutcome) allHome.push(homeOutcome.price);
    if (drawOutcome) allDraw.push(drawOutcome.price);
    if (awayOutcome) allAway.push(awayOutcome.price);
  }

  const avg = arr => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;

  return {
    home_odds: avg(allHome),
    draw_odds: avg(allDraw),
    away_odds: avg(allAway)
  };
}

// Sync odds from API to database
async function syncOdds() {
  try {
    console.log('🔄 Syncing odds from The Odds API...');
    const events = await fetchOddsFromAPI();

    if (!events || events.length === 0) {
      console.log('ℹ️ No FIFA World Cup events found (tournament may not be listed yet).');
      return { synced: 0, total: 0, message: 'No events available from API' };
    }

    let synced = 0;
    let unmatched = [];

    for (const event of events) {
      const dbMatch = await matchEventToDbMatch(event);

      if (!dbMatch) {
        unmatched.push(`${event.home_team} vs ${event.away_team}`);
        continue;
      }

      if (!event.bookmakers || event.bookmakers.length === 0) continue;

      const odds = extractAverageOdds(event.bookmakers);

      if (odds.home_odds && odds.draw_odds && odds.away_odds) {
        await pool.query(
          'UPDATE matches SET home_odds = $1, draw_odds = $2, away_odds = $3 WHERE id = $4',
          [odds.home_odds, odds.draw_odds, odds.away_odds, dbMatch.id]
        );
        synced++;
        console.log(`  ✅ ${dbMatch.home_team} vs ${dbMatch.away_team}: ${odds.home_odds} / ${odds.draw_odds} / ${odds.away_odds}`);
      }
    }

    if (unmatched.length > 0) {
      console.log(`  ⚠️ Unmatched events: ${unmatched.join(', ')}`);
    }

    console.log(`🏁 Odds sync complete: ${synced}/${events.length} matches updated`);
    return { synced, total: events.length, unmatched };
  } catch (err) {
    console.error('❌ Odds sync failed:', err.message);
    return { error: err.message };
  }
}

// API endpoint: manually trigger odds sync (admin only)
router.post('/sync', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const result = await syncOdds();
    res.json(result);
  } catch (err) {
    console.error('Odds sync error:', err);
    res.status(500).json({ error: 'Failed to sync odds.' });
  }
});

// API endpoint: get current odds status
router.get('/status', authenticate, async (req, res) => {
  res.json({
    configured: !!ODDS_API_KEY,
    sport: SPORT_KEY,
    regions: REGIONS,
    message: ODDS_API_KEY ? 'Odds API configured' : 'ODDS_API_KEY not set in environment'
  });
});

// Auto-sync: run every 6 hours if API key is configured
let syncInterval = null;
function startAutoSync() {
  if (!ODDS_API_KEY) {
    console.log('⚠️ ODDS_API_KEY not set — live odds sync disabled. Using seeded odds.');
    return;
  }

  // Sync on startup (after a short delay to let DB initialize)
  setTimeout(() => syncOdds(), 10000);

  // Then every 6 hours (to stay within free tier: 500 requests/month)
  syncInterval = setInterval(() => syncOdds(), 6 * 60 * 60 * 1000);
  console.log('⏰ Auto odds sync enabled: every 6 hours');
}

module.exports = router;
module.exports.startAutoSync = startAutoSync;
module.exports.syncOdds = syncOdds;
