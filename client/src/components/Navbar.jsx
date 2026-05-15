import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path
      ? 'text-entain-accent border-b-2 border-entain-accent'
      : 'text-gray-300 hover:text-white';

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link to="/info" className={`pb-1 text-sm font-medium transition ${isActive('/info')}`}>
              Info
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className={`pb-1 text-sm font-medium transition ${isActive('/admin')}`}>
                Admin
              </Link>
            )}
          </div>

          {/* User Info Dropdown */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-white text-xs font-medium">{user.name}</p>
                  <p className="text-entain-gold text-[10px] font-bold">{user.points?.toLocaleString()} EP</p>
                </div>
                <span className="text-entain-gold text-xs font-bold sm:hidden">{user.points?.toLocaleString()} EP</span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-entain-navy border border-entain-blue/30 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-entain-blue/20">
                    <p className="text-white text-sm font-medium">{user.name}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                    <p className="text-entain-gold text-xs font-bold mt-1">{user.points?.toLocaleString()} EP</p>
                  </div>
                  <Link
                    to="/my-tag"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-entain-blue/20 hover:text-white text-sm transition"
                  >
                    🏷️ My Tag
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-entain-blue/20 hover:text-white text-sm transition"
                  >
                    ✉️ Messages
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2.5 text-gray-300 hover:bg-entain-blue/20 hover:text-white text-sm transition"
                  >
                    🔑 Change Password
                  </Link>
                  <button
                    onClick={() => { onLogout(); setProfileOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-sm transition"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

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
            <Link to="/info" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
              Info
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm py-2">
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
