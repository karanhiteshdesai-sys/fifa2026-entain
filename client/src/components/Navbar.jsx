import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    location.pathname === path
      ? 'text-entain-accent border-b-2 border-entain-accent'
      : 'text-gray-300 hover:text-white';

  return (
    <nav className="bg-entain-navy border-b border-entain-blue/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/entain-logo.svg" alt="Entain" className="w-8 h-8" />
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-sm leading-tight">FIFA 2026</h1>
              <p className="text-entain-accent text-[10px] font-medium">ENTAIN PREDICTIONS</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/" className={`pb-1 text-sm font-medium transition ${isActive('/')}`}>
              Home
            </Link>
            <Link to="/matches" className={`pb-1 text-sm font-medium transition ${isActive('/matches')}`}>
              Matches
            </Link>
            <Link to="/standings" className={`pb-1 text-sm font-medium transition ${isActive('/standings')}`}>
              Standings
            </Link>
            <Link to="/leaderboard" className={`pb-1 text-sm font-medium transition ${isActive('/leaderboard')}`}>
              Leaderboard
            </Link>
            <Link to="/my-bets" className={`pb-1 text-sm font-medium transition ${isActive('/my-bets')}`}>
              My Bets
            </Link>
            <Link to="/chat" className={`pb-1 text-sm font-medium transition ${isActive('/chat')}`}>
              Chat
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className={`pb-1 text-sm font-medium transition ${isActive('/admin')}`}>
                Admin
              </Link>
            )}
          </div>

          {/* User Info + Mobile Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-medium">{user.name}</p>
              <p className="text-entain-gold text-[10px] font-bold">{user.points?.toLocaleString()} EP</p>
            </div>
            <span className="text-entain-gold text-xs font-bold sm:hidden">{user.points?.toLocaleString()} EP</span>
            <Link to="/change-password" className="text-gray-400 hover:text-white text-sm transition hidden sm:block" title="Change Password">
              ⚙️
            </Link>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-white text-xs transition hidden md:block"
              aria-label="Logout"
            >
              Logout
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-300 hover:text-white text-xl"
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-entain-blue/20 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Home
            </Link>
            <Link to="/matches" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Matches
            </Link>
            <Link to="/standings" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Standings
            </Link>
            <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Leaderboard
            </Link>
            <Link to="/my-bets" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              My Bets
            </Link>
            <Link to="/chat" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Chat
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
                Admin
              </Link>
            )}
            <Link to="/change-password" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Change Password
            </Link>
            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              className="block text-entain-red text-sm py-2 w-full text-left"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
