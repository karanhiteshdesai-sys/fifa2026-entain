import { useState, useEffect } from 'react';
import api from '../services/api';

function Admin() {
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [allBets, setAllBets] = useState([]);
  const [tab, setTab] = useState('matches');
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState({});
  const [simulating, setSimulating] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [betSearch, setBetSearch] = useState('');
  const [betStatusFilter, setBetStatusFilter] = useState('all');
  const [selectedAdminBet, setSelectedAdminBet] = useState(null);
  const [dmUser, setDmUser] = useState(null); // user object for DM modal
  const [dmText, setDmText] = useState('');
  const [dmConversation, setDmConversation] = useState([]);
  const [dmSending, setDmSending] = useState(false);

  useEffect(() => {
    fetchData();
    // Auto-refresh admin data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [matchRes, userRes, betsRes] = await Promise.all([
        api.get('/matches'),
        api.get('/admin/users'),
        api.get('/admin/bets')
      ]);
      setMatches(matchRes.data);
      setUsers(userRes.data);
      setAllBets(betsRes.data);
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

  const openDM = async (user) => {
    setDmUser(user);
    setDmText('');
    try {
      const { data } = await api.get(`/dm/conversation/${user.id}`);
      setDmConversation(data);
    } catch (err) {
      setDmConversation([]);
    }
  };

  const sendDM = async () => {
    if (!dmText.trim() || !dmUser || dmSending) return;
    setDmSending(true);
    try {
      await api.post('/dm/send', { to_user_id: dmUser.id, message: dmText.trim() });
      setDmText('');
      setMessage(`Message sent to ${dmUser.name}.`);
      // Refresh conversation
      const { data } = await api.get(`/dm/conversation/${dmUser.id}`);
      setDmConversation(data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setDmSending(false);
    }
  };

  const resetPoints = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reset-points`, { points: 100 });
      setMessage('Points reset to 100.');
      fetchData();
    } catch (err) {
      setMessage('Failed to reset points.');
    }
  };

  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchesStatus = userStatusFilter === 'all' || (u.status || 'approved') === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBets = allBets.filter(b => {
    const q = betSearch.toLowerCase();
    const matchesSearch = !q || (b.bet_number && b.bet_number.toLowerCase().includes(q)) || b.user_name.toLowerCase().includes(q) || b.user_email.toLowerCase().includes(q) || b.home_team.toLowerCase().includes(q) || b.away_team.toLowerCase().includes(q);
    const matchesStatus = betStatusFilter === 'all' || b.status === betStatusFilter;
    return matchesSearch && matchesStatus;
  });

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
          onClick={() => setTab('bets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'bets' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          All Bets
        </button>
        <button
          onClick={() => setTab('broadcast')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'broadcast' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          📢 Broadcast
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'activity' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          📊 Activity
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
              <button
                onClick={async () => {
                  if (!window.confirm('Unsettle ALL matches and reset all bets & points? This is for testing only.')) return;
                  try {
                    const { data } = await api.post('/admin/unsettle-all');
                    setMessage(data.message);
                    fetchData();
                  } catch (err) {
                    setMessage(err.response?.data?.error || 'Failed to unsettle.');
                  }
                }}
                disabled={simulating || finishedMatches.length === 0}
                className="bg-yellow-500/80 text-entain-dark font-medium px-4 py-2 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
              >
                ↩️ Unsettle All
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('⚠️ FULL RESET: Delete ALL bets, reset ALL users to 100 EP, clear all messages & notifications. Are you sure?')) return;
                  if (!window.confirm('This cannot be undone. Type YES to confirm.')) return;
                  try {
                    const { data } = await api.post('/admin/full-reset');
                    setMessage(data.message);
                    fetchData();
                  } catch (err) {
                    setMessage(err.response?.data?.error || 'Failed to reset.');
                  }
                }}
                className="bg-red-500/80 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-500 transition"
              >
                🗑️ Full Reset
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-3">{upcomingMatches.length} matches remaining</p>
          </div>

          {/* Knockout Generation */}
          <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
            <h3 className="text-white font-semibold mb-3">🏆 Knockout Stage</h3>
            <p className="text-gray-400 text-sm mb-4">After all group matches are settled, generate the Round of 32 bracket automatically based on standings.</p>
            <button
              onClick={async () => {
                try {
                  const { data } = await api.post('/admin/generate-knockout');
                  setMessage(data.message);
                  fetchData();
                } catch (err) {
                  setMessage(err.response?.data?.error || 'Failed to generate knockout.');
                }
              }}
              className="bg-entain-gold text-entain-dark font-bold px-4 py-2 rounded-lg hover:bg-entain-gold/90 transition"
            >
              🏆 Generate Knockout Bracket
            </button>
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
        <div className="space-y-6">
          {/* Admin Self EP */}
          <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Your Admin Account</p>
              <p className="text-gray-400 text-sm">Add EP to your own account</p>
            </div>
            <button
              onClick={() => {
                const amount = window.prompt('Add EP to your account.\nEnter amount:');
                if (amount && Number(amount) > 0) {
                  const adminUser = JSON.parse(localStorage.getItem('user'));
                  api.post(`/admin/users/${adminUser.id}/add-points`, { amount: Number(amount) })
                    .then((res) => { setMessage(res.data.message); fetchData(); })
                    .catch(() => setMessage('Failed to add points.'));
                }
              }}
              className="bg-entain-gold/20 text-entain-gold font-bold px-4 py-2 rounded-lg hover:bg-entain-gold/30 transition text-sm"
            >
              + Add EP to Self
            </button>
          </div>

          {/* Pending Approvals */}
          <PendingApprovals onAction={fetchData} setMessage={setMessage} />

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-2 pl-9 text-white text-sm focus:outline-none focus:border-entain-accent placeholder-gray-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-entain-accent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* All Users */}
          <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden overflow-x-auto">
            <div className="px-6 py-3 border-b border-entain-blue/20">
              <h3 className="text-white font-semibold">All Registered Users ({filteredUsers.length})</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-entain-blue/20">
                  <th className="text-left text-gray-400 text-sm px-6 py-3">Name</th>
                  <th className="text-left text-gray-400 text-sm px-6 py-3">Email</th>
                  <th className="text-center text-gray-400 text-sm px-4 py-3">Status</th>
                  <th className="text-center text-gray-400 text-sm px-4 py-3">Referrals</th>
                  <th className="text-right text-gray-400 text-sm px-6 py-3">Points</th>
                  <th className="text-right text-gray-400 text-sm px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-entain-blue/10">
                    <td className="px-6 py-3 text-white">{user.name}</td>
                    <td className="px-6 py-3 text-gray-400 text-sm">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        user.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{user.status || 'approved'}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-white font-medium">{user.referral_count || 0}</td>
                    <td className="px-6 py-3 text-right text-entain-gold font-bold">{user.points} EP</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openDM(user)}
                        className="text-blue-400 text-sm hover:underline mr-3"
                      >
                        ✉️ Message
                      </button>
                      <button
                        onClick={() => {
                          const amount = window.prompt(`Add EP to ${user.name}.\nEnter amount:`);
                          if (amount && Number(amount) > 0) {
                            api.post(`/admin/users/${user.id}/add-points`, { amount: Number(amount) })
                              .then((res) => { setMessage(res.data.message); fetchData(); })
                              .catch(() => setMessage('Failed to add points.'));
                          }
                        }}
                        className="text-entain-gold text-sm hover:underline mr-3"
                      >
                        + Add EP
                      </button>
                      <button
                        onClick={() => resetPoints(user.id)}
                        className="text-entain-accent text-sm hover:underline mr-3"
                      >
                        Reset Points
                      </button>
                      <button
                        onClick={() => {
                          const newPass = window.prompt(`Reset password for ${user.name}.\nEnter new password (min 6 chars):`);
                          if (newPass && newPass.length >= 6) {
                            api.post(`/admin/users/${user.id}/reset-password`, { newPassword: newPass })
                              .then(() => setMessage(`Password reset for ${user.name}.`))
                              .catch(() => setMessage('Failed to reset password.'));
                          }
                        }}
                        className="text-yellow-400 text-sm hover:underline"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) {
                            api.delete(`/admin/users/${user.id}`)
                              .then(() => { setMessage(`${user.name} deleted.`); fetchData(); })
                              .catch(() => setMessage('Failed to delete user.'));
                          }
                        }}
                        className="text-red-400 text-sm hover:underline ml-3"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          const action = user.status === 'blocked' ? 'unblock' : 'block';
                          if (window.confirm(`${action === 'block' ? 'Block' : 'Unblock'} ${user.name}?`)) {
                            api.post(`/admin/users/${user.id}/${action}`)
                              .then(() => { setMessage(`${user.name} ${action}ed.`); fetchData(); })
                              .catch(() => setMessage(`Failed to ${action} user.`));
                          }
                        }}
                        className={`${user.status === 'blocked' ? 'text-green-400' : 'text-orange-400'} text-sm hover:underline ml-3`}
                      >
                        {user.status === 'blocked' ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Employee Bets */}
      {tab === 'bets' && (
        <div>
          <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20 mb-4">
            <p className="text-gray-300 text-sm">Total bets placed: <span className="text-white font-bold">{allBets.length}</span>{filteredBets.length !== allBets.length && <span className="text-gray-500"> (showing {filteredBets.length})</span>}</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by bet number, employee, team..."
                value={betSearch}
                onChange={(e) => setBetSearch(e.target.value)}
                className="w-full bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-2 pl-9 text-white text-sm focus:outline-none focus:border-entain-accent placeholder-gray-500"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={betStatusFilter}
              onChange={(e) => setBetStatusFilter(e.target.value)}
              className="bg-entain-navy border border-entain-blue/30 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-entain-accent"
            >
              <option value="all">All Status</option>
              <option value="conditional">Conditional Bet</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-entain-blue/20 text-xs">
                  <th className="text-left text-gray-400 px-4 py-3">Bet #</th>
                  <th className="text-left text-gray-400 px-4 py-3">Employee</th>
                  <th className="text-left text-gray-400 px-4 py-3">Match</th>
                  <th className="text-center text-gray-400 px-4 py-3">Pick</th>
                  <th className="text-right text-gray-400 px-4 py-3">Stake</th>
                  <th className="text-right text-gray-400 px-4 py-3">Odds</th>
                  <th className="text-center text-gray-400 px-4 py-3">Status</th>
                  <th className="text-right text-gray-400 px-4 py-3">Payout</th>
                  <th className="text-left text-gray-400 px-4 py-3">Placed</th>
                  <th className="text-right text-gray-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBets.map(bet => (
                  <tr key={bet.id} className="border-b border-entain-blue/10 text-sm">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedAdminBet(bet)} className="text-entain-accent font-mono text-xs bg-entain-accent/10 px-1.5 py-0.5 rounded hover:bg-entain-accent/20 transition cursor-pointer">{bet.bet_number || '—'}</button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{bet.user_name}</p>
                      <p className="text-gray-500 text-xs">{bet.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {bet.home_team} vs {bet.away_team}
                      <span className="text-gray-500 text-xs ml-1">({bet.group_name})</span>
                    </td>
                    <td className="px-4 py-3 text-center text-entain-accent capitalize">{bet.prediction}</td>
                    <td className="px-4 py-3 text-right text-white">{bet.stake} EP</td>
                    <td className="px-4 py-3 text-right text-gray-300">{bet.odds}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        bet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                        bet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                        bet.status === 'voided' ? 'bg-gray-500/20 text-gray-400' :
                        bet.status === 'conditional' ? 'bg-yellow-500/20 text-yellow-400' :
                        bet.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        bet.status === 'pending' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {bet.status === 'pending' ? 'Bet Placed' : bet.status === 'conditional' ? '⏳ Conditional' : bet.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bet.status === 'won' ? (
                        <span className="text-entain-gold font-bold">+{bet.payout} EP</span>
                      ) : bet.status === 'pending' ? (
                        <span className="text-gray-500">{Math.round(bet.stake * bet.odds)} EP</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left text-gray-400 text-xs whitespace-nowrap">
                      {new Date(bet.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bet.status === 'conditional' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              api.post(`/admin/bets/${bet.id}/approve`)
                                .then(() => { setMessage(`Bet ${bet.bet_number} approved.`); fetchData(); })
                                .catch(() => setMessage('Failed to approve bet.'));
                            }}
                            className="text-green-400 text-xs hover:underline font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              api.post(`/admin/bets/${bet.id}/reject`)
                                .then(() => { setMessage(`Bet ${bet.bet_number} rejected. ${bet.stake} EP refunded.`); fetchData(); })
                                .catch(() => setMessage('Failed to reject bet.'));
                            }}
                            className="text-red-400 text-xs hover:underline font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {bet.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              if (window.confirm(`Void bet by ${bet.user_name}? Their ${bet.stake} EP will be refunded.`)) {
                                api.post(`/admin/bets/${bet.id}/void`)
                                  .then(() => { setMessage(`Bet voided. ${bet.stake} EP refunded to ${bet.user_name}.`); fetchData(); })
                                  .catch(() => setMessage('Failed to void bet.'));
                              }
                            }}
                            className="text-yellow-400 text-xs hover:underline"
                          >
                            Void
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete bet by ${bet.user_name}? Their ${bet.stake} EP will NOT be refunded.`)) {
                                api.delete(`/admin/bets/${bet.id}`)
                                  .then(() => { setMessage(`Bet deleted.`); fetchData(); })
                                  .catch(() => setMessage('Failed to delete bet.'));
                              }
                            }}
                            className="text-red-400 text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBets.length === 0 && (
              <div className="text-center text-gray-400 py-8">{allBets.length === 0 ? 'No bets placed yet.' : 'No bets match your search.'}</div>
            )}
          </div>

          {/* Bet Detail Modal */}
          {selectedAdminBet && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setSelectedAdminBet(null)}>
              <div className="bg-entain-navy rounded-xl p-6 w-full max-w-sm border border-entain-blue/30" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-bold">Bet Details</h3>
                  <span className="text-entain-accent font-mono text-sm bg-entain-accent/10 px-2 py-1 rounded">{selectedAdminBet.bet_number}</span>
                </div>
                <div className="bg-entain-dark rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Employee</span>
                    <span className="text-white font-medium">{selectedAdminBet.user_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Email</span>
                    <span className="text-gray-300 text-xs">{selectedAdminBet.user_email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Match</span>
                    <span className="text-white font-medium">{selectedAdminBet.home_team} vs {selectedAdminBet.away_team}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Group</span>
                    <span className="text-gray-300">{selectedAdminBet.group_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prediction</span>
                    <span className="text-entain-accent font-medium capitalize">{selectedAdminBet.prediction}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stake</span>
                    <span className="text-white font-medium">{selectedAdminBet.stake} EP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Odds</span>
                    <span className="text-white font-medium">{selectedAdminBet.odds}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potential Payout</span>
                    <span className="text-entain-gold font-medium">{Math.round(selectedAdminBet.stake * selectedAdminBet.odds)} EP</span>
                  </div>
                  <hr className="border-entain-blue/20" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      selectedAdminBet.status === 'won' ? 'bg-green-500/20 text-green-400' :
                      selectedAdminBet.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{selectedAdminBet.status === 'pending' ? 'Bet Placed' : selectedAdminBet.status}</span>
                  </div>
                  {selectedAdminBet.status === 'won' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Payout</span>
                      <span className="text-entain-green font-bold">+{selectedAdminBet.payout} EP</span>
                    </div>
                  )}
                  <hr className="border-entain-blue/20" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Placed</span>
                    <span className="text-gray-300 text-xs">{new Date(selectedAdminBet.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Match Date</span>
                    <span className="text-gray-300 text-xs">{new Date(selectedAdminBet.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedAdminBet(null)} className="w-full mt-4 bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition">Close</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {tab === 'broadcast' && (
        <BroadcastPanel setMessage={setMessage} userCount={users.length} />
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <ActivityPanel />
      )}

      {/* DM Modal */}
      {dmUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] px-4">
          <div className="bg-entain-navy rounded-xl w-full max-w-lg border border-entain-blue/30 shadow-2xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-entain-blue/20">
              <div>
                <h3 className="text-white font-semibold">✉️ Message {dmUser.name}</h3>
                <p className="text-gray-400 text-xs">{dmUser.email}</p>
              </div>
              <button
                onClick={() => setDmUser(null)}
                className="text-gray-400 hover:text-white text-xl transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {dmConversation.length === 0 && (
                <p className="text-gray-500 text-center text-sm py-8">No messages yet. Start the conversation!</p>
              )}
              {dmConversation.map((msg) => {
                const isAdmin = msg.from_role === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%]`}>
                      <div className={`px-3 py-2 rounded-lg text-sm ${
                        isAdmin
                          ? 'bg-entain-accent text-entain-dark rounded-br-none'
                          : 'bg-entain-dark text-gray-200 border border-entain-blue/20 rounded-bl-none'
                      }`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-entain-dark/60' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-entain-blue/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendDM(); }}
                  placeholder={`Message ${dmUser.name}...`}
                  maxLength={1000}
                  className="flex-1 bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-entain-accent placeholder-gray-500"
                  disabled={dmSending}
                />
                <button
                  onClick={sendDM}
                  disabled={dmSending || !dmText.trim()}
                  className="bg-entain-accent text-entain-dark font-bold px-4 py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50 text-sm"
                >
                  {dmSending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BroadcastPanel({ setMessage, userCount }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage('Please enter both a title and message.');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/admin/broadcast', { title: title.trim(), message: body.trim() });
      setMessage(data.message);
      setTitle('');
      setBody('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-entain-navy rounded-xl p-6 border border-entain-blue/20">
        <h3 className="text-white font-semibold mb-1">📢 Broadcast to All Employees</h3>
        <p className="text-gray-400 text-sm mb-5">Send a notification to all {userCount} registered employees at once.</p>

        <div className="mb-4">
          <label htmlFor="broadcast-title" className="block text-gray-300 text-sm mb-1">Title</label>
          <input
            id="broadcast-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 🎉 Bonus Round! Double EP this weekend"
            className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent placeholder-gray-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="broadcast-body" className="block text-gray-300 text-sm mb-1">Message</label>
          <textarea
            id="broadcast-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={4}
            className="w-full bg-entain-dark border border-entain-blue/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-entain-accent placeholder-gray-500 resize-none"
          />
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="bg-entain-dark rounded-lg p-4 mb-4 border border-entain-blue/10">
            <p className="text-gray-500 text-xs mb-2">Preview:</p>
            <p className="text-white font-medium text-sm">{title || 'Untitled'}</p>
            <p className="text-gray-300 text-sm mt-1">{body || 'No message'}</p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="bg-entain-accent text-entain-dark font-bold px-6 py-2.5 rounded-lg hover:bg-entain-accent/90 transition disabled:opacity-50"
        >
          {sending ? 'Sending...' : `Send to All ${userCount} Employees`}
        </button>
      </div>
    </div>
  );
}

function PendingApprovals({ onAction, setMessage }) {
  const [pending, setPending] = useState([]);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoApproved, setAutoApproved] = useState(0);

  useEffect(() => {
    fetchAndAutoApprove();
    // Auto-check and approve new registrations every 120 seconds
    const interval = setInterval(() => {
      fetchAndAutoApprove();
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchAndAutoApprove = async () => {
    try {
      const { data } = await api.get('/admin/pending-users');
      setLastChecked(new Date());

      if (data.length > 0) {
        // Auto-approve all pending users
        let approvedCount = 0;
        for (const user of data) {
          try {
            await api.post(`/admin/users/${user.id}/approve`);
            approvedCount++;
          } catch (err) {
            console.error(`Failed to auto-approve ${user.name}:`, err);
          }
        }
        if (approvedCount > 0) {
          setAutoApproved(prev => prev + approvedCount);
          setMessage(`✅ Auto-approved ${approvedCount} new registration${approvedCount > 1 ? 's' : ''}!`);
          onAction();
        }
        // Refresh pending list (should be empty now)
        const { data: remaining } = await api.get('/admin/pending-users');
        setPending(remaining);
      } else {
        setPending([]);
      }
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
    }
  };

  const approve = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setMessage('User approved!');
      fetchPending();
      onAction();
    } catch (err) {
      setMessage('Failed to approve user.');
    }
  };

  const reject = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reject`);
      setMessage('User rejected.');
      fetchPending();
      onAction();
    } catch (err) {
      setMessage('Failed to reject user.');
    }
  };

  const approveAll = async () => {
    try {
      for (const user of pending) {
        await api.post(`/admin/users/${user.id}/approve`);
      }
      setMessage(`All ${pending.length} users approved!`);
      fetchPending();
      onAction();
    } catch (err) {
      setMessage('Failed to approve all users.');
    }
  };

  if (pending.length === 0) {
    return (
      <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-entain-green animate-pulse" />
            Auto-approve active — checking every 2 minutes
          </p>
          {autoApproved > 0 && (
            <p className="text-entain-green text-xs mt-1">✅ {autoApproved} user{autoApproved > 1 ? 's' : ''} auto-approved this session</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-gray-500 text-xs">Last checked: {lastChecked.toLocaleTimeString()}</span>
          )}
          <button
            onClick={() => fetchAndAutoApprove()}
            className="text-entain-accent text-xs hover:underline"
          >
            🔄 Check now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden overflow-x-auto">
      <div className="px-6 py-3 border-b border-entain-blue/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold">⏳ Pending Approvals</h3>
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded">{pending.length} pending</span>
          <span className="text-gray-500 text-xs">(auto-approve failed for these — approve manually)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAndAutoApprove()}
            className="text-entain-accent text-xs hover:underline"
          >
            🔄 Retry
          </button>
          <button
            onClick={approveAll}
            className="bg-entain-green text-entain-dark text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-entain-green/90 transition"
          >
            ✓ Approve All
          </button>
        </div>
      </div>
      <div className="divide-y divide-entain-blue/10">
        {pending.map(user => (
          <div key={user.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <p className="text-gray-400 text-sm">{user.email}</p>
              <p className="text-gray-500 text-xs">Registered: {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => approve(user.id)}
                className="bg-entain-green text-entain-dark text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-entain-green/90 transition"
              >
                Approve
              </button>
              <button
                onClick={() => reject(user.id)}
                className="bg-entain-red/80 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-entain-red transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPanel() {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    try {
      const { data } = await api.get('/activity/stats');
      setActivity(data);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400 text-center py-12">Loading activity data...</div>;
  }

  if (!activity) {
    return <div className="text-gray-400 text-center py-12">Failed to load activity data. Make sure the server is updated and redeployed.</div>;
  }

  const online = activity.online || { count: 0, users: [], pageBreakdown: {} };
  const stats = activity.stats || { totalUsers: 0, approvedUsers: 0, totalBets: 0, pendingBets: 0, betsToday: 0, activeBettorsToday: 0, totalBettingUsers: 0 };
  const charts = activity.charts || { betsPerDay: [], betOutcomes: [], betPredictions: [], topBettors: [], registrationsPerDay: [] };
  const recentBets = activity.recentBets || [];

  const pageLabels = {
    home: '🏠 Home',
    matches: '⚽ Matches',
    standings: '📊 Standings',
    leaderboard: '🏆 Leaderboard',
    'my-bets': '🎫 My Bets',
    chat: '💬 Chat',
    messages: '✉️ Messages',
    admin: '⚙️ Admin',
    info: 'ℹ️ Info',
    'change-password': '🔑 Settings',
    'my-tag': '🏷️ My Tag',
    team: '👥 Team',
    unknown: '❓ Unknown'
  };

  const COLORS = ['#00e5a0', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

  const predictionColors = { home: '#00e5a0', draw: '#f59e0b', away: '#3b82f6' };

  return (
    <div className="space-y-4">
      {/* Live Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value={online.count} label="Online Now" color="text-entain-green" icon="🟢" />
        <StatCard value={stats.approvedUsers} label="Registered Users" color="text-entain-accent" icon="👥" />
        <StatCard value={stats.totalBets} label="Total Bets" color="text-entain-gold" icon="🎫" />
        <StatCard value={stats.totalBettingUsers} label="Users Who Bet" color="text-blue-400" icon="🎯" />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.betsToday} label="Bets Today (24h)" color="text-white" small />
        <StatCard value={stats.activeBettorsToday} label="Active Bettors Today" color="text-white" small />
        <StatCard value={stats.pendingBets} label="Pending Bets" color="text-yellow-400" small />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bets Per Day - Bar Chart */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">📈 Bets Per Day (Last 7 Days)</h3>
          {charts.betsPerDay.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-2">
              {charts.betsPerDay.map((day, i) => {
                const maxCount = Math.max(...charts.betsPerDay.map(d => d.count));
                const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-16 shrink-0">
                      {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex-1 bg-entain-dark rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-entain-accent to-entain-green transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white font-bold text-sm w-8 text-right">{day.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bet Predictions - Donut */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">🎯 Bet Predictions Breakdown</h3>
          {charts.betPredictions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div>
              <div className="flex justify-center mb-4">
                <DonutChart data={charts.betPredictions} colors={predictionColors} />
              </div>
              <div className="flex justify-center gap-4">
                {charts.betPredictions.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: predictionColors[item.name] || COLORS[i % COLORS.length] }} />
                    <span className="text-gray-300 text-xs capitalize">{item.name}</span>
                    <span className="text-white text-xs font-bold">({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bet Outcomes & Top Bettors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bet Outcomes */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">📊 Bet Outcomes</h3>
          {charts.betOutcomes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {charts.betOutcomes.map((outcome, i) => {
                const total = charts.betOutcomes.reduce((sum, o) => sum + o.value, 0);
                const pct = total > 0 ? Math.round((outcome.value / total) * 100) : 0;
                const colorMap = { won: '#00e5a0', lost: '#ef4444', pending: '#f59e0b', voided: '#6b7280' };
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">{outcome.name}</span>
                      <span className="text-white font-bold">{outcome.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-entain-dark rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: colorMap[outcome.name] || COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Bettors */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">🏅 Top Bettors</h3>
          {charts.topBettors.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-2">
              {charts.topBettors.map((bettor, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-entain-dark/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-entain-gold font-bold w-5">#{i + 1}</span>
                    <span className="text-white">{bettor.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">{bettor.bets} bets</span>
                    <span className="text-entain-accent">{bettor.staked} EP staked</span>
                    <span className="text-entain-green">{bettor.wins}W</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Users & Page Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Page Breakdown - Visual */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">📍 Where Users Are</h3>
          {Object.keys(online.pageBreakdown).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No active users right now.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(online.pageBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([page, count], i) => {
                  const total = online.count;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={page} className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm w-28 shrink-0">{pageLabels[page] || page}</span>
                      <div className="flex-1 bg-entain-dark rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <span className="text-white font-bold text-sm w-6 text-right">{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Online Users List */}
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <h3 className="text-white font-semibold mb-3">🟢 Online Users ({online.count})</h3>
          {online.users.length === 0 ? (
            <p className="text-gray-500 text-sm">No users online.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {online.users.map(u => (
                <div key={u.id} className="flex items-center justify-between text-sm bg-entain-dark/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-entain-green animate-pulse" />
                    <span className="text-white">{u.name}</span>
                    {u.role === 'admin' && <span className="text-yellow-400 text-[10px]">ADMIN</span>}
                  </div>
                  <span className="text-gray-500 text-xs">{pageLabels[u.currentPage] || u.currentPage}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bets Feed */}
      <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
        <h3 className="text-white font-semibold mb-3">🎫 Recent Bets (Live Feed)</h3>
        {recentBets.length === 0 ? (
          <p className="text-gray-500 text-sm">No bets placed yet.</p>
        ) : (
          <div className="space-y-2">
            {recentBets.map(bet => (
              <div key={bet.id} className="flex items-center justify-between text-sm border-b border-entain-blue/10 pb-2">
                <div>
                  <span className="text-entain-accent font-medium">{bet.user_name}</span>
                  <span className="text-gray-400 ml-2">
                    bet <span className="text-entain-gold font-bold">{bet.stake} EP</span> on <span className="text-white font-medium capitalize">{bet.prediction}</span> in {bet.home_team} vs {bet.away_team}
                  </span>
                </div>
                <span className="text-gray-500 text-xs whitespace-nowrap ml-2">
                  {new Date(bet.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-gray-600 text-xs text-center">Auto-refreshes every 10 seconds • Data resets on server restart</p>
    </div>
  );
}

function StatCard({ value, label, color, icon, small }) {
  return (
    <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20 text-center">
      {icon && !small && <span className="text-lg">{icon}</span>}
      <p className={`${small ? 'text-2xl' : 'text-3xl'} font-bold ${color}`}>{value}</p>
      <p className="text-gray-400 text-xs mt-1">{label}</p>
    </div>
  );
}

function DonutChart({ data, colors }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item, i) => {
    const pct = item.value / total;
    const dashLength = pct * circumference;
    const segment = {
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset,
      color: colors[item.name] || ['#00e5a0', '#f59e0b', '#3b82f6', '#ef4444'][i % 4]
    };
    offset += dashLength;
    return segment;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-white text-lg font-bold">
        {total}
      </text>
    </svg>
  );
}

export default Admin;
