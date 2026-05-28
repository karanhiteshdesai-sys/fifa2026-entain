/**
 * Tag Referral Competition System
 * 
 * Users earn tags based on the number of successful (approved) referrals.
 * Tags are badges for the referral competition — no odds boost.
 */

const TAG_TIERS = [
  { minReferrals: 50, name: 'Diamond Diplomat', emoji: '💎👑', color: '#B9F2FF' },
  { minReferrals: 40, name: 'Gold Diplomat', emoji: '✨👑', color: '#FFD700' },
  { minReferrals: 30, name: 'Silver Diplomat', emoji: '⚡👑', color: '#C0C0C0' },
  { minReferrals: 20, name: 'Diplomat', emoji: '👑', color: '#8B0000' },
  { minReferrals: 10, name: 'Diamond', emoji: '💎', color: '#B9F2FF' },
  { minReferrals: 5, name: 'Gold', emoji: '✨', color: '#FFD700' },
  { minReferrals: 3, name: 'Silver', emoji: '⚡', color: '#C0C0C0' },
];

/**
 * Get the user's tag based on their referral count.
 * @param {number} referralCount - Number of approved referrals
 * @returns {{ tag: string, emoji: string, color: string, referralCount: number, nextTag: string|null, referralsNeeded: number|null }}
 */
function getUserTag(referralCount) {
  const count = Number(referralCount) || 0;

  // Find the highest tier the user qualifies for
  const currentTier = TAG_TIERS.find(t => count >= t.minReferrals) || null;

  // Find the next tier above current
  let nextTier = null;
  if (!currentTier) {
    nextTier = TAG_TIERS[TAG_TIERS.length - 1]; // Silver
  } else {
    const currentIndex = TAG_TIERS.indexOf(currentTier);
    if (currentIndex > 0) {
      nextTier = TAG_TIERS[currentIndex - 1];
    }
  }

  return {
    tag: currentTier ? currentTier.name : 'Employee',
    emoji: currentTier ? currentTier.emoji : '👤',
    color: currentTier ? currentTier.color : '#6b7280',
    referralCount: count,
    nextTag: nextTier ? nextTier.name : null,
    referralsNeeded: nextTier ? nextTier.minReferrals - count : null,
  };
}

module.exports = { getUserTag, TAG_TIERS };
