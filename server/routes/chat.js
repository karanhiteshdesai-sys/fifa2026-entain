const express = require('express');
const https = require('https');
const { authenticate } = require('../middleware/auth');
const { db } = require('../db/database');

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are the FIFA 2026 Predictions assistant for Entain employees. You are friendly and conversational.

You help with:
- FIFA 2026 World Cup match information (teams, groups, schedule, venues)
- How the predictions platform works (placing bets, Entain Points, leaderboard)
- Match odds and predictions advice
- General FIFA 2026 tournament info
- How to use the webapp (navigation, features, settings)
- Casual conversation - greetings, small talk, banter about football

CRITICAL RULES:
- ONLY use the match data provided below for answering questions about groups, teams, dates, venues, and results.
- NEVER guess or make up match dates, groups, or opponents. If the data is not provided, say you don't have that information.
- Be precise with dates, group letters, and team names.

Key facts about this platform:
- Employees start with 20 Entain Points (EP) - virtual currency, no real money
- They can bet on match outcomes: home win, draw, or away win
- Winnings = stake × odds
- 48 teams in 12 groups (A through L), 72 group stage matches
- Tournament runs June 11 - July 19, 2026 in USA, Mexico, and Canada
- Host cities: Mexico City, Guadalajara, Monterrey (Mexico), Toronto, Vancouver (Canada), New York, Los Angeles, Miami, Dallas, Houston, Atlanta, Seattle, San Francisco, Philadelphia, Boston, Kansas City (USA)
- Admin approves new registrations
- Only @entaingroup.com emails can register

WEBAPP GUIDE (use this to answer questions about how to use the app):
- Navigation: Home, Matches, Standings, Leaderboard, My Bets, Group Chat pages are in the top navbar.
- Placing a bet: Go to Matches page, find an upcoming match, click Home/Draw/Away button, choose your prediction, enter stake, confirm.
- Checking bets: Go to "My Bets" page to see all your placed bets and their status.
- Leaderboard: Shows rankings by Entain Points. Top 3 get gold/silver/bronze medals.
- Standings: Shows group tables with team points, wins, draws, losses, goal difference.
- Change password: Click your profile/name in the navbar, then "Change Password". Enter current password and new password (min 6 chars).
- Group Chat: Click the chat icon (bottom-left) to open the employee group chat. Everyone can see messages.
- Referral: Share your referral code with colleagues. When they register and get approved, you earn 25 EP bonus.
- Notifications: Click the bell icon in the navbar to see bet results, broadcasts, and other alerts.
- Points: You start with 20 EP. Win bets to earn more. If you run out, ask admin to top up.
- Registration: Only @entaingroup.com emails. After registering, wait for admin approval before you can log in.

Be friendly, concise, and helpful. Respond naturally to greetings and casual messages. Give specific dates, venues, and odds when asked about matches.

RESPONSE STYLE RULES:
- Keep responses SHORT — 1-3 sentences max for simple questions.
- Talk like a mate, not a textbook. Casual, natural tone.
- No bullet points or lists unless the user specifically asks for multiple items.
- Don't repeat the question back. Just answer it directly.
- Don't add unnecessary context or disclaimers.
- If someone says "hi", just say hi back — don't give a paragraph.`;

router.post('/', authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Get some context about the user (non-blocking)
  let userContext = '';
  let user;
  try {
    user = await db.findUserById(req.user.id);
    if (user) userContext = `The user's name is ${user.name}, they have ${user.points} Entain Points.`;
  } catch (err) {}

  // Get actual match data from the database for accurate answers
  let matchContext = '';
  let upcomingMatches = [];
  try {
    const matches = await db.getAllMatches();
    upcomingMatches = matches.filter(m => m.status === 'upcoming');
    const groupMap = {};
    matches.forEach(m => {
      if (!m.group_name) return;
      if (!groupMap[m.group_name]) groupMap[m.group_name] = { teams: new Set(), matches: [] };
      groupMap[m.group_name].teams.add(m.home_team);
      groupMap[m.group_name].teams.add(m.away_team);
      groupMap[m.group_name].matches.push(m);
    });

    matchContext = '\nFIFA 2026 DATA (ONLY source of truth — do NOT use training data):\n';
    for (const [group, data] of Object.entries(groupMap).sort()) {
      matchContext += `\nGrp ${group}: ${[...data.teams].join(', ')}\n`;
      data.matches.forEach(m => {
        const d = new Date(m.match_date);
        const date = `${d.getUTCDate()}/${d.getUTCMonth()+1}`;
        const info = m.status === 'finished' ? `${m.home_score}-${m.away_score}` : `ID:${m.id} H${m.home_odds}/D${m.draw_odds}/A${m.away_odds}`;
        matchContext += `  ${m.home_team} v ${m.away_team} ${date} [${info}]\n`;
      });
    }
  } catch (err) {}

  // Check if this is a bet confirmation
  if (message === '__CONFIRM_BET__' && req.body.betData) {
    try {
      const { match_id, prediction, stake } = req.body.betData;
      const match = await db.findMatchById(match_id);
      if (!match) return res.json({ reply: "Sorry, that match doesn't exist anymore." });
      if (match.status !== 'upcoming') return res.json({ reply: "That match is no longer open for betting." });
      if (user.points < stake) return res.json({ reply: `You only have ${user.points} EP but tried to stake ${stake} EP.` });

      let odds;
      if (prediction === 'home') odds = match.home_odds;
      else if (prediction === 'draw') odds = match.draw_odds;
      else odds = match.away_odds;

      await db.deductPoints(req.user.id, stake);
      await db.createBet({ user_id: req.user.id, match_id, bet_type: 'match_result', prediction, stake, odds, status: 'pending', payout: 0 });

      const payout = Math.round(stake * odds);
      const teamName = prediction === 'home' ? match.home_team : prediction === 'away' ? match.away_team : 'Draw';
      return res.json({ reply: `Done! Bet placed: ${stake} EP on ${teamName} (${match.home_team} vs ${match.away_team}) at odds ${odds}. Potential payout: ${payout} EP. Good luck!` });
    } catch (err) {
      return res.json({ reply: "Something went wrong placing the bet. Try again or place it manually from the Matches page." });
    }
  }

  try {
    const betPrompt = `\n\nBET PLACEMENT FEATURE:
If the user wants to place a bet, respond with EXACTLY this JSON format (nothing else before or after):
{"bet":true,"match_id":<id>,"home_team":"<team>","away_team":"<team>","prediction":"<home|draw|away>","stake":<number>,"odds":<number>,"payout":<number>}

Only do this if the user clearly wants to place a bet AND specifies a team and stake amount (e.g. "bet 5 on England", "put 3 EP on Brazil to win").
Use the match ID from the data above. Calculate payout = stake * odds.
If you can't determine the match, stake, or prediction clearly, ask the user to clarify instead of outputting JSON.
If the user just asks about odds or matches without wanting to bet, answer normally without the JSON.`;

    const response = await callGroq(message, userContext + betPrompt, matchContext);
    
    // Check if AI returned a bet JSON
    try {
      const betMatch = response.match(/\{"bet"\s*:\s*true.*?\}/);
      if (betMatch) {
        const betData = JSON.parse(betMatch[0]);
        if (betData.match_id && betData.prediction && betData.stake) {
          return res.json({
            reply: `I'll place this bet for you:\n\n${betData.home_team} vs ${betData.away_team}\nYour pick: ${betData.prediction === 'home' ? betData.home_team : betData.prediction === 'away' ? betData.away_team : 'Draw'}\nStake: ${betData.stake} EP\nOdds: ${betData.odds}\nPotential payout: ${betData.payout} EP\n\nShall I confirm this bet?`,
            betData: { match_id: betData.match_id, prediction: betData.prediction, stake: betData.stake }
          });
        }
      }
    } catch (e) { /* Not a bet response, continue normally */ }

    res.json({ reply: response });
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: 'AI assistant is temporarily unavailable. Please try again.' });
  }
});

function callGroq(userMessage, userContext, matchContext) {
  return new Promise((resolve, reject) => {
    const systemContent = SYSTEM_PROMPT + '\n' + userContext;
    const messages = [
      { role: 'system', content: systemContent },
    ];

    // Add match data as a separate system message so it's clearly structured
    if (matchContext) {
      messages.push({ role: 'system', content: matchContext });
    }

    messages.push({ role: 'user', content: userMessage });

    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.1,
      max_tokens: 200
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content);
          } else {
            console.error('Groq API response error:', parsed.error || parsed);
            reject(new Error(parsed.error?.message || 'No response from AI'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = router;
