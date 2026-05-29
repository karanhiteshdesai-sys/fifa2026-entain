import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import TagCard from '../components/TagCard';

const ALL_TIERS = [
  { name: 'Employee', emoji: '👤', minReferrals: 0, color: '#6b7280' },
  { name: 'Silver', emoji: '⚡', minReferrals: 3, color: '#C0C0C0' },
  { name: 'Gold', emoji: '✨', minReferrals: 5, color: '#FFD700' },
  { name: 'Diamond', emoji: '💎', minReferrals: 10, color: '#B9F2FF' },
  { name: 'Diplomat', emoji: '👑', minReferrals: 20, color: '#8B0000' },
  { name: 'Silver Diplomat', emoji: '⚡👑', minReferrals: 30, color: '#C0C0C0' },
  { name: 'Gold Diplomat', emoji: '✨👑', minReferrals: 40, color: '#FFD700' },
  { name: 'Diamond Diplomat', emoji: '💎👑', minReferrals: 50, color: '#B9F2FF' },
];

function MyTag() {
  const [tagData, setTagData] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTag = async () => {
      try {
        const [tagRes, treeRes] = await Promise.all([
          api.get('/auth/my-tag'),
          api.get('/leaderboard/referral-tree')
        ]);
        setTagData(tagRes.data);
        setTreeData(treeRes.data);
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
        <h1 className="text-2xl font-bold text-white">🏷️ My Entain Tag</h1>
      </div>

      {/* Tag Card */}
      <div className="mb-10">
        <TagCard />
      </div>

      {/* How it works */}
      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-6 mb-8">
        <h2 className="text-white font-semibold text-lg mb-4">How Tags Work</h2>
        <div className="space-y-3 text-sm text-gray-300">
          <p>📣 Refer colleagues to the World Cup 2026 Predictions app using your referral code.</p>
          <p>✅ Once they register and get approved, it counts as a successful referral.</p>
          <p>🏷️ Reach referral milestones to unlock Tags and climb the Referral Leaderboard.</p>
          <p>🏆 Compete with others to see who can refer the most people!</p>
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
                  {isUnlocked ? (
                    <span className="text-entain-green text-sm font-medium">✓ Unlocked</span>
                  ) : (
                    <span className="text-gray-500 text-sm">🔒 Locked</span>
                  )}
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
            {!tagData.nextTag && (
              <p className="text-center text-entain-gold text-sm font-medium mt-2">🏆 Max Tier Reached! You're a legend.</p>
            )}
          </div>
        )}
      </div>
      {/* Referral Tree */}
      {treeData && treeData.tree.length > 0 && treeData.tree[0].children && treeData.tree[0].children.length > 0 && (
        <div className="bg-entain-navy rounded-xl border border-entain-blue/20 p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">🌳 Your Referral Tree</h2>
            <span className="text-entain-accent text-sm font-bold">{treeData.totalReferrals} total referral{treeData.totalReferrals !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            {treeData.tree.map(node => (
              <TreeNode key={node.id} node={node} level={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, level }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: level * 24 }}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-2 py-2 px-3 rounded-lg mb-1 transition ${
          hasChildren ? 'cursor-pointer hover:bg-entain-dark/50' : ''
        } ${level === 0 ? 'bg-entain-accent/10 border border-entain-accent/30' : ''}`}
      >
        {/* Tree connector */}
        {level > 0 && (
          <span className="text-entain-blue/50 text-sm">└─</span>
        )}

        {/* Expand/collapse icon */}
        {hasChildren && (
          <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        )}
        {!hasChildren && level > 0 && <span className="text-gray-600 text-xs w-3">•</span>}

        {/* User info */}
        <span className={`font-medium text-sm ${level === 0 ? 'text-entain-accent' : 'text-white'}`}>
          {node.name}
        </span>
        {node.department && (
          <span className="text-gray-500 text-xs">• {node.department}</span>
        )}
        {hasChildren && (
          <span className="text-entain-gold text-xs ml-auto">{node.children.length} referral{node.children.length !== 1 ? 's' : ''}</span>
        )}
        {node.joined && level > 0 && (
          <span className="text-gray-600 text-xs ml-auto">
            {new Date(node.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="border-l border-entain-blue/20 ml-4">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTag;
