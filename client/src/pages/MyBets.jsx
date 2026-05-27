import { useState, useEffect } from 'react';
import api from '../services/api';

function MyBets() {
  const [bets, setBets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bets');
  const [selectedBet, setSelectedBet] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [betsRes, notifRes] = await Promise.all([
          api.get('/bets'),
          api.get('/notifications')
        ]);
        setBets(betsRes.data);
        setNotifications(notifRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading...</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">Bet Placed</span>;
      case 'conditional':
        return <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs">⏳ Awaiting Approval</span>;
      case 'won':
        return <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">Won ✓</span>;
      case 'lost':
        return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Lost ✗</span>;
      case 'rejected':
        return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Rejected</span>;
      default:
        return null;
    }
  };

  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    won: bets.filter(b => b.status === 'won').length,
    lost: bets.filter(b => b.status === 'lost').length,
    totalStaked: bets.reduce((sum, b) => sum + b.stake, 0),
    totalWon: bets.filter(b => b.status === 'won').reduce((sum, b) => sum + b.payout, 0),
  };

  // Build transactions from bets + notifications
  const transactions = [];

  // Bets placed (EP spent)
  bets.forEach(bet => {
    transactions.push({
      id: `bet-${bet.id}`,
      type: 'debit',
      amount: bet.stake,
      description: `Bet on ${bet.home_team} vs ${bet.away_team} — ${bet.prediction}`,
      date: bet.created_at
    });
    if (bet.status === 'won') {
      transactions.push({
        id: `win-${bet.id}`,
        type: 'credit',
        amount: bet.payout,
        description: `Won: ${bet.home_team} vs ${bet.away_team}`,
        date: bet.created_at
      });
    }
  });

  // Referral notifications (no longer gives EP, just tracking)
  notifications.forEach(n => {
    if (n.title && n.title.includes('New Referral')) {
      transactions.push({
        id: `ref-${n.id}`,
        type: 'info',
        amount: 0,
        description: n.message,
        date: n.created_at
      });
    }
    if (n.title && n.title.includes('Points Added')) {
      const match = n.message.match(/added (\d+) EP/);
      if (match) {
        transactions.push({
          id: `admin-${n.id}`,
          type: 'credit',
          amount: Number(match[1]),
          description: 'Admin bonus',
          date: n.created_at
        });
      }
    }
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">My Bets</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
          <p className="text-gray-400 text-xs">Total Bets</p>
          <p className="text-white text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
          <p className="text-gray-400 text-xs">Won / Lost</p>
          <p className="text-white text-2xl font-bold">
            <span className="text-entain-green">{stats.won}</span>
            {' / '}
            <span className="text-entain-red">{stats.lost}</span>
          </p>
        </div>
        <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
          <p className="text-gray-400 text-xs">Total Staked</p>
          <p className="text-entain-accent text-2xl font-bold">{stats.totalStaked} EP</p>
        </div>
        <div className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
          <p className="text-gray-400 text-xs">Total Won</p>
          <p className="text-entain-gold text-2xl font-bold">{stats.totalWon} EP</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('bets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'bets' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          My Bets
        </button>
        <button
          onClick={() => setTab('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'transactions' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300'
          }`}
        >
          💰 Transactions
        </button>
      </div>

      {/* Bets Tab */}
      {tab === 'bets' && (
        <div className="space-y-3">
          {bets.map(bet => (
            <div key={bet.id} className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setSelectedBet(bet)} className="text-entain-accent text-xs font-mono bg-entain-accent/10 px-2 py-0.5 rounded hover:bg-entain-accent/20 transition cursor-pointer">{bet.bet_number || '—'}</button>
                  </div>
                  <p className="text-white font-medium">
                    {bet.home_team} vs {bet.away_team}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Prediction: <span className="text-entain-accent capitalize">{bet.prediction}</span>
                    {' • '}Odds: {bet.odds}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Placed: {new Date(bet.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(bet.status)}
                  <p className="text-white font-bold mt-2">{bet.stake} EP</p>
                  {bet.status === 'won' && (
                    <p className="text-entain-gold text-sm font-medium">+{bet.payout} EP</p>
                  )}
                  {bet.status === 'pending' && (
                    <p className="text-gray-400 text-xs">Potential: {Math.round(bet.stake * bet.odds)} EP</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {bets.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              No bets placed yet. Head to Matches to place your first bet!
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="text-center text-gray-400 py-12">No transactions yet.</div>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="bg-entain-navy rounded-xl px-4 py-3 border border-entain-blue/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.type === 'credit' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="text-white text-sm">{tx.description}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(tx.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <span className={`font-bold text-sm ${tx.type === 'credit' ? 'text-entain-green' : 'text-red-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}{tx.amount} EP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bet Detail Modal */}
      {selectedBet && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setSelectedBet(null)}>
          <div className="bg-entain-navy rounded-xl p-6 w-full max-w-sm border border-entain-blue/30" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Bet Details</h3>
              <span className="text-entain-accent font-mono text-sm bg-entain-accent/10 px-2 py-1 rounded">{selectedBet.bet_number}</span>
            </div>

            <div className="bg-entain-dark rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Match</span>
                <span className="text-white font-medium">{selectedBet.home_team} vs {selectedBet.away_team}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prediction</span>
                <span className="text-entain-accent font-medium capitalize">{selectedBet.prediction}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Stake</span>
                <span className="text-white font-medium">{selectedBet.stake} EP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Odds</span>
                <span className="text-white font-medium">{selectedBet.odds}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Potential Payout</span>
                <span className="text-entain-gold font-medium">{Math.round(selectedBet.stake * selectedBet.odds)} EP</span>
              </div>
              <hr className="border-entain-blue/20" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span>{getStatusBadge(selectedBet.status)}</span>
              </div>
              {selectedBet.status === 'won' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Payout</span>
                  <span className="text-entain-green font-bold">+{selectedBet.payout} EP</span>
                </div>
              )}
              <hr className="border-entain-blue/20" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Placed</span>
                <span className="text-gray-300 text-xs">{new Date(selectedBet.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              {selectedBet.match_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Kickoff</span>
                  <span className="text-gray-300 text-xs">{new Date(selectedBet.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {selectedBet.match_status === 'finished' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Final Score</span>
                  <span className="text-white font-bold">{selectedBet.home_score} - {selectedBet.away_score}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBet(null)}
              className="w-full mt-4 bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBets;
