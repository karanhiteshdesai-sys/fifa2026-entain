import { useState, useEffect } from 'react';
import api from '../services/api';

function Leaderboard() {
  const [tab, setTab] = useState('predictions'); // 'predictions' or 'referrals'
  const [leaderboard, setLeaderboard] = useState([]);
  const [referralBoard, setReferralBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, refRes] = await Promise.all([
          api.get('/leaderboard'),
          api.get('/leaderboard/referrals')
        ]);
        setLeaderboard(lbRes.data);
        setReferralBoard(refRes.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading leaderboard...</div>;
  }

  const getMedal = (index) => {
    if (index === 0) return <span className="text-3xl">🥇</span>;
    if (index === 1) return <span className="text-3xl">🥈</span>;
    if (index === 2) return <span className="text-3xl">🥉</span>;
    if (index === 3) return <span className="text-2xl">🏅</span>;
    if (index === 4) return <span className="text-2xl">🎖️</span>;
    return <span className="text-white font-bold text-lg">#{index + 1}</span>;
  };

  const getTagStyle = (tag) => {
    if (tag === 'Diamond Diplomat') return 'bg-cyan-400/20 text-cyan-300';
    if (tag === 'Gold Diplomat') return 'bg-yellow-400/20 text-yellow-300';
    if (tag === 'Silver Diplomat') return 'bg-gray-300/20 text-gray-300';
    if (tag === 'Diplomat') return 'bg-red-400/20 text-red-300';
    if (tag === 'Diamond') return 'bg-cyan-400/20 text-cyan-300';
    if (tag === 'Gold') return 'bg-yellow-400/20 text-yellow-300';
    if (tag === 'Silver') return 'bg-gray-300/20 text-gray-300';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">🏆 Leaderboard</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('predictions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'predictions' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300 hover:text-white'
          }`}
        >
          ⚽ Predictions
        </button>
        <button
          onClick={() => setTab('referrals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'referrals' ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300 hover:text-white'
          }`}
        >
          📣 Referrals
        </button>
      </div>

      {/* Predictions Leaderboard */}
      {tab === 'predictions' && (
        <>
          <p className="text-gray-400 text-sm mb-4">Ranked by composite score: EP Balance (60%) + Win Rate (40%). Minimum 1 bet to qualify.</p>
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
                    <td className="px-6 py-4 text-lg">{getMedal(index)}</td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{player.name}</span>
                      {player.department && <p className="text-gray-500 text-xs">{player.department}</p>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTagStyle(player.tag)}`} title={player.tag}>{player.tag}</span>
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
                    <td className="px-4 py-4 text-right text-gray-300">{player.total_bets || 0}</td>
                    <td className="px-4 py-4 text-right text-gray-300">{player.bets_won || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaderboard.length === 0 && (
              <div className="text-center text-gray-400 py-12">No players yet. Place at least 1 bet to appear on the leaderboard!</div>
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
        </>
      )}

      {/* Referral Leaderboard */}
      {tab === 'referrals' && (
        <>
          <p className="text-gray-400 text-sm mb-4">Ranked by number of successful referrals. Refer colleagues to climb the ranks and earn your Entain Tag!</p>
          <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-entain-blue/20">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Rank</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-3">Player</th>
                  <th className="text-center text-gray-400 text-sm font-medium px-4 py-3">Tag</th>
                  <th className="text-right text-gray-400 text-sm font-medium px-6 py-3">Referrals</th>
                </tr>
              </thead>
              <tbody>
                {referralBoard.slice(0, 1).map((player, index) => (
                  <tr key={player.id} className="border-b border-entain-blue/10 hover:bg-entain-blue/10 transition">
                    <td className="px-6 py-4 text-lg">{getMedal(index)}</td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{player.name}</span>
                      {player.department && <p className="text-gray-500 text-xs">{player.department}</p>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTagStyle(player.tag)}`} title={player.tag}>
                        {player.tagEmoji} {player.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-entain-accent font-bold text-lg">{player.referral_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {referralBoard.length === 0 && (
              <div className="text-center text-gray-400 py-12">No referrals yet. Share your referral code to get started!</div>
            )}
          </div>

          {/* Tag Tiers Info */}
          <div className="mt-6 bg-entain-navy rounded-xl border border-entain-blue/20 p-5">
            <h3 className="text-white font-semibold mb-3">🏷️ Tag Tiers</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">⚡ Silver</span><span className="text-white">3+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">✨ Gold</span><span className="text-white">5+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">💎 Diamond</span><span className="text-white">10+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">👑 Diplomat</span><span className="text-white">20+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">⚡👑 Silver Diplomat</span><span className="text-white">30+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">✨👑 Gold Diplomat</span><span className="text-white">40+ referrals</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">💎👑 Diamond Diplomat</span><span className="text-white">50+ referrals</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;
