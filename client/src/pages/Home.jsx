import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TagCard from '../components/TagCard';

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
      {/* Welcome Header + Refer & Earn */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-400 mt-1">
            {daysUntil > 0
              ? `${daysUntil} days until FIFA 2026 kicks off!`
              : 'FIFA 2026 is underway! Place your bets now.'}
          </p>
        </div>
      </div>

      {/* Tag Card & Referral - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">🏷️ Your VIP Tag</h2>
            <Link to="/my-tag" className="text-entain-accent text-sm hover:underline">View details →</Link>
          </div>
          <TagCard />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">📣 Refer & Keep Getting Best Odds</h2>
          <ReferralCard />
        </div>
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
        {/* Upcoming Matches + Live Scores */}
        <div className="md:col-span-2">
          {/* Live Scores Widget */}
          <LiveScoresWidget matches={matches} />

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
                    <span className="text-3xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
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

function LiveScoresWidget({ matches }) {
  const tournamentStart = new Date('2026-06-11T19:00:00');
  const now = new Date();
  const tournamentStarted = now >= tournamentStart;

  // Get today's matches or most recent finished matches
  const todayStr = now.toISOString().split('T')[0];
  const liveMatches = matches.filter(m => m.status === 'live');
  const todayFinished = matches.filter(m => {
    const matchDay = new Date(m.match_date).toISOString().split('T')[0];
    return matchDay === todayStr && m.status === 'finished';
  });
  const recentFinished = matches.filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    .slice(0, 3);

  const displayMatches = liveMatches.length > 0 ? liveMatches : todayFinished.length > 0 ? todayFinished : recentFinished;

  if (!tournamentStarted) {
    // Countdown mode
    const diff = tournamentStart - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-lg">🔴 Live Scores</h2>
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Coming Soon</span>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm mb-3">Tournament kicks off in</p>
          <div className="flex justify-center gap-4">
            <div className="bg-entain-dark rounded-lg px-4 py-3 min-w-[70px]">
              <p className="text-entain-accent text-2xl font-bold">{days}</p>
              <p className="text-gray-500 text-xs">days</p>
            </div>
            <div className="bg-entain-dark rounded-lg px-4 py-3 min-w-[70px]">
              <p className="text-entain-accent text-2xl font-bold">{hours}</p>
              <p className="text-gray-500 text-xs">hours</p>
            </div>
            <div className="bg-entain-dark rounded-lg px-4 py-3 min-w-[70px]">
              <p className="text-entain-accent text-2xl font-bold">{mins}</p>
              <p className="text-gray-500 text-xs">mins</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">Mexico vs South Africa • June 11, 2026 • Estadio Azteca</p>
        </div>
      </div>
    );
  }

  // Tournament is live
  return (
    <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-lg">🔴 Live Scores</h2>
        {liveMatches.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">● LIVE</span>
        )}
        {liveMatches.length === 0 && (
          <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Latest Results</span>
        )}
      </div>
      {displayMatches.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No matches today. Check back on match day!</p>
      ) : (
        <div className="space-y-2">
          {displayMatches.map(m => (
            <div key={m.id} className="bg-entain-dark rounded-lg p-3 flex items-center">
              <span className="text-white text-sm flex-1 text-right truncate">{m.home_team}</span>
              <div className="w-20 text-center flex-shrink-0">
                {m.status === 'finished' ? (
                  <span className="text-white font-bold text-lg">{m.home_score} - {m.away_score}</span>
                ) : m.status === 'live' ? (
                  <span className="text-red-400 font-bold text-lg animate-pulse">{m.home_score || 0} - {m.away_score || 0}</span>
                ) : (
                  <span className="text-gray-500 text-xs">{new Date(m.match_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
              <span className="text-white text-sm flex-1 truncate">{m.away_team}</span>
              {m.status === 'live' && <span className="text-red-400 text-xs ml-2 animate-pulse">●</span>}
              {m.status === 'finished' && <span className="text-gray-500 text-xs ml-2">FT</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdSlider() {
  const [current, setCurrent] = useState(0);
  const slides = ['/download.jpg', '/download (1).jpg', '/coral.png', '/fifa.png', '/Gemini_Generated_Image_lpdr87lpdr87lpdr.png'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  const goToNext = () => setCurrent(prev => (prev + 1) % slides.length);

  return (
    <div className="relative rounded-xl overflow-hidden border border-entain-blue/20 group">
      <img
        src={slides[current]}
        alt="Sponsor"
        className="w-full h-48 object-cover transition-opacity duration-500"
      />
      {/* Left Arrow */}
      <button
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Previous slide"
      >
        ‹
      </button>
      {/* Right Arrow */}
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        aria-label="Next slide"
      >
        ›
      </button>
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

function ReferralCard() {
  const [copied, setCopied] = useState(false);

  // Generate referral code from user data already in localStorage (no API call needed)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const prefix = (user.name || 'USER').replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const idPart = ((user.id || 1) * 7919).toString(36).substring(0, 4).toUpperCase();
  const referralCode = `FIFA-${prefix}${idPart}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-4">
      <p className="text-gray-400 text-sm mb-3">Share your code with colleagues. You earn <span className="text-entain-gold font-bold">25 EP</span> for each approved referral!</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={referralCode}
          className="flex-1 bg-entain-dark border border-entain-blue/30 rounded-lg px-3 py-2 text-white text-sm font-mono tracking-wider"
        />
        <button
          onClick={handleCopy}
          className="bg-entain-accent text-entain-dark text-xs font-bold px-3 py-2 rounded-lg hover:bg-entain-accent/90 transition whitespace-nowrap"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default Home;
