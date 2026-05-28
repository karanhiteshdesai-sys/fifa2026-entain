const { db, pool } = require('../db/database');

// World Cup 2026 Round of 32 bracket structure (fixed matchups)
const R32_FIXED_MATCHUPS = [
  { match: 73, home: '2A', away: '2B', date: '2026-06-28T19:00:00', venue: 'Los Angeles Stadium (SoFi)' },
  { match: 74, home: '1E', away: '3rd_ABCDF', date: '2026-06-29T20:30:00', venue: 'Boston Stadium (Gillette)' },
  { match: 75, home: '1F', away: '2C', date: '2026-06-30T01:00:00', venue: 'Monterrey Stadium (Estadio BBVA)' },
  { match: 76, home: '1C', away: '2F', date: '2026-06-29T17:00:00', venue: 'Houston Stadium (NRG)' },
  { match: 77, home: '1I', away: '3rd_CDFGH', date: '2026-06-30T21:00:00', venue: 'New York New Jersey Stadium (MetLife)' },
  { match: 78, home: '2E', away: '2I', date: '2026-06-30T17:00:00', venue: 'Dallas Stadium (AT&T)' },
  { match: 79, home: '1A', away: '3rd_CEFHI', date: '2026-07-01T01:00:00', venue: 'Mexico City Stadium (Estadio Azteca)' },
  { match: 80, home: '1L', away: '3rd_EHIJK', date: '2026-07-01T16:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)' },
  { match: 81, home: '1D', away: '3rd_BEFIJ', date: '2026-07-02T00:00:00', venue: 'San Francisco Bay Area Stadium' },
  { match: 82, home: '1G', away: '3rd_AEHIJ', date: '2026-07-01T20:00:00', venue: 'Seattle Stadium (Lumen Field)' },
  { match: 83, home: '2K', away: '2L', date: '2026-07-02T23:00:00', venue: 'Toronto Stadium (BMO Field)' },
  { match: 84, home: '1H', away: '2J', date: '2026-07-02T19:00:00', venue: 'Los Angeles Stadium (SoFi)' },
  { match: 85, home: '1B', away: '3rd_EFGIJ', date: '2026-07-03T03:00:00', venue: 'BC Place, Vancouver' },
  { match: 86, home: '1J', away: '2H', date: '2026-07-03T22:00:00', venue: 'Miami Stadium (Hard Rock)' },
  { match: 87, home: '1K', away: '3rd_DEIJL', date: '2026-07-04T01:30:00', venue: 'Kansas City Stadium (Arrowhead)' },
  { match: 88, home: '2D', away: '2G', date: '2026-07-03T18:00:00', venue: 'Dallas Stadium (AT&T)' },
];

// Round of 16 matchups (winners of R32 matches)
const R16_MATCHUPS = [
  { match: 89, home: 'W74', away: 'W77', date: '2026-07-04T21:00:00', venue: 'Philadelphia Stadium (Lincoln Financial)' },
  { match: 90, home: 'W73', away: 'W75', date: '2026-07-04T17:00:00', venue: 'Houston Stadium (NRG)' },
  { match: 91, home: 'W76', away: 'W78', date: '2026-07-05T20:00:00', venue: 'New York New Jersey Stadium (MetLife)' },
  { match: 92, home: 'W79', away: 'W80', date: '2026-07-06T00:00:00', venue: 'Mexico City Stadium (Estadio Azteca)' },
  { match: 93, home: 'W83', away: 'W84', date: '2026-07-06T19:00:00', venue: 'Dallas Stadium (AT&T)' },
  { match: 94, home: 'W81', away: 'W82', date: '2026-07-07T00:00:00', venue: 'Seattle Stadium (Lumen Field)' },
  { match: 95, home: 'W86', away: 'W88', date: '2026-07-07T16:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)' },
  { match: 96, home: 'W85', away: 'W87', date: '2026-07-07T20:00:00', venue: 'BC Place, Vancouver' },
];

// Quarter-finals
const QF_MATCHUPS = [
  { match: 97, home: 'W89', away: 'W90', date: '2026-07-09T20:00:00', venue: 'Boston Stadium (Gillette)' },
  { match: 98, home: 'W93', away: 'W94', date: '2026-07-10T19:00:00', venue: 'Los Angeles Stadium (SoFi)' },
  { match: 99, home: 'W91', away: 'W92', date: '2026-07-11T21:00:00', venue: 'Miami Stadium (Hard Rock)' },
  { match: 100, home: 'W95', away: 'W96', date: '2026-07-12T01:00:00', venue: 'Kansas City Stadium (Arrowhead)' },
];

// Semi-finals
const SF_MATCHUPS = [
  { match: 101, home: 'W97', away: 'W98', date: '2026-07-14T19:00:00', venue: 'Dallas Stadium (AT&T)' },
  { match: 102, home: 'W99', away: 'W100', date: '2026-07-15T19:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)' },
];

// Third place and Final
const FINAL_MATCHUPS = [
  { match: 103, home: 'L101', away: 'L102', date: '2026-07-18T21:00:00', venue: 'Miami Stadium (Hard Rock)' },
  { match: 104, home: 'W101', away: 'W102', date: '2026-07-19T19:00:00', venue: 'New York New Jersey Stadium (MetLife)' },
];

/**
 * Calculate group standings from finished matches
 */
async function getGroupStandings() {
  const matches = await db.getAllMatches();
  const finishedGroupMatches = matches.filter(m => m.stage === 'group' && m.status === 'finished');

  const standings = {};

  finishedGroupMatches.forEach(m => {
    if (!standings[m.group_name]) standings[m.group_name] = {};
    if (!standings[m.group_name][m.home_team]) standings[m.group_name][m.home_team] = { team: m.home_team, group: m.group_name, pts: 0, gd: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 };
    if (!standings[m.group_name][m.away_team]) standings[m.group_name][m.away_team] = { team: m.away_team, group: m.group_name, pts: 0, gd: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 };

    const home = standings[m.group_name][m.home_team];
    const away = standings[m.group_name][m.away_team];

    home.played++; away.played++;
    home.gf += m.home_score; home.ga += m.away_score;
    away.gf += m.away_score; away.ga += m.home_score;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (m.home_score > m.away_score) { home.pts += 3; home.w++; away.l++; }
    else if (m.home_score < m.away_score) { away.pts += 3; away.w++; home.l++; }
    else { home.pts += 1; away.pts += 1; home.d++; away.d++; }
  });

  // Sort each group
  const sorted = {};
  for (const [group, teams] of Object.entries(standings)) {
    sorted[group] = Object.values(teams).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  return sorted;
}

/**
 * Check if all group stage matches are finished
 */
async function areGroupsComplete() {
  const matches = await db.getAllMatches();
  const groupMatches = matches.filter(m => m.stage === 'group');
  return groupMatches.length > 0 && groupMatches.every(m => m.status === 'finished');
}

/**
 * Get the 8 best third-placed teams
 */
function getBestThirdPlaced(standings) {
  const thirdPlaced = [];
  for (const [group, teams] of Object.entries(standings)) {
    if (teams.length >= 3) {
      thirdPlaced.push({ ...teams[2], group });
    }
  }
  // Sort by points, then GD, then GF
  thirdPlaced.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  return thirdPlaced.slice(0, 8); // Best 8 qualify
}

/**
 * Determine which third-placed teams go where based on FIFA's combination table
 * Simplified: maps qualifying groups to match slots
 */
function resolveThirdPlaceSlots(qualifyingGroups) {
  // Sort the qualifying group letters
  const groups = qualifyingGroups.sort();
  const key = groups.join('');

  // Simplified mapping based on FIFA rules
  // Slots: [3rd for Match74, 3rd for Match77, 3rd for Match79, 3rd for Match80, 3rd for Match81, 3rd for Match82, 3rd for Match85, 3rd for Match87]
  // This is a simplified version - in reality there are 495 combinations
  // We'll use a reasonable default mapping based on the group letters
  const slotOrder = [74, 82, 79, 80, 81, 77, 85, 87];

  const result = {};
  groups.forEach((g, i) => {
    result[slotOrder[i]] = g;
  });
  return result;
}

/**
 * Generate Round of 32 matches after groups complete
 */
async function generateKnockoutRound() {
  const complete = await areGroupsComplete();
  if (!complete) {
    return { error: 'Group stage is not yet complete.' };
  }

  // Check if knockout matches already exist
  const allMatches = await db.getAllMatches();
  const knockoutExists = allMatches.some(m => m.stage !== 'group');
  if (knockoutExists) {
    return { error: 'Knockout matches already generated.' };
  }

  const standings = await getGroupStandings();
  const bestThird = getBestThirdPlaced(standings);
  const qualifyingThirdGroups = bestThird.map(t => t.group);
  const thirdSlots = resolveThirdPlaceSlots(qualifyingThirdGroups);

  // Resolve team names for each R32 match
  const r32Matches = [];
  for (const matchup of R32_FIXED_MATCHUPS) {
    let homeTeam = resolveSlot(matchup.home, standings, bestThird, thirdSlots, matchup.match);
    let awayTeam = resolveSlot(matchup.away, standings, bestThird, thirdSlots, matchup.match);

    r32Matches.push({
      home_team: homeTeam,
      away_team: awayTeam,
      group_name: null,
      stage: 'round_of_32',
      match_date: matchup.date,
      venue: matchup.venue,
      home_odds: 2.0,
      draw_odds: 3.2,
      away_odds: 2.5,
    });
  }

  // Insert R32 matches
  for (const m of r32Matches) {
    await pool.query(
      'INSERT INTO matches (home_team, away_team, group_name, stage, match_date, venue, home_odds, draw_odds, away_odds) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [m.home_team, m.away_team, m.group_name, m.stage, m.match_date, m.venue, m.home_odds, m.draw_odds, m.away_odds]
    );
  }

  return { message: `Generated ${r32Matches.length} Round of 32 matches!`, matches: r32Matches };
}

/**
 * Resolve a slot like '1A', '2B', '3rd_ABCDF' to an actual team name
 */
function resolveSlot(slot, standings, bestThird, thirdSlots, matchNum) {
  if (slot.startsWith('1')) {
    const group = slot[1];
    return standings[group]?.[0]?.team || `Winner Group ${group}`;
  } else if (slot.startsWith('2')) {
    const group = slot[1];
    return standings[group]?.[1]?.team || `Runner-up Group ${group}`;
  } else if (slot.startsWith('3rd_')) {
    // Find which third-placed team goes to this match
    const thirdGroup = thirdSlots[matchNum];
    if (thirdGroup) {
      const team = bestThird.find(t => t.group === thirdGroup);
      return team?.team || `3rd Place (${slot.replace('3rd_', '')})`;
    }
    return `3rd Place (${slot.replace('3rd_', '')})`;
  }
  return slot;
}

module.exports = { generateKnockoutRound, getGroupStandings, areGroupsComplete, getBestThirdPlaced };
