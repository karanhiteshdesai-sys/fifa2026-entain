import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import MyBets from './pages/MyBets';
import Standings from './pages/Standings';
import Chat from './pages/Chat';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import Info from './pages/Info';
import Team from './pages/Team';
import MyTag from './pages/MyTag';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import FloatingChat from './components/FloatingChat';
import UpdateBanner from './components/UpdateBanner';
import BroadcastAlert from './components/BroadcastAlert';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Activity heartbeat — ping server every 30s with current page
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = () => {
      const page = location.pathname.replace('/', '') || 'home';
      api.post('/activity/heartbeat', { page }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [user?.id, location.pathname]);

  // Tag promotion state
  const [tagPromotion, setTagPromotion] = useState(null);

  // Auto-refresh user points every 60 seconds
  useEffect(() => {
    if (!user) return;

    const refreshUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.status === 'blocked') {
          setUser(prev => ({ ...prev, status: 'blocked' }));
          return;
        }
        setUser(prev => {
          const updated = { ...prev, points: data.points, status: data.status };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        if (err.response?.status === 401) {
          handleLogout();
        }
      }
    };

    refreshUser();
    const interval = setInterval(refreshUser, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Check for tag promotions
  useEffect(() => {
    if (!user) return;

    const checkTagPromotion = async () => {
      try {
        const { data } = await api.get('/auth/my-tag');
        const lastTag = localStorage.getItem('lastKnownTag');
        if (data.tag && data.tag !== lastTag) {
          if (lastTag !== null) {
            // Tag changed — show promotion popup
            setTagPromotion(data);
          }
          localStorage.setItem('lastKnownTag', data.tag || '');
        } else if (!data.tag && lastTag === null) {
          localStorage.setItem('lastKnownTag', '');
        }
      } catch {}
    };

    checkTagPromotion();
    const interval = setInterval(checkTagPromotion, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    window.location.href = '/';
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-entain-dark">
      <div className="bg-yellow-400 overflow-hidden relative sticky top-0 z-40">
        <div className="flex animate-marquee">
          <div className="flex shrink-0 items-center py-1">
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6 inline-flex items-center gap-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg> Upgrade your Tag card to get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6 inline-flex items-center gap-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg> Upgrade your Tag card to get the best odds</span>
          </div>
          <div className="flex shrink-0 items-center py-1">
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6 inline-flex items-center gap-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg> Upgrade your Tag card to get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and get the best odds</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6 inline-flex items-center gap-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg> Upgrade your Tag card to get the best odds</span>
          </div>
        </div>
      </div>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/my-tag" element={<MyTag />} />
          <Route path="/info" element={<Info />} />
          <Route path="/team" element={<Team />} />
          {user.role === 'admin' && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <ChatBot />
      <FloatingChat />
      <UpdateBanner />
      <BroadcastAlert />

      {/* Tag Promotion Popup */}
      {tagPromotion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9998] px-4">
          <div className="bg-entain-navy rounded-xl p-8 w-full max-w-sm border border-entain-accent/50 shadow-2xl text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-white text-2xl font-bold mb-2">Congratulations!</h3>
            <p className="text-gray-300 text-sm mb-4">You've been promoted to</p>
            <div className="bg-entain-dark rounded-xl p-4 mb-4 border border-entain-blue/20">
              <span className="text-4xl">{tagPromotion.emoji}</span>
              <p className="text-white text-xl font-bold mt-2">{tagPromotion.tag} Tag</p>
              <p className="text-entain-green font-semibold mt-1">+{tagPromotion.boost}% Odds Boost</p>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              {tagPromotion.nextTag
                ? `Keep referring! ${tagPromotion.referralsNeeded} more to unlock ${tagPromotion.nextTag}.`
                : 'You reached the highest tier! Maximum odds boost unlocked.'}
            </p>
            <button
              onClick={() => setTagPromotion(null)}
              className="w-full bg-entain-accent text-entain-dark font-bold py-2.5 rounded-lg hover:bg-entain-accent/90 transition"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Blocked User Modal */}
      {user?.status === 'blocked' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] px-4">
          <div className="bg-entain-navy rounded-xl p-8 w-full max-w-sm border border-red-500/50 shadow-2xl text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h3 className="text-white text-xl font-bold mb-3">Account Blocked</h3>
            <p className="text-gray-300 text-sm mb-6">Your account has been blocked from placing bets. Please contact <span className="text-entain-accent font-semibold">Karan Desai</span> for assistance.</p>
            <button
              onClick={handleLogout}
              className="w-full bg-entain-dark text-gray-300 py-2.5 rounded-lg hover:text-white transition border border-entain-blue/30"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
