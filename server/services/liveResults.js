const https = require('https');
const db = require('../db/database');
const { generateExcel } = require('./excel');
const { createNotification } = require('./notifications');

// Football-Data.org API (free tier: 10 requests/min)
// Sign up at https://www.football-data.org/ for a free API key
const API_KEY = process.env.FOOTBALL_API_KEY || '';
const COMPETITION_ID = '2000'; // FIFA World Cup

let pollingInterval = null;

/**
 * Fetch live results from football-data.org API
 * This will work once the tournament starts (June 11, 2026)
 */
function fetchLiveResults() {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      return reject(new Error('No FOOTBALL_API_KEY set. Add it to environment variables.'));
    }

    const options = {
      hostname: 'api.football-data.org',
      path: `/v4/competitions/${COMPETITION_ID}/matches?status=FINISHED`,
      headers: { 'X-Auth-Token': API_KEY }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.matches || []);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Match API results to our database and settle bets
 */
async function syncResults() {
  try {
    const apiMatches = await fetchLiveResults();
    let settled = 0;

    for (const apiMatch of apiMatches) {
      const homeTeam = apiMatch.homeTeam?.name;
      const awayTeam = apiMatch.awayTeam?.name;
      const homeScore = apiMatch.score?.fullTime?.home;
      const awayScore = apiMatch.score?.fullTime?.away;

      if (homeScore === null || awayScore === null) continue;

      // Find matching match in our DB
      const allMatches = db.getAllMatches({ status: 'upcoming' });
      const match = allMatches.find(m =>
        normalizeTeamName(m.home_team) === normalizeTeamName(homeTeam) &&
        normalizeTeamName(m.away_team) === normalizeTeamName(awayTeam)
      );

      if (match) {
        settleMatch(match.id, homeScore, awayScore);
        settled++;
      }
    }

    if (settled > 0) {
      await generateExcel();
      console.log(`✅ Auto-settled ${settled} match(es) from live API`);
    }

    return { settled };
  } catch (err) {
    console.error('Live results sync failed:', err.message);
    return { error: err.message };
  }
}

/**
 * Settle a single match and pay out winners
 */
function settleMatch(matchId, homeScore, awayScore) {
  let result;
  if (homeScore > awayScore) result = 'home';
  else if (homeScore < awayScore) result = 'away';
  else result = 'draw';

  db.updateMatch(matchId, {
    home_score: homeScore,
    away_score: awayScore,
    status: 'finished'
  });

  const bets = db.getPendingBetsByMatch(matchId);
  for (const bet of bets) {
    if (bet.prediction === result) {
      const payout = Math.round(bet.stake * bet.odds);
      db.updateBet(bet.id, { status: 'won', payout });
      db.addPoints(bet.user_id, payout);
      createNotification(bet.user_id, 'Bet Won!', `You won ${payout} EP on your bet! The match ended ${homeScore}-${awayScore}.`);
    } else {
      db.updateBet(bet.id, { status: 'lost', payout: 0 });
      createNotification(bet.user_id, 'Bet Lost', `Your bet lost. The match ended ${homeScore}-${awayScore}. Better luck next time!`);
    }
  }

  return { matchId, result, homeScore, awayScore, betsSettled: bets.length };
}

/**
 * Simulate random results for testing
 */
function simulateMatch(matchId) {
  const match = db.findMatchById(matchId);
  if (!match || match.status !== 'upcoming') return null;

  // Generate realistic random scores
  const homeScore = weightedRandomScore();
  const awayScore = weightedRandomScore();

  return settleMatch(matchId, homeScore, awayScore);
}

/**
 * Simulate all upcoming matches
 */
async function simulateAll() {
  const matches = db.getAllMatches({ status: 'upcoming' });
  const results = [];

  for (const match of matches) {
    const result = simulateMatch(match.id);
    if (result) results.push(result);
  }

  if (results.length > 0) {
    await generateExcel();
  }

  return results;
}

/**
 * Simulate next N matches (by date order)
 */
async function simulateNext(count = 1) {
  const matches = db.getAllMatches({ status: 'upcoming' });
  const results = [];

  for (let i = 0; i < Math.min(count, matches.length); i++) {
    const result = simulateMatch(matches[i].id);
    if (result) results.push(result);
  }

  if (results.length > 0) {
    await generateExcel();
  }

  return results;
}

/**
 * Start polling for live results (every 2 minutes during matches)
 */
function startPolling(intervalMs = 120000) {
  if (pollingInterval) {
    console.log('Polling already running.');
    return;
  }

  console.log(`📡 Live results polling started (every ${intervalMs / 1000}s)`);
  pollingInterval = setInterval(syncResults, intervalMs);

  // Also run immediately
  syncResults();
}

/**
 * Stop polling
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('📡 Live results polling stopped.');
  }
}

// Helper: generate weighted random score (0-4, weighted towards lower)
function weightedRandomScore() {
  const weights = [30, 35, 20, 10, 5]; // 0, 1, 2, 3, 4
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  return 0;
}

// Helper: normalize team names for matching
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace('republicof', '')
    .replace('republic', '')
    .replace('ivory coast', 'ivorycoast')
    .replace("cote d'ivoire", 'ivorycoast')
    .replace('korea', 'southkorea')
    .replace('türkiye', 'turkiye')
    .replace('turkey', 'turkiye');
}

module.exports = {
  fetchLiveResults,
  syncResults,
  settleMatch,
  simulateMatch,
  simulateAll,
  simulateNext,
  startPolling,
  stopPolling
};
