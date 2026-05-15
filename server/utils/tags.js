/**
 * Tag Referral Rewards System
 * 
 * Users earn tags based on the number of successful (approved) referrals.
 * Each tag grants an odds boost percentage applied when placing bets.
 */

const TAG_TIERS = [
  { minReferrals: 50, name: 'Diamond Diplomat', emoji: '💎👑', boost: 35, color: '#B9F2FF' },
  { minReferrals: 40, name: 'Gold Diplomat', emoji: '✨👑', boost: 30, color: '#FFD700' },
  { minReferrals: 30, name: 'Silver Diplomat', emoji: '⚡👑', boost: 25, color: '#C0C0C0' },
  { minReferrals: 20, name: 'Diplomat', emoji: '👑', boost: 20, color: '#8B0000' },
  { minReferrals: 10, name: 'Diamond', emoji: '💎', boost: 15, color: '#B9F2FF' },
  { minReferrals: 5, name: 'Gold', emoji: '✨', boost: 10, color: '#FFD700' },
  { minReferrals: 3, name: 'Silver', emoji: '⚡', boost: 5, color: '#C0C0C0' },
];

/**
 * Get the user's tag based on their referral count.
 * @param {number} referralCount - Number of approved referrals
 * @returns {{ tag: string|null, emoji: string|null, boost: number, color: string|null, nextTag: string|null, referralsNeeded: number|null }}
 */
function getUserTag(referralCount) {
  const count = Number(referralCount) || 0;

  // Find the highest tier the user qualifies for
  const currentTier = TAG_TIERS.find(t => count >= t.minReferrals) || null;

  // Find the next tier above current
  let nextTier = null;
  if (!currentTier) {
    // User has Employee tag (default), next is Silver (3 referrals)
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
    boost: currentTier ? currentTier.boost : 0,
    color: currentTier ? currentTier.color : '#6b7280',
    referralCount: count,
    nextTag: nextTier ? nextTier.name : null,
    referralsNeeded: nextTier ? nextTier.minReferrals - count : null,
  };
}

/**
 * Apply odds boost to base odds.
 * @param {number} baseOdds - The original odds value
 * @param {number} boostPercent - The boost percentage (e.g. 10 for +10%)
 * @returns {number} Boosted odds rounded to 2 decimal places
 */
function applyOddsBoost(baseOdds, boostPercent) {
  if (!boostPercent || boostPercent <= 0) return baseOdds;
  const boosted = baseOdds * (1 + boostPercent / 100);
  return Math.round(boosted * 100) / 100;
}

module.exports = { getUserTag, applyOddsBoost, TAG_TIERS };
