import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import MyBets from './pages/MyBets';
import Standings from './pages/Standings';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

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
          <Route path="/" element={<Matches />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/my-bets" element={<MyBets />} />
          <Route path="/change-password" element={<ChangePassword />} />
          {user.role === 'admin' && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
