import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TagCard from '../components/TagCard';

const ALL_TIERS = [
  { name: 'Employee', emoji: '👤', minReferrals: 0, boost: 0, color: '#6b7280' },
  { name: 'Silver', emoji: '🥈', minReferrals: 3, boost: 5, color: '#C0C0C0' },
  { name: 'Gold', emoji: '🥇', minReferrals: 5, boost: 10, color: '#FFD700' },
  { name: 'Diamond', emoji: '💎', minReferrals: 10, boost: 15, color: '#B9F2FF' },
  { name: 'Diplomat', emoji: '🎖️', minReferrals: 20, boost: 20, color: '#8B0000' },
  { name: 'Silver Diplomat', emoji: '🥈🎖️', minReferrals: 30, boost: 25, color: '#C0C0C0' },
  { name: 'Gold Diplomat', emoji: '🥇🎖️', minReferrals: 40, boost: 30, color: '#FFD700' },
  { name: 'Diamond Diplomat', emoji: '💎🎖️', minReferrals: 50, boost: 35, color: '#B9F2FF' },
];

function MyTag() {
  const [tagData, setTagData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="text-center text-gray-400 py-12">Loading tag info...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-white transition">← Back</Link>
        <h1 className="text-2xl font-bold text-white">🏷️ My VIP Tag</h1>
      </div>

      {/* Tag Card */}
      <div className="mb-10">
        <TagCard />
      </div>

      {/* How it works */}
      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-6 mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">How Tags Work</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>📣 Refer colleagues to the FIFA 2026 Predictions app using your referral code.</p>
          <p>✅ Once they register and get approved, it counts as a successful referral.</p>
          <p>🏷️ Reach referral milestones to unlock Tags that boost your betting odds.</p>
          <p>📈 The boost is applied automatically when you place any bet.</p>
        </div>
      </div>

      {/* All Tiers */}
      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-6">
        <h2 className="text-white font-semibold text-lg mb-4">Tag Tiers</h2>
        <div className="space-y-3">
          {ALL_TIERS.map((tier) => {
            const isUnlocked = tagData && tagData.referralCount >= tier.minReferrals;
            const isCurrent = tagData?.tag === tier.name;

            return (
              <div
                key={tier.name}
                className={`flex items-center justify-between p-4 rounded-xl border transition ${
                  isCurrent
                    ? 'border-entain-accent/50 bg-entain-accent/5'
                    : isUnlocked
                    ? 'border-entain-blue/30 bg-entain-dark/50'
                    : 'border-entain-blue/10 bg-entain-dark/30 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tier.emoji}</span>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {tier.name} Tag
                      {isCurrent && <span className="ml-2 text-entain-accent text-xs">(Current)</span>}
                    </p>
                    <p className="text-gray-500 text-xs">{tier.minReferrals}+ referrals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-entain-green font-bold text-sm">+{tier.boost}%</p>
                  <p className="text-gray-500 text-xs">odds boost</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        {tagData && (
          <div className="mt-6 pt-4 border-t border-entain-blue/20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Your referrals</span>
              <span className="text-white font-bold">{tagData.referralCount}</span>
            </div>
            {tagData.nextTag && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Next unlock: {tagData.nextTag}</span>
                <span className="text-entain-accent font-medium">{tagData.referralsNeeded} more needed</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTag;
