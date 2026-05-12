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

function startPolling(intervalMs = 120000) { if (!pollingInterval) pollingInterval = setInterval(() => {}, intervalMs); }
function stopPolling() { if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; } }

module.exports = { settleMatch, simulateMatch, simulateAll, simulateNext, startPolling, stopPolling };
