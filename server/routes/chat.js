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
  try {
    const user = await db.findUserById(req.user.id);
    if (user) userContext = `The user's name is ${user.name}, they have ${user.points} Entain Points.`;
  } catch (err) {
    // Ignore - proceed without user context
  }

  // Get actual match data from the database for accurate answers
  let matchContext = '';
  try {
    const matches = await db.getAllMatches();
    const groupMap = {};
    matches.forEach(m => {
      if (!groupMap[m.group_name]) groupMap[m.group_name] = { teams: new Set(), matches: [] };
      groupMap[m.group_name].teams.add(m.home_team);
      groupMap[m.group_name].teams.add(m.away_team);
      groupMap[m.group_name].matches.push(m);
    });

    matchContext = '\n\nACTUAL FIFA 2026 MATCH DATA (use ONLY this data for answers, do NOT guess or make up information):\n';
    for (const [group, data] of Object.entries(groupMap).sort()) {
      matchContext += `\nGroup ${group}: ${[...data.teams].join(', ')}\n`;
      data.matches.forEach(m => {
        const date = new Date(m.match_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const time = new Date(m.match_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const score = m.status === 'finished' ? ` [RESULT: ${m.home_score}-${m.away_score}]` : ` [Odds: ${m.home_odds}/${m.draw_odds}/${m.away_odds}]`;
        matchContext += `  ${m.home_team} vs ${m.away_team} — ${date} ${time} — ${m.venue}${score}\n`;
      });
    }
  } catch (err) {
    // Proceed without match context if DB query fails
  }

  try {
    const response = await callGroq(message, userContext + matchContext);
    res.json({ reply: response });
  } catch (err) {
    console.error('Groq API error:', err.message);
    res.status(500).json({ error: 'AI assistant is temporarily unavailable. Please try again.' });
  }
});

function callGroq(userMessage, userContext) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n' + userContext },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
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
