import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import MyBets from './pages/MyBets';
import Standings from './pages/Standings';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import Info from './pages/Info';
import Team from './pages/Team';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import FloatingChat from './components/FloatingChat';
import UpdateBanner from './components/UpdateBanner';
import BroadcastAlert from './components/BroadcastAlert';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Auto-refresh user points every 30 seconds
  useEffect(() => {
    if (!user) return;

    const refreshUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(prev => {
          const updated = { ...prev, points: data.points };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        // Token expired or invalid
        if (err.response?.status === 401) {
          handleLogout();
        }
      }
    };

    refreshUser(); // Refresh immediately on load
    const interval = setInterval(refreshUser, 30000); // Then every 30s
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
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and earn 25 EP</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and earn 25 EP</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
          </div>
          <div className="flex shrink-0 items-center py-1">
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and earn 25 EP</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎁 Refer an employee and earn 25 EP</span>
            <span className="text-sm font-bold text-black mx-6">⚽ FIFA 2026</span>
            <span className="text-sm font-bold text-black mx-6">🎉 Vibe Tribe - Social Committee</span>
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
          <Route path="/change-password" element={<ChangePassword />} />
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
    </div>
  );
}

export default App;
