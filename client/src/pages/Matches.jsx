import { useState, useEffect } from 'react';
import api from '../services/api';
import Notification from '../components/Notification';
import { getFlag } from '../utils/flags';

function Matches() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [betModal, setBetModal] = useState(null);
  const [stake, setStake] = useState('');
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { message, type }
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/matches');
      setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const [confirmBet, setConfirmBet] = useState(null); // holds bet details for confirmation
  const [userTag, setUserTag] = useState(null); // { tag, boost, emoji }
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(true); // default true to prevent flash
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingHover, setRatingHover] = useState(0);

  useEffect(() => {
    // Fetch user's tag info for odds boost display
    api.get('/auth/my-tag').then(res => setUserTag(res.data)).catch(() => {});
    // Check if user has already reviewed
    api.get('/reviews/mine').then(res => setHasReviewed(res.data.hasReviewed)).catch(() => {});
  }, []);

  const handlePlaceBet = () => {
    if (!prediction || !stake || stake <= 0) return;
    const odds = prediction === 'home' ? betModal.home_odds : prediction === 'away' ? betModal.away_odds : betModal.draw_odds;

    // Check balance
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && stake > user.points) {
      setNotification({ message: `Insufficient balance! You have ${user.points} EP but tried to stake ${stake} EP.`, type: 'error' });
      return;
    }

    const predLabel = prediction === 'home' ? betModal.home_team : prediction === 'away' ? betModal.away_team : 'Draw';

    // Calculate boosted odds
    const boost = userTag?.boost || 0;
    const boostedOdds = boost > 0 ? Math.round(odds * (1 + boost / 100) * 100) / 100 : odds;

    const betDetails = {
      match: `${betModal.home_team} vs ${betModal.away_team}`,
      prediction: predLabel,
      finalPrediction: prediction,
      betType: 'match_result',
      stake,
      originalOdds: odds,
      odds: boostedOdds,
      boost,
      potentialPayout: Math.round(stake * boostedOdds)
    };

    setConfirmBet(betDetails);
  };

  const confirmPlaceBet = async () => {
    try {
      const { data } = await api.post('/bets', {
        match_id: betModal.id,
        bet_type: confirmBet.betType,
        prediction: confirmBet.finalPrediction,
        stake
      });
      setNotification({ message: `Bet placed! Ref: ${data.bet_number} — ${confirmBet.match} — ${confirmBet.prediction} — ${stake} EP staked (potential payout: ${data.potential_payout} EP)`,
        type: 'success' });
      setMessage('');
      setBetModal(null);
      setConfirmBet(null);
      setPrediction('');
      setStake('');

      // Refresh user points and matches
      const { data: userData } = await api.get('/auth/me');
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, points: userData.points }));
      fetchMatches();

      // Show rating popup if user hasn't reviewed yet
      if (!hasReviewed) {
        setTimeout(() => setShowRatingPopup(true), 1500);
      }
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
                  <span className="text-white font-semibold text-sm md:text-base flex-1 md:flex-none md:w-40 text-right whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center justify-end gap-1.5">
                    {match.home_team}
                    {getFlag(match.home_team) && <img src={getFlag(match.home_team)} alt="" className="w-5 h-4 object-cover rounded-sm inline-block" />}
                  </span>
                  <div className="text-center w-10 flex-shrink-0">
                    {match.status === 'finished' ? (
                      <span className="text-white font-bold text-base md:text-lg whitespace-nowrap">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-gray-500 text-sm font-medium">vs</span>
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm md:text-base flex-1 md:flex-none md:w-40 whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center gap-1.5">
                    {match.away_team}
                    {getFlag(match.away_team) && <img src={getFlag(match.away_team)} alt="" className="w-5 h-4 object-cover rounded-sm inline-block" />}
                  </span>
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
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setBetModal(match); setPrediction('home'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Home</div>
                    <div className="text-entain-accent font-bold text-sm">{match.home_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('draw'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Draw</div>
                    <div className="text-entain-accent font-bold text-sm">{match.draw_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('away'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg flex-1 md:flex-none md:w-[60px] py-2 flex flex-col items-center justify-center transition"
                  >
                    <div className="text-gray-400 text-[10px]">Away</div>
                    <div className="text-entain-accent font-bold text-sm">{match.away_odds}</div>
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

            {/* Match Result */}
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
                onClick={() => { setBetModal(null); setPrediction(''); }}
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
                <span className="text-gray-400">Original Odds</span>
                <span className={`font-medium ${confirmBet.boost > 0 ? 'text-gray-500 line-through' : 'text-white'}`}>{confirmBet.originalOdds}</span>
              </div>
              {confirmBet.boost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Odds <span className="text-green-400 text-xs">({userTag?.emoji} +{confirmBet.boost}%)</span></span>
                  <span className="text-green-400 font-bold">{confirmBet.odds}</span>
                </div>
              )}
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

      {/* Rating Popup */}
      {showRatingPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] px-4">
          <div className="bg-entain-navy rounded-xl p-6 w-full max-w-sm border border-entain-blue/30 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <h3 className="text-white text-xl font-bold mb-2">Enjoying the App?</h3>
            <p className="text-gray-400 text-sm mb-4">Rate your experience with FIFA 2026 Predictions</p>

            {/* Stars */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= (ratingHover || ratingValue) ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Any feedback? (optional)"
              maxLength={200}
              className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-entain-accent placeholder-gray-500 resize-none h-20 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingPopup(false)}
                className="flex-1 bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition"
              >
                Maybe Later
              </button>
              <button
                onClick={async () => {
                  if (ratingValue === 0) return;
                  try {
                    await api.post('/reviews', { rating: ratingValue, comment: ratingComment });
                    setHasReviewed(true);
                    setShowRatingPopup(false);
                    setNotification({ message: 'Thanks for your feedback! ⭐', type: 'success' });
                  } catch (err) {
                    setShowRatingPopup(false);
                  }
                }}
                disabled={ratingValue === 0}
                className="flex-1 bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Matches;
