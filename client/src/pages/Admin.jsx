import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('matches');
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState({});
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchRes, userRes] = await Promise.all([
        api.get('/matches'),
        api.get('/admin/users')
      ]);
      setMatches(matchRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  const settleMatch = async (matchId) => {
    const matchScores = scores[matchId];
    if (!matchScores || matchScores.home === undefined || matchScores.away === undefined) {
      setMessage('Please enter both scores.');
      return;
    }

    try {
      const { data } = await api.put(`/admin/matches/${matchId}/result`, {
        home_score: Number(matchScores.home),
        away_score: Number(matchScores.away)
      });
      setMessage(data.message);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to settle match.');
    }
  };

  const simulateNext = async (count) => {
    setSimulating(true);
    try {
      const { data } = await api.post('/results/simulate-next', { count });
      setMessage(`${data.message} — Results generated!`);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const simulateAll = async () => {
    if (!window.confirm('Simulate ALL remaining matches? This will settle all bets.')) return;
    setSimulating(true);
    try {
      const { data } = await api.post('/results/simulate-all');
      setMessage(`${data.message} — All matches settled!`);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const startLivePolling = async () => {
    try {
      const { data } = await api.post('/results/polling/start');
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to start polling.');
    }
  };

  const stopLivePolling = async () => {
    try {
      const { data } = await api.post('/results/polling/stop');
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to stop polling.');
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await api.get('/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FIFA2026_Entain_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage('Failed to download Excel.');
    }
  };

  const resetPoints = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reset-points`, { points: 20 });
      setMessage('Points reset to 20.');
      fetchData();
    } catch (err) {
      setMessage('Failed to reset points.');
    }
  };

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

      {message && (
        <div className="bg-entain-accent/10 border border-entain-accent/30 text-entain-accent px-4 py-2 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setTab('matches')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'matches' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          Settle Matches
        </button>
        <button
          onClick={() => setTab('simulate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'simulate' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          Simulate / Live
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'users' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={downloadExcel}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-entain-gold/20 text-entain-gold hover:bg-entain-gold/30 transition"
        >
          📥 Download Excel
        </button>
      </div>

      {/* Simulate / Live Tab */}
      {tab === 'simulate' && (
        <div className="space-y-4">
          {/* Simulation Controls */}
          <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
            <h3 className="text-white font-semibold mb-3">🎲 Simulate Results (Testing)</h3>
            <p className="text-gray-400 text-sm mb-4">Generate random realistic scores for testing. Bets will be auto-settled.</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => simulateNext(1)}
                disabled={simulating || upcomingMatches.length === 0}
                className="bg-entain-accent text-entain-dark font-bold px-4 py-2 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
              >
                {simulating ? 'Simulating...' : 'Simulate Next Match'}
              </button>
              <button
                onClick={() => simulateNext(4)}
                disabled={simulating || upcomingMatches.length === 0}
                className="bg-entain-blue text-white font-medium px-4 py-2 rounded-lg hover:bg-entain-blue/80 transition disabled:opacity-50"
              >
                Simulate Next 4
              </button>
              <button
                onClick={() => simulateNext(12)}
                disabled={simulating || upcomingMatches.length === 0}
                className="bg-entain-blue text-white font-medium px-4 py-2 rounded-lg hover:bg-entain-blue/80 transition disabled:opacity-50"
              >
                Simulate Matchday
              </button>
              <button
                onClick={simulateAll}
                disabled={simulating || upcomingMatches.length === 0}
                className="bg-entain-red/80 text-white font-medium px-4 py-2 rounded-lg hover:bg-entain-red transition disabled:opacity-50"
              >
                Simulate ALL
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">{upcomingMatches.length} matches remaining</p>
          </div>

          {/* Live Results Controls */}
          <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
            <h3 className="text-white font-semibold mb-3">📡 Live Results (Tournament Mode)</h3>
            <p className="text-gray-400 text-sm mb-4">
              Auto-fetch real match results and settle bets. Requires a football-data.org API key.
              Will work once the tournament starts on June 11, 2026.
            </p>
            <div className="flex gap-3">
              <button
                onClick={startLivePolling}
                className="bg-entain-green text-entain-dark font-bold px-4 py-2 rounded-lg hover:bg-entain-green/90 transition"
              >
                ▶ Start Live Polling
              </button>
              <button
                onClick={stopLivePolling}
                className="bg-gray-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                ⏹ Stop Polling
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">
              Set FOOTBALL_API_KEY environment variable before starting the server.
              Free key from football-data.org (10 req/min).
            </p>
          </div>

          {/* Recently Finished */}
          {finishedMatches.length > 0 && (
            <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
              <h3 className="text-white font-semibold mb-3">✅ Recently Settled ({finishedMatches.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {finishedMatches.slice(-10).reverse().map(match => (
                  <div key={match.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{match.home_team} vs {match.away_team}</span>
                    <span className="text-white font-bold">{match.home_score} - {match.away_score}</span>
                    <span className="text-gray-500 text-xs">Group {match.group_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settle Matches Manually */}
      {tab === 'matches' && (
        <div className="space-y-3">
          {upcomingMatches.length === 0 && (
            <div className="text-center text-gray-400 py-12">All matches have been settled!</div>
          )}
          {upcomingMatches.slice(0, 20).map(match => (
            <div key={match.id} className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{match.home_team} vs {match.away_team}</p>
                  <p className="text-gray-400 text-xs">Group {match.group_name} • {new Date(match.match_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="H"
                    className="w-12 bg-entain-dark border border-entain-blue/30 rounded px-2 py-1 text-white text-center text-sm"
                    value={scores[match.id]?.home ?? ''}
                    onChange={(e) => setScores({ ...scores, [match.id]: { ...scores[match.id], home: e.target.value } })}
                    aria-label={`Home score for ${match.home_team}`}
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="A"
                    className="w-12 bg-entain-dark border border-entain-blue/30 rounded px-2 py-1 text-white text-center text-sm"
                    value={scores[match.id]?.away ?? ''}
                    onChange={(e) => setScores({ ...scores, [match.id]: { ...scores[match.id], away: e.target.value } })}
                    aria-label={`Away score for ${match.away_team}`}
                  />
                  <button
                    onClick={() => settleMatch(match.id)}
                    className="bg-entain-accent text-entain-dark text-sm font-bold px-3 py-1 rounded-lg hover:bg-entain-accent/90 transition"
                  >
                    Settle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Users */}
      {tab === 'users' && (
        <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-entain-blue/20">
                <th className="text-left text-gray-400 text-sm px-6 py-3">Name</th>
                <th className="text-left text-gray-400 text-sm px-6 py-3">Email</th>
                <th className="text-right text-gray-400 text-sm px-6 py-3">Points</th>
                <th className="text-right text-gray-400 text-sm px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.role !== 'admin').map(user => (
                <tr key={user.id} className="border-b border-entain-blue/10">
                  <td className="px-6 py-3 text-white">{user.name}</td>
                  <td className="px-6 py-3 text-gray-400">{user.email}</td>
                  <td className="px-6 py-3 text-right text-entain-gold font-bold">{user.points} EP</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => resetPoints(user.id)}
                      className="text-entain-accent text-sm hover:underline"
                    >
                      Reset Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;
