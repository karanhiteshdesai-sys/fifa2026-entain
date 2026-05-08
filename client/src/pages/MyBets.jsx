import { useState, useEffect } from 'react';
import api from '../services/api';

function MyBets() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const { data } = await api.get('/bets');
        setBets(data);
      } catch (err) {
        console.error('Failed to fetch bets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBets();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading your bets...</div>;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-xs">Pending</span>;
      case 'won':
        return <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">Won ✓</span>;
      case 'lost':
        return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Lost ✗</span>;
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

      {/* Bet List */}
      <div className="space-y-3">
        {bets.map(bet => (
          <div key={bet.id} className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {bet.home_team} vs {bet.away_team}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Prediction: <span className="text-entain-accent capitalize">{bet.prediction}</span>
                  {' • '}Odds: {bet.odds}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(bet.created_at).toLocaleDateString('en-GB', {
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
    </div>
  );
}

export default MyBets;
