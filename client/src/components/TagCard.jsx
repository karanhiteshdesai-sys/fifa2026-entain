import { useState, useEffect } from 'react';
import api from '../services/api';

const TAG_COLORS = {
  'Silver': { bg: '#C0C0C0', text: '#1a1a2e', glow: 'rgba(192,192,192,0.4)' },
  'Gold': { bg: '#FFD700', text: '#1a1a2e', glow: 'rgba(255,215,0,0.4)' },
  'Diamond': { bg: '#B9F2FF', text: '#1a1a2e', glow: 'rgba(185,242,255,0.4)' },
  'Diplomat': { bg: '#8B0000', text: '#ffffff', glow: 'rgba(139,0,0,0.4)' },
  'Silver Diplomat': { bg: '#C0C0C0', text: '#1a1a2e', glow: 'rgba(192,192,192,0.5)', dark: true },
  'Gold Diplomat': { bg: '#FFD700', text: '#1a1a2e', glow: 'rgba(255,215,0,0.5)', dark: true },
  'Diamond Diplomat': { bg: '#B9F2FF', text: '#1a1a2e', glow: 'rgba(185,242,255,0.5)', dark: true },
};

function TagCard() {
  const [flipped, setFlipped] = useState(false);
  const [tagData, setTagData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchTag = async () => {
      try {
        const { data } = await api.get('/auth/my-tag');
        setTagData(data);
      } catch (err) {
        console.error('Failed to fetch tag:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTag();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto h-52 bg-entain-navy rounded-2xl animate-pulse border border-entain-blue/20" />
    );
  }

  const hasTag = tagData?.tag !== null;
  const colors = hasTag ? TAG_COLORS[tagData.tag] : null;
  const isDiplomatTier = tagData?.tag?.includes('Diplomat');

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card Container with perspective */}
      <div
        className="relative w-full h-52 cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Click to see card front' : 'Click to reveal your tag'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped(!flipped); }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front of Card */}
          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between border border-entain-blue/30 overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #351a52 0%, #1a1a2e 50%, #6b21a8 100%)',
            }}
          >
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="80" cy="20" r="40" fill="white" />
                <circle cx="60" cy="40" r="20" fill="white" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <img src="/entain-logo.svg" alt="Entain" className="w-6 h-6" />
                <span className="text-entain-accent text-xs font-bold tracking-wider">ENTAIN</span>
              </div>
              <p className="text-gray-400 text-[10px] tracking-widest uppercase">FIFA 2026 VIP</p>
            </div>

            <div className="relative z-10">
              <p className="text-white text-lg font-bold tracking-wide">{user.name || 'Player'}</p>
              <p className="text-gray-400 text-xs mt-1">Tap to reveal your Tag</p>
            </div>

            {/* Chip decoration */}
            <div className="absolute bottom-6 right-6 w-10 h-7 rounded-md bg-gradient-to-br from-yellow-400/60 to-yellow-600/60 border border-yellow-500/30" />
          </div>

          {/* Back of Card */}
          <div
            className="absolute inset-0 rounded-2xl p-6 flex flex-col justify-between border overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: hasTag
                ? isDiplomatTier
                  ? `linear-gradient(135deg, #1a1a2e 0%, ${colors.bg}33 50%, #1a1a2e 100%)`
                  : `linear-gradient(135deg, ${colors.bg}22 0%, #1a1a2e 50%, ${colors.bg}33 100%)`
                : 'linear-gradient(135deg, #1a1a2e 0%, #351a52 100%)',
              borderColor: hasTag ? `${colors.bg}55` : 'rgba(107,33,168,0.3)',
              boxShadow: hasTag ? `0 0 30px ${colors.glow}` : 'none',
            }}
          >
            {hasTag ? (
              <>
                {/* Tag Header */}
                <div className="text-center">
                  <span className="text-4xl">{tagData.emoji}</span>
                  <h3
                    className="text-xl font-bold mt-2 tracking-wide"
                    style={{ color: colors.bg }}
                  >
                    {tagData.tag} Tag
                  </h3>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Odds Boost</span>
                    <span className="text-entain-green font-bold text-sm">+{tagData.boost}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Referrals</span>
                    <span className="text-white font-bold text-sm">{tagData.referralCount}</span>
                  </div>
                  {tagData.nextTag && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Next: {tagData.nextTag}</span>
                      <span className="text-entain-accent text-xs">{tagData.referralsNeeded} more</span>
                    </div>
                  )}
                  {!tagData.nextTag && (
                    <p className="text-center text-entain-gold text-xs font-medium mt-1">🏆 Max Tier Reached!</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* No Tag State */}
                <div className="text-center flex-1 flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3">🏷️</span>
                  <h3 className="text-white text-lg font-bold">No Tag Yet</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    Refer <span className="text-entain-accent font-bold">{tagData.referralsNeeded}</span> people to unlock
                  </p>
                  <p className="text-gray-300 text-sm font-medium mt-1">🥈 Silver Tag (+5% boost)</p>
                </div>

                <div className="text-center">
                  <p className="text-gray-500 text-xs">Current referrals: {tagData.referralCount}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hint text below card */}
      <p className="text-center text-gray-500 text-xs mt-2">
        {flipped ? 'Tap to flip back' : 'Tap card to reveal your tag'}
      </p>
    </div>
  );
}

export default TagCard;
