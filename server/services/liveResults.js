const https = require('https');
const { db } = require('../db/database');

const API_KEY = process.env.FOOTBALL_API_KEY || '';
let pollingInterval = null;

function settleMatch(matchId, homeScore, awayScore) {
  return (async () => {
    let result = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
    await db.updateMatch(matchId, { home_score: homeScore, away_score: awayScore, status: 'finished' });

    const bets = await db.getPendingBetsByMatch(matchId);
    const totalGoals = homeScore + awayScore;
    const correctScore = `${homeScore}-${awayScore}`;
    const bothScored = homeScore > 0 && awayScore > 0;

    for (const bet of bets) {
      let won = false;

      if (bet.bet_type === 'match_result') {
        won = bet.prediction === result;
      } else if (bet.bet_type === 'correct_score') {
        won = bet.prediction === correctScore;
      } else if (bet.bet_type === 'total_goals') {
        const [direction, line] = bet.prediction.split('_');
        const lineNum = parseFloat(line);
        won = direction === 'over' ? totalGoals > lineNum : totalGoals < lineNum;
      } else if (bet.bet_type === 'both_teams_score') {
        won = bet.prediction === 'yes' ? bothScored : !bothScored;
      } else if (bet.bet_type === 'first_to_score') {
        // Simplified: if home scored more or equal and scored at least 1, assume home scored first
        // In reality this would need minute-by-minute data
        let firstScorer = 'no_goal';
        if (totalGoals > 0) {
          firstScorer = homeScore >= awayScore ? 'home' : 'away';
        }
        won = bet.prediction === firstScorer;
      }

      if (won) {
        const payout = Math.round(bet.stake * bet.odds);
        await db.updateBet(bet.id, { status: 'won', payout });
        await db.addPoints(bet.user_id, payout);
        await db.createNotification(bet.user_id, 'Bet Won!', `You won ${payout} EP! Match ended ${homeScore}-${awayScore}.`);
      } else {
        await db.updateBet(bet.id, { status: 'lost', payout: 0 });
        await db.createNotification(bet.user_id, 'Bet Lost', `Your bet lost. Match ended ${homeScore}-${awayScore}.`);
      }
    }
    return { matchId, result, homeScore, awayScore, betsSettled: bets.length };
  })();
}

async function simulateMatch(matchId) {
  const match = await db.findMatchById(matchId);
  if (!match || match.status !== 'upcoming') return null;
  return settleMatch(matchId, weightedRandomScore(), weightedRandomScore());
}

async function simulateAll() {
  const matches = await db.getAllMatches({ status: 'upcoming' });
  const results = [];
  for (const match of matches) {
    const r = await simulateMatch(match.id);
    if (r) results.push(r);
  }
  return results;
}

async function simulateNext(count = 1) {
  const matches = await db.getAllMatches({ status: 'upcoming' });
  const results = [];
  for (let i = 0; i < Math.min(count, matches.length); i++) {
    const r = await simulateMatch(matches[i].id);
    if (r) results.push(r);
  }
  return results;
}

function weightedRandomScore() {
  const weights = [30, 35, 20, 10, 5];
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) { random -= weights[i]; if (random <= 0) return i; }
  return 0;
}

function startPolling(intervalMs = 120000) {
  if (pollingInterval) return;
  console.log('📡 Live polling started — checking every 2 minutes');
  pollForResults(); // Check immediately
  pollingInterval = setInterval(pollForResults, intervalMs);
}

async function pollForResults() {
  if (!API_KEY) {
    console.log('⚠️ No FOOTBALL_API_KEY set, skipping poll');
    return;
  }

  try {
    // Fetch FIFA 2026 World Cup matches from football-data.org
    const data = await fetchFromAPI('/v4/competitions/WC/matches?status=FINISHED');
    if (!data || !data.matches) return;

    const dbMatches = await db.getAllMatches({ status: 'upcoming' });
    let settled = 0;

    for (const apiMatch of data.matches) {
      const homeTeam = apiMatch.homeTeam.name;
      const awayTeam = apiMatch.awayTeam.name;
      const homeScore = apiMatch.score.fullTime.home;
      const awayScore = apiMatch.score.fullTime.away;

      if (homeScore === null || awayScore === null) continue;

      // Find matching DB match by team names
      const dbMatch = dbMatches.find(m =>
        normalizeTeam(m.home_team) === normalizeTeam(homeTeam) &&
        normalizeTeam(m.away_team) === normalizeTeam(awayTeam)
      );

      if (dbMatch) {
        await settleMatch(dbMatch.id, homeScore, awayScore);
        settled++;
        console.log(`✅ Settled: ${dbMatch.home_team} ${homeScore}-${awayScore} ${dbMatch.away_team}`);
      }
    }

    if (settled > 0) console.log(`📡 Poll complete: ${settled} match(es) settled`);
  } catch (err) {
    console.error('📡 Polling error:', err.message);
  }
}

function normalizeTeam(name) {
  // Normalize team names for matching between API and DB
  const map = {
    'korea republic': 'south korea',
    'republic of korea': 'south korea',
    'korea, republic of': 'south korea',
    'côte d\'ivoire': 'ivory coast',
    'cote d\'ivoire': 'ivory coast',
    'türkiye': 'turkiye',
    'turkey': 'turkiye',
    'congo dr': 'dr congo',
    'dem. rep. congo': 'dr congo',
    'democratic republic of congo': 'dr congo',
    'bosnia & herzegovina': 'bosnia and herzegovina',
    'bosnia-herzegovina': 'bosnia and herzegovina',
    'cape verde': 'cabo verde',
    'united states': 'usa',
    'united states of america': 'usa',
  };
  const lower = name.toLowerCase().trim();
  return map[lower] || lower;
}

function fetchFromAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path: path,
      method: 'GET',
      headers: { 'X-Auth-Token': API_KEY }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function stopPolling() { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; console.log('📡 Live polling stopped'); } }

module.exports = { settleMatch, simulateMatch, simulateAll, simulateNext, startPolling, stopPolling };
