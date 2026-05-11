const express = require('express');
const https = require('https');
const { authenticate } = require('../middleware/auth');
const db = require('../db/database');

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are the FIFA 2026 Predictions assistant for Entain employees. You help with:
- FIFA 2026 World Cup match information (teams, groups, schedule, venues)
- How the predictions platform works (placing bets, Entain Points, leaderboard)
- Match odds and predictions advice
- General FIFA 2026 tournament info

Key facts about this platform:
- Employees start with 20 Entain Points (EP) - virtual currency, no real money
- They can bet on match outcomes: home win, draw, or away win
- Winnings = stake × odds
- 48 teams in 12 groups (A through L), 72 group stage matches
- Tournament runs June 11 - July 19, 2026 in USA, Mexico, and Canada
- Admin approves new registrations
- Only @entaingroup.com emails can register

Be friendly, concise, and helpful. If asked about something unrelated to FIFA or the platform, politely redirect.`;

router.post('/', authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Get some context about the user
  const user = db.findUserById(req.user.id);
  const userContext = user ? `The user's name is ${user.name}, they have ${user.points} Entain Points.` : '';

  try {
    const response = await callGroq(message, userContext);
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
      temperature: 0.7,
      max_tokens: 500
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
