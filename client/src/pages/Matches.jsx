import { useState, useEffect } from 'react';
import api from '../services/api';
import Notification from '../components/Notification';

function Matches() {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('all');
  const [betModal, setBetModal] = useState(null);
  const [stake, setStake] = useState('');
  const [prediction, setPrediction] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { message, type }
  const [message, setMessage] = useState('');

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

  const handlePlaceBet = () => {
    if (!prediction || !stake || stake <= 0) return;

    // Check balance before showing confirmation
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && stake > user.points) {
      setNotification({ message: `Insufficient balance! You have ${user.points} EP but tried to stake ${stake} EP.`, type: 'error' });
      return;
    }

    const predLabel = prediction === 'home' ? betModal.home_team : prediction === 'away' ? betModal.away_team : 'Draw';
    const odds = prediction === 'home' ? betModal.home_odds : prediction === 'away' ? betModal.away_odds : betModal.draw_odds;

    // Show confirmation popup
    setConfirmBet({
      match: `${betModal.home_team} vs ${betModal.away_team}`,
      prediction: predLabel,
      stake,
      odds,
      potentialPayout: Math.round(stake * odds)
    });
  };

  const confirmPlaceBet = async () => {
    try {
      const { data } = await api.post('/bets', {
        match_id: betModal.id,
        bet_type: 'match_result',
        prediction,
        stake
      });
      const predLabel = prediction === 'home' ? betModal.home_team : prediction === 'away' ? betModal.away_team : 'Draw';
      setNotification({ message: `Bet placed! ${betModal.home_team} vs ${betModal.away_team} — ${predLabel} to win — ${stake} EP staked (potential payout: ${data.potential_payout} EP)`, type: 'success' });
      setMessage('');
      setBetModal(null);
      setConfirmBet(null);
      setPrediction('');
      setStake('');

      // Refresh user points without page reload
      const { data: userData } = await api.get('/auth/me');
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, points: userData.points }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place bet.');
      setConfirmBet(null);
    }
  };

  const groups = [...new Set(matches.map(m => m.group_name))].filter(Boolean).sort();
  const filteredMatches = filter === 'all' ? matches : matches.filter(m => m.group_name === filter);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading matches...</div>;
  }

  return (
    <div>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">FIFA 2026 Matches</h2>
        <div className="flex gap-2">
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

      <div className="grid gap-4">
        {filteredMatches.map(match => (
          <div key={match.id} className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-entain-blue/50 text-gray-300 px-2 py-0.5 rounded">
                    Group {match.group_name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    match.status === 'upcoming' ? 'bg-green-500/20 text-green-400' :
                    match.status === 'finished' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {match.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <span className="text-white font-semibold text-lg w-32 text-right">{match.home_team}</span>
                  <div className="text-center">
                    {match.status === 'finished' ? (
                      <span className="text-white font-bold text-xl">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-gray-500 font-medium">vs</span>
                    )}
                  </div>
                  <span className="text-white font-semibold text-lg w-32">{match.away_team}</span>
                </div>

                <p className="text-gray-400 text-xs mt-2">
                  {new Date(match.match_date).toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                  {' • '}{match.venue}
                </p>
              </div>

              {match.status === 'upcoming' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => { setBetModal(match); setPrediction('home'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg px-4 py-2 text-center transition"
                  >
                    <div className="text-gray-400 text-xs">Home</div>
                    <div className="text-entain-accent font-bold">{match.home_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('draw'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg px-4 py-2 text-center transition"
                  >
                    <div className="text-gray-400 text-xs">Draw</div>
                    <div className="text-entain-accent font-bold">{match.draw_odds}</div>
                  </button>
                  <button
                    onClick={() => { setBetModal(match); setPrediction('away'); }}
                    className="bg-entain-blue/50 hover:bg-entain-accent/20 border border-entain-blue/30 rounded-lg px-4 py-2 text-center transition"
                  >
                    <div className="text-gray-400 text-xs">Away</div>
                    <div className="text-entain-accent font-bold">{match.away_odds}</div>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bet Modal */}
      {betModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-entain-navy rounded-xl p-6 w-full max-w-md border border-entain-blue/30">
            <h3 className="text-white text-xl font-bold mb-4">Place Your Bet</h3>
            <p className="text-gray-300 mb-2">
              {betModal.home_team} vs {betModal.away_team}
            </p>

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
                  {opt === 'home' ? betModal.home_team : opt === 'away' ? betModal.away_team : 'Draw'}
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

            <div className="bg-entain-dark rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Odds</span>
                <span className="text-white font-medium">
                  {prediction === 'home' ? betModal.home_odds : prediction === 'away' ? betModal.away_odds : betModal.draw_odds}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-400">Potential Payout</span>
                <span className="text-entain-gold font-bold">
                  {Math.round(stake * (prediction === 'home' ? betModal.home_odds : prediction === 'away' ? betModal.away_odds : betModal.draw_odds))} EP
                </span>
              </div>
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
      )}}
    </div>
  );
}

export default Matches;
