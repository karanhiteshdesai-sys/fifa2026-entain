import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Home() {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, matchRes, betsRes, lbRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/matches'),
          api.get('/bets'),
          api.get('/leaderboard')
        ]);
        setUser(userRes.data);
        setMatches(matchRes.data);
        setBets(betsRes.data);
        setLeaderboard(lbRes.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading dashboard...</div>;
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming').slice(0, 4);
  const totalBets = bets.length;
  const betsWon = bets.filter(b => b.status === 'won').length;
  const betsLost = bets.filter(b => b.status === 'lost').length;
  const winRate = totalBets > 0 ? Math.round((betsWon / totalBets) * 100) : 0;
  const totalWinnings = bets.filter(b => b.status === 'won').reduce((sum, b) => sum + b.payout, 0);
  const top3 = leaderboard.slice(0, 3);

  // Tournament countdown
  const tournamentStart = new Date('2026-06-11T19:00:00');
  const now = new Date();
  const daysUntil = Math.max(0, Math.ceil((tournamentStart - now) / (1000 * 60 * 60 * 24)));

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-400 mt-1">
          {daysUntil > 0
            ? `${daysUntil} days until FIFA 2026 kicks off!`
            : 'FIFA 2026 is underway! Place your bets now.'}
        </p>
      </div>

      {/* Balance & Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20 col-span-2 md:col-span-1">
          <p className="text-gray-400 text-xs mb-1">Your Balance</p>
          <p className="text-entain-gold text-3xl font-bold">{user?.points} <span className="text-lg">EP</span></p>
        </div>
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <p className="text-gray-400 text-xs mb-1">Bets Placed</p>
          <p className="text-white text-2xl font-bold">{totalBets}</p>
        </div>
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <p className="text-gray-400 text-xs mb-1">Win Rate</p>
          <p className="text-entain-green text-2xl font-bold">{winRate}%</p>
        </div>
        <div className="bg-entain-navy rounded-xl p-5 border border-entain-blue/20">
          <p className="text-gray-400 text-xs mb-1">Total Winnings</p>
          <p className="text-entain-accent text-2xl font-bold">{totalWinnings} EP</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upcoming Matches */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">🏟️ Upcoming Matches</h2>
            <Link to="/matches" className="text-entain-accent text-sm hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {upcomingMatches.map(match => (
              <div key={match.id} className="bg-entain-navy rounded-xl p-4 border border-entain-blue/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-entain-blue/50 text-gray-300 px-2 py-0.5 rounded">Group {match.group_name}</span>
                  </div>
                  <p className="text-white font-medium">{match.home_team} vs {match.away_team}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(match.match_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Link
                  to="/matches"
                  className="bg-entain-accent/10 text-entain-accent text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-entain-accent/20 transition"
                >
                  Bet Now
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard Top 3 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">🏆 Top Players</h2>
              <Link to="/leaderboard" className="text-entain-accent text-sm hover:underline">Full board →</Link>
            </div>
            <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden">
              {top3.map((player, i) => (
                <div key={player.id} className="flex items-center justify-between px-4 py-3 border-b border-entain-blue/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <span className="text-white text-sm font-medium">{player.name}</span>
                  </div>
                  <span className="text-entain-gold text-sm font-bold">{player.points} EP</span>
                </div>
              ))}
              {top3.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No players yet</p>
              )}
            </div>
          </div>

          {/* Ad Slider */}
          <div>
            <h2 className="text-white font-semibold text-lg mb-4">Sponsors</h2>
            <AdSlider />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdSlider() {
  const [current, setCurrent] = useState(0);
  const slides = ['/download.jpg', '/download (1).jpg', '/coral.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-entain-blue/20">
      <img
        src={slides[current]}
        alt="Sponsor"
        className="w-full h-48 object-cover transition-opacity duration-500"
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition ${i === current ? 'bg-entain-accent' : 'bg-white/40'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
