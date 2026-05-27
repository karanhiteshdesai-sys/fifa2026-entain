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
      <h2 className="text-2xl font-bold text-white mb-2">🏆 Leaderboard</h2>
      <p className="text-gray-400 text-sm mb-6">Ranked by composite score: EP Balance (60%) + Win Rate (40%). Minimum 1 bet to qualify.</p>

      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-entain-blue/20">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Rank</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Player</th>
              <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Tag</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Score</th>
              <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">EP</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Win Rate</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Bets</th>
              <th className="text-right text-gray-400 text-sm font-medium px-4 py-3">Won</th>
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
                <td className="px-4 py-4 text-right">
                  <span className="text-entain-accent font-bold text-lg">{player.score?.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-entain-gold font-medium">{player.points?.toLocaleString()}</span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-entain-green font-medium">{player.win_rate || 0}%</span>
                </td>
                <td className="px-4 py-4 text-right text-gray-300">
                  {player.total_bets || 0}
                </td>
                <td className="px-4 py-4 text-right text-gray-300">
                  {player.bets_won || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leaderboard.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            No players yet. Place at least 1 bet to appear on the leaderboard!
          </div>
        )}
      </div>

      {/* Scoring Breakdown */}
      <div className="mt-6 bg-entain-navy rounded-xl border border-entain-blue/20 p-5">
        <h3 className="text-white font-semibold mb-3">📊 How the Score is Calculated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-entain-dark rounded-lg p-3 text-center">
            <p className="text-entain-gold text-2xl font-bold">60%</p>
            <p className="text-gray-400 text-xs mt-1">EP Balance</p>
            <p className="text-gray-500 text-[10px]">Your current points</p>
          </div>
          <div className="bg-entain-dark rounded-lg p-3 text-center">
            <p className="text-entain-green text-2xl font-bold">40%</p>
            <p className="text-gray-400 text-xs mt-1">Win Rate</p>
            <p className="text-gray-500 text-[10px]">Prediction accuracy</p>
          </div>
        </div>
        <p className="text-gray-500 text-xs mt-3 text-center">Minimum 1 bet required to appear on the leaderboard.</p>
      </div>
    </div>
  );
}

export default Leaderboard;
