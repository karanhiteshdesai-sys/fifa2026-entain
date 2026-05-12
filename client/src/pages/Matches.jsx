import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Notification from '../components/Notification';

function Matches() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [betModal, setBetModal] = useState(null);
  const [stake, setStake] = useState('');
  const [prediction, setPrediction] = useState('');
  const [betType, setBetType] = useState('match_result');
  const [correctScoreHome, setCorrectScoreHome] = useState('');
  const [correctScoreAway, setCorrectScoreAway] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { message, type }
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [changedOdds, setChangedOdds] = useState({}); // { matchId: true }
  const prevOddsRef = useRef({});

  useEffect(() => {
    fetchMatches();
    // Poll for odds changes every 15 seconds
    const interval = setInterval(fetchMatches, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/matches');

      // Detect odds changes
      const prevOdds = prevOddsRef.current;
      const newChanged = {};
      data.forEach(m => {
        const prev = prevOdds[m.id];
        if (prev && (prev.home !== m.home_odds || prev.draw !== m.draw_odds || prev.away !== m.away_odds)) {
          newChanged[m.id] = true;
        }
        prevOdds[m.id] = { home: m.home_odds, draw: m.draw_odds, away: m.away_odds };
      });
      prevOddsRef.current = prevOdds;

      if (Object.keys(newChanged).length > 0) {
        setChangedOdds(newChanged);
        // Remove blink after 3 seconds (5 blinks at ~0.6s each)
        setTimeout(() => setChangedOdds({}), 3000);
      }

      setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const [confirmBet, setConfirmBet] = useState(null); // holds bet details for confirmation

  const handlePlaceBet = () => {
    let finalPrediction = prediction;
    let odds;

    if (betType === 'match_result') {
      if (!prediction || !stake || stake <= 0) return;
      odds = prediction === 'home' ? betModal.home_odds : prediction === 'away' ? betModal.away_odds : betModal.draw_odds;
    } else if (betType === 'correct_score') {
      if (correctScoreHome === '' || correctScoreAway === '' || !stake || stake <= 0) return;
      finalPrediction = `${correctScoreHome}-${correctScoreAway}`;
      const totalGoals = Number(correctScoreHome) + Number(correctScoreAway);
      if (finalPrediction === '0-0') odds = 8.0;
      else if (finalPrediction === '1-0' || finalPrediction === '0-1') odds = 6.0;
      else if (finalPrediction === '1-1') odds = 5.5;
      else if (finalPrediction === '2-1' || finalPrediction === '1-2') odds = 7.0;
      else if (finalPrediction === '2-0' || finalPrediction === '0-2') odds = 7.5;
      else if (totalGoals <= 3) odds = 9.0;
      else if (totalGoals <= 5) odds = 15.0;
      else odds = 25.0;
    } else if (betType === 'total_goals') {
      if (!prediction || !stake || stake <= 0) return;
      finalPrediction = prediction;
      if (prediction === 'over_1.5') odds = 1.5;
      else if (prediction === 'under_1.5') odds = 2.5;
      else if (prediction === 'over_2.5') odds = 1.9;
      else if (prediction === 'under_2.5') odds = 1.9;
      else if (prediction === 'over_3.5') odds = 2.8;
      else if (prediction === 'under_3.5') odds = 1.4;
    } else if (betType === 'both_teams_score') {
      if (!prediction || !stake || stake <= 0) return;
      odds = prediction === 'yes' ? 1.8 : 2.0;
    } else if (betType === 'first_to_score') {
      if (!prediction || !stake || stake <= 0) return;
      if (prediction === 'home') odds = 1.8;
      else if (prediction === 'away') odds = 2.2;
      else odds = 9.0;
    }

    // Check balance
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && stake > user.points) {
      setNotification({ message: `Insufficient balance! You have ${user.points} EP but tried to stake ${stake} EP.`, type: 'error' });
      return;
    }

    const predLabel = betType === 'match_result'
      ? (prediction === 'home' ? betModal.home_team : prediction === 'away' ? betModal.away_team : 'Draw')
      : betType === 'correct_score'
      ? `Score: ${correctScoreHome}-${correctScoreAway}`
      : betType === 'total_goals'
      ? prediction.replace('_', ' ').replace('.', '.') + ' goals'
      : betType === 'both_teams_score'
      ? `Both teams score: ${prediction.toUpperCase()}`
      : `First to score: ${prediction === 'home' ? betModal.home_team : prediction === 'away' ? betModal.away_team : 'No Goal'}`;

    setConfirmBet({
      match: `${betModal.home_team} vs ${betModal.away_team}`,
      prediction: predLabel,
      finalPrediction,
      betType,
      stake,
      odds,
      potentialPayout: Math.round(stake * odds)
    });
  };

  const confirmPlaceBet = async () => {
    // Check if odds have changed since the bet was prepared
    if (confirmBet.betType === 'match_result') {
      try {
        const { data: freshMatch } = await api.get('/matches');
        const currentMatch = freshMatch.find(m => m.id === betModal.id);
        if (currentMatch) {
          let currentOdds;
          if (confirmBet.finalPrediction === 'home') currentOdds = currentMatch.home_odds;
          else if (confirmBet.finalPrediction === 'draw') currentOdds = currentMatch.draw_odds;
          else if (confirmBet.finalPrediction === 'away') currentOdds = currentMatch.away_odds;

          if (currentOdds && currentOdds !== confirmBet.odds) {
            const accept = window.confirm(
              `⚠️ Odds have changed!\n\nOld odds: ${confirmBet.odds}\nNew odds: ${currentOdds}\n\nDo you want to continue with the new odds?`
            );
            if (!accept) {
              setConfirmBet(null);
              return;
            }
            // Update the confirm bet with new odds
            setConfirmBet(prev => ({
              ...prev,
              odds: currentOdds,
              potentialPayout: Math.round(prev.stake * currentOdds)
            }));
          }
        }
      } catch (e) { /* proceed with original odds if check fails */ }
    }

    try {
      const { data } = await api.post('/bets', {
        match_id: betModal.id,
        bet_type: confirmBet.betType,
        prediction: confirmBet.finalPrediction,
        stake
      });
      setNotification({ message: `Bet placed! ${confirmBet.match} — ${confirmBet.prediction} — ${stake} EP staked (potential payout: ${data.potential_payout} EP)`, type: 'success' });
      setMessage('');
      setBetModal(null);
      setConfirmBet(null);
      setPrediction('');
      setStake('');
      setBetType('match_result');
      setCorrectScoreHome('');
      setCorrectScoreAway('');

      // Refresh user points and matches
      const { data: userData } = await api.get('/auth/me');
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, points: userData.points }));
      fetchMatches();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place bet.');
      setConfirmBet(null);
    }
  };

  const groups = [...new Set(matches.map(m => m.group_name))].filter(Boolean).sort();
  const filteredMatches = (filter === 'all' ? matches : matches.filter(m => m.group_name === filter))
    .filter(m => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchDate = new Date(m.match_date);
      const dateStr = matchDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();
      const timeStr = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).toLowerCase();
      return (
        m.home_team.toLowerCase().includes(q) ||
        m.away_team.toLowerCase().includes(q) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        dateStr.includes(q) ||
        timeStr.includes(q)
      );
    });

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading matches...</div>;
  }

  return (
    <div>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-white">FIFA 2026 Matches</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search team, date, time..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-2 pl-9 text-white text-sm w-full md:w-64 focus:outline-none focus:border-entain-accent placeholder-gray-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 flex-nowrap pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300 hover:text-white'
            }`}
          >
            All
          </button>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === g ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300 hover:text-white'
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="bg-entain-green/10 border border-entain-green/30 text-entain-green px-4 py-2 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {filteredMatches.map(match => {
          const kickoff = new Date(match.match_date).getTime();
          const now = Date.now();
          const bettingClosed = match.status === 'upcoming' && (kickoff - now) < 60000; // 1 minute before

          return (
          <div key={match.id} className="bg-entain-navy rounded-xl border border-entain-blue/20 px-4 md:px-5 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Left: Match Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-entain-blue/50 text-gray-300 px-2 py-0.5 rounded whitespace-nowrap">
                    Group {match.group_name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
                    match.status === 'upcoming' && !bettingClosed ? 'bg-green-500/20 text-green-400' :
                    match.status === 'finished' ? 'bg-gray-500/20 text-gray-400' :
                    bettingClosed ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {bettingClosed ? 'betting closed' : match.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-white font-semibold text-sm md:text-base flex-1 md:flex-none md:w-40 text-right whitespace-nowrap overflow-hidden text-ellipsis">{match.home_team}</span>
                  <div className="text-center w-10 flex-shrink-0">
                    {match.status === 'finished' ? (
                      <span className="text-white font-bold text-base md:text-lg whitespace-nowrap">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">vs</span>
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm md:text-base flex-1 md:flex-none md:w-40 whitespace-nowrap overflow-hidden text-ellipsis">{match.away_team}</span>
                </div>

                <p className="text-gray-500 text-xs mt-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {new Date(match.match_date).toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                  {' • '}{match.venue}
                </p>
              </div>

              {/* Right: Bet Buttons */}
              {match.status === 'upcoming' && !bettingClosed && (
                <div className={`flex gap-2 flex-shrink-0 ${changedOdds[match.id] ? 'animate-odds-blink' : ''}`}>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('home'); setBetType('match_result'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Home</div>
                    <div className="text-entain-accent font-bold text-sm">{match.home_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('draw'); setBetType('match_result'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Draw</div>
                    <div className="text-entain-accent font-bold text-sm">{match.draw_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('away'); setBetType('match_result'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Away</div>
                    <div className="text-entain-accent font-bold text-sm">{match.away_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction(''); setBetType('match_result'); setCorrectScoreHome(''); setCorrectScoreAway(''); setStake(''); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">More</div>
                    <div className="text-entain-accent font-bold text-sm">+</div>
                  </button>
                </div>
              )}

              {/* Grayed out buttons when betting is closed */}
              {match.status === 'upcoming' && bettingClosed && (
                <div className="flex gap-2 flex-shrink-0 opacity-50">
                  <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px]">Home</div>
                    <div className="text-gray-500 font-bold text-sm">{match.home_odds}</div>
                  </div>
                  <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px]">Draw</div>
                    <div className="text-gray-500 font-bold text-sm">{match.draw_odds}</div>
                  </div>
                  <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px]">Away</div>
                    <div className="text-gray-500 font-bold text-sm">{match.away_odds}</div>
                  </div>
                  <div className="bg-gray-700/50 border border-gray-600/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center">
                    <div className="text-gray-500 text-[10px]">Closed</div>
                    <div className="text-gray-500 font-bold text-sm">🔒</div>
                  </div>
                </div>
              )}

              {match.status === 'finished' && (
                <div className="flex-shrink-0">
                  <span className="text-gray-500 text-xs bg-gray-500/10 px-3 py-1.5 rounded-lg">Final</span>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Bet Modal */}
      {betModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-entain-navy rounded-xl p-6 w-full max-w-md border border-entain-blue/30 max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-xl font-bold mb-2">Place Your Bet</h3>
            <p className="text-gray-300 mb-4">
              {betModal.home_team} vs {betModal.away_team}
            </p>

            {/* Bet Type Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                { key: 'match_result', label: 'Winner' },
                { key: 'correct_score', label: 'Correct Score' },
                { key: 'total_goals', label: 'Total Goals' },
                { key: 'both_teams_score', label: 'Both Score' },
                { key: 'first_to_score', label: '1st to Score' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => { setBetType(t.key); setPrediction(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    betType === t.key ? 'bg-entain-accent text-entain-dark' : 'bg-entain-dark text-gray-300 border border-entain-blue/30'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Match Result */}
            {betType === 'match_result' && (
              <div className="flex gap-2 mb-4">
                {['home', 'draw', 'away'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setPrediction(opt)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      prediction === opt
                        ? 'bg-entain-accent text-entain-dark'
                        : 'bg-entain-dark text-gray-300 border border-entain-blue/30'
                    }`}
                  >
                    <div className="text-xs opacity-70">{opt === 'home' ? 'Home' : opt === 'away' ? 'Away' : 'Draw'}</div>
                    <div className="font-bold">{opt === 'home' ? betModal.home_odds : opt === 'away' ? betModal.away_odds : betModal.draw_odds}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Correct Score */}
            {betType === 'correct_score' && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Predict the exact final score</p>
                <div className="flex items-center gap-3 justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">{betModal.home_team}</p>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={correctScoreHome}
                      onChange={(e) => setCorrectScoreHome(e.target.value)}
                      className="w-14 h-14 bg-entain-dark border border-entain-blue/30 rounded-lg text-white text-2xl text-center focus:outline-none focus:border-entain-accent"
                    />
                  </div>
                  <span className="text-gray-500 text-xl font-bold mt-5">-</span>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">{betModal.away_team}</p>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={correctScoreAway}
                      onChange={(e) => setCorrectScoreAway(e.target.value)}
                      className="w-14 h-14 bg-entain-dark border border-entain-blue/30 rounded-lg text-white text-2xl text-center focus:outline-none focus:border-entain-accent"
                    />
                  </div>
                </div>
                {correctScoreHome !== '' && correctScoreAway !== '' && (
                  <p className="text-center text-entain-accent text-sm mt-2">
                    Odds: {(() => {
                      const s = `${correctScoreHome}-${correctScoreAway}`;
                      const t = Number(correctScoreHome) + Number(correctScoreAway);
                      if (s === '0-0') return '8.0';
                      if (s === '1-0' || s === '0-1') return '6.0';
                      if (s === '1-1') return '5.5';
                      if (s === '2-1' || s === '1-2') return '7.0';
                      if (s === '2-0' || s === '0-2') return '7.5';
                      if (t <= 3) return '9.0';
                      if (t <= 5) return '15.0';
                      return '25.0';
                    })()}
                  </p>
                )}
              </div>
            )}

            {/* Total Goals */}
            {betType === 'total_goals' && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { key: 'over_1.5', label: 'Over 1.5', odds: '1.5' },
                  { key: 'under_1.5', label: 'Under 1.5', odds: '2.5' },
                  { key: 'over_2.5', label: 'Over 2.5', odds: '1.9' },
                  { key: 'under_2.5', label: 'Under 2.5', odds: '1.9' },
                  { key: 'over_3.5', label: 'Over 3.5', odds: '2.8' },
                  { key: 'under_3.5', label: 'Under 3.5', odds: '1.4' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPrediction(opt.key)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition ${
                      prediction === opt.key
                        ? 'bg-entain-accent text-entain-dark'
                        : 'bg-entain-dark text-gray-300 border border-entain-blue/30'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-xs opacity-70">@ {opt.odds}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Both Teams to Score */}
            {betType === 'both_teams_score' && (
              <div className="flex gap-3 mb-4">
                {[
                  { key: 'yes', label: 'Yes', odds: '1.8' },
                  { key: 'no', label: 'No', odds: '2.0' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPrediction(opt.key)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition ${
                      prediction === opt.key
                        ? 'bg-entain-accent text-entain-dark'
                        : 'bg-entain-dark text-gray-300 border border-entain-blue/30'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-xs opacity-70">@ {opt.odds}</div>
                  </button>
                ))}
              </div>
            )}

            {/* First to Score */}
            {betType === 'first_to_score' && (
              <div className="flex gap-2 mb-4">
                {[
                  { key: 'home', label: betModal.home_team, odds: '1.8' },
                  { key: 'away', label: betModal.away_team, odds: '2.2' },
                  { key: 'no_goal', label: 'No Goal', odds: '9.0' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPrediction(opt.key)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      prediction === opt.key
                        ? 'bg-entain-accent text-entain-dark'
                        : 'bg-entain-dark text-gray-300 border border-entain-blue/30'
                    }`}
                  >
                    <div className="text-xs truncate">{opt.label}</div>
                    <div className="font-bold">@ {opt.odds}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="stake" className="block text-gray-300 text-sm mb-1">Stake (Entain Points)</label>
              <input
                id="stake"
                type="number"
                min="1"
                value={stake}
                onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setBetModal(null); setPrediction(''); setBetType('match_result'); setCorrectScoreHome(''); setCorrectScoreAway(''); }}
                className="flex-1 bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                className="flex-1 bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition"
              >
                Place Bet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmBet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-entain-navy rounded-xl p-6 w-full max-w-sm border border-entain-blue/30">
            <h3 className="text-white text-xl font-bold mb-4 text-center">Confirm Your Bet</h3>

            <div className="bg-entain-dark rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Match</span>
                <span className="text-white font-medium">{confirmBet.match}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Pick</span>
                <span className="text-entain-accent font-medium">{confirmBet.prediction}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Stake</span>
                <span className="text-white font-medium">{confirmBet.stake} EP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Odds</span>
                <span className="text-white font-medium">{confirmBet.odds}</span>
              </div>
              <hr className="border-entain-blue/20" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Potential Payout</span>
                <span className="text-entain-gold font-bold">{confirmBet.potentialPayout} EP</span>
              </div>
            </div>

            <p className="text-gray-400 text-xs text-center mb-4">Are you sure you want to place this bet?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBet(null)}
                className="flex-1 bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlaceBet}
                className="flex-1 bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition"
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Matches;
