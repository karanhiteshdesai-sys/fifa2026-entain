import { useState, useEffect } from 'react';
import api from '../services/api';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/leaderboard');
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading leaderboard...</div>;
  }

  const getMedal = (index) => {
    if (index === 0) return <span className="text-3xl">🥇</span>;
    if (index === 1) return <span className="text-3xl">🥈</span>;
    if (index === 2) return <span className="text-3xl">🥉</span>;
    return <span className="text-white font-bold text-lg">#{index + 1}</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🏆 Leaderboard</h2>

      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-entain-blue/20">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Rank</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Player</th>
              <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Tag</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">Points</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">Bets</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">Won</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr key={player.id} className="border-b border-entain-blue/10 hover:bg-entain-blue/10 transition">
                <td className="px-6 py-4 text-lg">
                  {getMedal(index)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-medium">{player.name}</span>
                  {player.department && <p className="text-gray-500 text-xs">{player.department}</p>}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    player.tag === 'Diamond Diplomat' ? 'bg-cyan-400/20 text-cyan-300' :
                    player.tag === 'Gold Diplomat' ? 'bg-yellow-400/20 text-yellow-300' :
                    player.tag === 'Silver Diplomat' ? 'bg-gray-300/20 text-gray-300' :
                    player.tag === 'Diplomat' ? 'bg-red-400/20 text-red-300' :
                    player.tag === 'Diamond' ? 'bg-cyan-400/20 text-cyan-300' :
                    player.tag === 'Gold' ? 'bg-yellow-400/20 text-yellow-300' :
                    player.tag === 'Silver' ? 'bg-gray-300/20 text-gray-300' :
                    'bg-gray-500/20 text-gray-400'
                  }`} title={player.tag}>{player.tag}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-entain-gold font-bold">{player.points?.toLocaleString()} EP</span>
                </td>
                <td className="px-6 py-4 text-right text-gray-300">
                  {player.total_bets || 0}
                </td>
                <td className="px-6 py-4 text-right text-entain-green">
                  {player.bets_won || 0}
                </td>
                <td className="px-6 py-4 text-right text-gray-300">
                  {player.total_bets > 0
                    ? `${Math.round((player.bets_won / player.total_bets) * 100)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No players yet. Place some bets to appear on the leaderboard!
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
