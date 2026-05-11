import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import MyBets from './pages/MyBets';
import Standings from './pages/Standings';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
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
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/change-password" element={<ChangePassword />} />
          {user.role === 'admin' && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <ChatBot />
    </div>
  );
}

export default App;
