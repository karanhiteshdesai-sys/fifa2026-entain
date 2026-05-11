const { pool, initDb } = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding FIFA 2026 database...');

  await initDb();

  // Check if already seeded
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM matches');
  if (Number(rows[0].count) > 0) {
    console.log('✅ Database already seeded, skipping.');
    return;
  }

  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  // Seed admin users
  await pool.query(
    'INSERT INTO users (name, email, password, role, status, points) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
    ['Admin', 'admin@entaingroup.com', adminPassword, 'admin', 'approved', 99999]
  );
  await pool.query(
    'INSERT INTO users (name, email, password, role, status, points) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
    ['Karan Desai', 'karan.desai@entaingroup.com', userPassword, 'admin', 'approved', 20]
  );

  // Seed matches
  const matches = [
    ['Mexico', 'South Africa', 'A', 'group', '2026-06-11T19:00:00', 'Mexico City Stadium (Estadio Azteca)', 1.7, 3.5, 5.0],
    ['South Korea', 'Czechia', 'A', 'group', '2026-06-12T02:00:00', 'Guadalajara Stadium (Estadio Akron)', 2.1, 3.3, 3.4],
    ['Czechia', 'South Africa', 'A', 'group', '2026-06-18T16:00:00', 'Atlanta Stadium (Mercedes-Benz)', 2.3, 3.2, 3.0],
    ['Mexico', 'South Korea', 'A', 'group', '2026-06-19T01:00:00', 'Guadalajara Stadium (Estadio Akron)', 2.4, 3.2, 2.9],
    ['Czechia', 'Mexico', 'A', 'group', '2026-06-25T01:00:00', 'Mexico City Stadium (Estadio Azteca)', 4.0, 3.3, 1.9],
    ['South Africa', 'South Korea', 'A', 'group', '2026-06-25T01:00:00', 'Monterrey Stadium (Estadio BBVA)', 3.5, 3.3, 2.1],
    ['Canada', 'Bosnia and Herzegovina', 'B', 'group', '2026-06-12T19:00:00', 'Toronto Stadium (BMO Field)', 2.0, 3.3, 3.6],
    ['Qatar', 'Switzerland', 'B', 'group', '2026-06-13T19:00:00', 'San Francisco Bay Area Stadium', 4.5, 3.5, 1.8],
    ['Switzerland', 'Bosnia and Herzegovina', 'B', 'group', '2026-06-18T19:00:00', 'Los Angeles Stadium (SoFi)', 1.9, 3.3, 4.0],
    ['Canada', 'Qatar', 'B', 'group', '2026-06-18T22:00:00', 'BC Place, Vancouver', 1.6, 3.8, 5.5],
    ['Switzerland', 'Canada', 'B', 'group', '2026-06-24T19:00:00', 'BC Place, Vancouver', 2.5, 3.2, 2.8],
    ['Bosnia and Herzegovina', 'Qatar', 'B', 'group', '2026-06-24T19:00:00', 'Seattle Stadium (Lumen Field)', 1.8, 3.4, 4.5],
    ['Brazil', 'Morocco', 'C', 'group', '2026-06-13T22:00:00', 'New York New Jersey Stadium (MetLife)', 2.2, 3.2, 3.2],
    ['Haiti', 'Scotland', 'C', 'group', '2026-06-14T01:00:00', 'Boston Stadium (Gillette)', 4.5, 3.5, 1.8],
    ['Scotland', 'Morocco', 'C', 'group', '2026-06-19T22:00:00', 'Boston Stadium (Gillette)', 3.8, 3.3, 2.0],
    ['Brazil', 'Haiti', 'C', 'group', '2026-06-20T00:30:00', 'Philadelphia Stadium (Lincoln Financial)', 1.1, 8.0, 20.0],
    ['Scotland', 'Brazil', 'C', 'group', '2026-06-24T22:00:00', 'Miami Stadium (Hard Rock)', 7.0, 4.5, 1.4],
    ['Morocco', 'Haiti', 'C', 'group', '2026-06-24T22:00:00', 'Atlanta Stadium (Mercedes-Benz)', 1.2, 6.5, 13.0],
    ['USA', 'Paraguay', 'D', 'group', '2026-06-13T01:00:00', 'Los Angeles Stadium (SoFi)', 1.5, 4.0, 6.5],
    ['Australia', 'Turkiye', 'D', 'group', '2026-06-14T04:00:00', 'BC Place, Vancouver', 3.5, 3.3, 2.1],
    ['Turkiye', 'Paraguay', 'D', 'group', '2026-06-19T04:00:00', 'San Francisco Bay Area Stadium', 1.9, 3.4, 4.0],
    ['USA', 'Australia', 'D', 'group', '2026-06-19T19:00:00', 'Seattle Stadium (Lumen Field)', 1.5, 4.0, 6.5],
    ['Turkiye', 'USA', 'D', 'group', '2026-06-26T02:00:00', 'Los Angeles Stadium (SoFi)', 3.2, 3.3, 2.2],
    ['Paraguay', 'Australia', 'D', 'group', '2026-06-26T02:00:00', 'San Francisco Bay Area Stadium', 2.5, 3.2, 2.8],
    ['Germany', 'Curacao', 'E', 'group', '2026-06-14T17:00:00', 'Houston Stadium (NRG)', 1.1, 9.0, 25.0],
    ['Ivory Coast', 'Ecuador', 'E', 'group', '2026-06-14T23:00:00', 'Philadelphia Stadium (Lincoln Financial)', 2.8, 3.2, 2.5],
    ['Germany', 'Ivory Coast', 'E', 'group', '2026-06-20T20:00:00', 'Toronto Stadium (BMO Field)', 1.6, 3.8, 5.5],
    ['Ecuador', 'Curacao', 'E', 'group', '2026-06-21T00:00:00', 'Kansas City Stadium (Arrowhead)', 1.2, 6.0, 15.0],
    ['Curacao', 'Ivory Coast', 'E', 'group', '2026-06-25T20:00:00', 'Philadelphia Stadium (Lincoln Financial)', 8.0, 4.5, 1.4],
    ['Ecuador', 'Germany', 'E', 'group', '2026-06-25T20:00:00', 'New York New Jersey Stadium (MetLife)', 4.5, 3.5, 1.8],
    ['Netherlands', 'Japan', 'F', 'group', '2026-06-14T20:00:00', 'Dallas Stadium (AT&T)', 2.3, 3.3, 3.0],
    ['Sweden', 'Tunisia', 'F', 'group', '2026-06-15T02:00:00', 'Monterrey Stadium (Estadio BBVA)', 2.2, 3.2, 3.3],
    ['Netherlands', 'Sweden', 'F', 'group', '2026-06-20T17:00:00', 'Houston Stadium (NRG)', 1.7, 3.6, 4.8],
    ['Tunisia', 'Japan', 'F', 'group', '2026-06-21T04:00:00', 'Monterrey Stadium (Estadio BBVA)', 3.5, 3.3, 2.1],
    ['Japan', 'Sweden', 'F', 'group', '2026-06-25T23:00:00', 'Dallas Stadium (AT&T)', 2.0, 3.3, 3.6],
    ['Tunisia', 'Netherlands', 'F', 'group', '2026-06-25T23:00:00', 'Kansas City Stadium (Arrowhead)', 5.5, 3.8, 1.6],
    ['Belgium', 'Egypt', 'G', 'group', '2026-06-15T19:00:00', 'Seattle Stadium (Lumen Field)', 1.8, 3.5, 4.5],
    ['Iran', 'New Zealand', 'G', 'group', '2026-06-16T01:00:00', 'Los Angeles Stadium (SoFi)', 1.9, 3.3, 4.0],
    ['Belgium', 'Iran', 'G', 'group', '2026-06-21T19:00:00', 'Los Angeles Stadium (SoFi)', 1.5, 4.0, 6.5],
    ['New Zealand', 'Egypt', 'G', 'group', '2026-06-22T01:00:00', 'BC Place, Vancouver', 3.8, 3.3, 2.0],
    ['Egypt', 'Iran', 'G', 'group', '2026-06-27T03:00:00', 'Seattle Stadium (Lumen Field)', 2.3, 3.2, 3.0],
    ['New Zealand', 'Belgium', 'G', 'group', '2026-06-27T03:00:00', 'BC Place, Vancouver', 8.0, 4.5, 1.4],
    ['Spain', 'Cabo Verde', 'H', 'group', '2026-06-15T16:00:00', 'Atlanta Stadium (Mercedes-Benz)', 1.1, 9.0, 25.0],
    ['Saudi Arabia', 'Uruguay', 'H', 'group', '2026-06-15T22:00:00', 'Miami Stadium (Hard Rock)', 4.5, 3.5, 1.8],
    ['Spain', 'Saudi Arabia', 'H', 'group', '2026-06-21T16:00:00', 'Atlanta Stadium (Mercedes-Benz)', 1.2, 6.5, 15.0],
    ['Uruguay', 'Cabo Verde', 'H', 'group', '2026-06-21T22:00:00', 'Miami Stadium (Hard Rock)', 1.2, 6.0, 14.0],
    ['Cabo Verde', 'Saudi Arabia', 'H', 'group', '2026-06-27T00:00:00', 'Houston Stadium (NRG)', 3.0, 3.2, 2.4],
    ['Uruguay', 'Spain', 'H', 'group', '2026-06-27T00:00:00', 'Guadalajara Stadium (Estadio Akron)', 3.5, 3.3, 2.1],
    ['France', 'Senegal', 'I', 'group', '2026-06-16T19:00:00', 'New York New Jersey Stadium (MetLife)', 1.4, 4.5, 7.5],
    ['Iraq', 'Norway', 'I', 'group', '2026-06-16T22:00:00', 'Boston Stadium (Gillette)', 3.5, 3.3, 2.1],
    ['France', 'Iraq', 'I', 'group', '2026-06-22T21:00:00', 'Philadelphia Stadium (Lincoln Financial)', 1.2, 6.5, 14.0],
    ['Norway', 'Senegal', 'I', 'group', '2026-06-23T00:00:00', 'New York New Jersey Stadium (MetLife)', 2.5, 3.2, 2.8],
    ['Norway', 'France', 'I', 'group', '2026-06-26T19:00:00', 'Boston Stadium (Gillette)', 5.0, 3.6, 1.7],
    ['Senegal', 'Iraq', 'I', 'group', '2026-06-26T19:00:00', 'Toronto Stadium (BMO Field)', 1.7, 3.5, 5.0],
    ['Argentina', 'Algeria', 'J', 'group', '2026-06-17T01:00:00', 'Kansas City Stadium (Arrowhead)', 1.3, 5.0, 9.0],
    ['Austria', 'Jordan', 'J', 'group', '2026-06-17T04:00:00', 'San Francisco Bay Area Stadium', 1.7, 3.6, 5.0],
    ['Argentina', 'Austria', 'J', 'group', '2026-06-22T17:00:00', 'Dallas Stadium (AT&T)', 1.4, 4.5, 7.5],
    ['Jordan', 'Algeria', 'J', 'group', '2026-06-23T03:00:00', 'San Francisco Bay Area Stadium', 3.0, 3.2, 2.4],
    ['Algeria', 'Austria', 'J', 'group', '2026-06-28T02:00:00', 'Kansas City Stadium (Arrowhead)', 2.8, 3.2, 2.5],
    ['Jordan', 'Argentina', 'J', 'group', '2026-06-28T02:00:00', 'Dallas Stadium (AT&T)', 12.0, 5.5, 1.2],
    ['Portugal', 'DR Congo', 'K', 'group', '2026-06-17T17:00:00', 'Houston Stadium (NRG)', 1.3, 5.0, 10.0],
    ['Uzbekistan', 'Colombia', 'K', 'group', '2026-06-18T02:00:00', 'Mexico City Stadium (Estadio Azteca)', 5.0, 3.6, 1.7],
    ['Portugal', 'Uzbekistan', 'K', 'group', '2026-06-23T17:00:00', 'Houston Stadium (NRG)', 1.2, 6.5, 15.0],
    ['Colombia', 'DR Congo', 'K', 'group', '2026-06-24T02:00:00', 'Guadalajara Stadium (Estadio Akron)', 1.4, 4.5, 8.0],
    ['Colombia', 'Portugal', 'K', 'group', '2026-06-27T23:30:00', 'Miami Stadium (Hard Rock)', 3.2, 3.3, 2.2],
    ['DR Congo', 'Uzbekistan', 'K', 'group', '2026-06-27T23:30:00', 'Atlanta Stadium (Mercedes-Benz)', 2.3, 3.2, 3.0],
    ['England', 'Croatia', 'L', 'group', '2026-06-17T20:00:00', 'Dallas Stadium (AT&T)', 1.9, 3.4, 4.0],
    ['Ghana', 'Panama', 'L', 'group', '2026-06-17T23:00:00', 'Toronto Stadium (BMO Field)', 2.5, 3.2, 2.8],
    ['England', 'Ghana', 'L', 'group', '2026-06-23T20:00:00', 'Boston Stadium (Gillette)', 1.3, 5.0, 10.0],
    ['Panama', 'Croatia', 'L', 'group', '2026-06-23T23:00:00', 'Toronto Stadium (BMO Field)', 4.5, 3.5, 1.8],
    ['Panama', 'England', 'L', 'group', '2026-06-27T21:00:00', 'New York New Jersey Stadium (MetLife)', 10.0, 5.0, 1.3],
    ['Croatia', 'Ghana', 'L', 'group', '2026-06-27T21:00:00', 'Philadelphia Stadium (Lincoln Financial)', 1.8, 3.5, 4.5],
  ];

  for (const m of matches) {
    await pool.query(
      'INSERT INTO matches (home_team, away_team, group_name, stage, match_date, venue, home_odds, draw_odds, away_odds) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      m
    );
  }

  console.log(`✅ Seeded ${matches.length} matches`);
  console.log('🏆 Database ready!');
}

seed().then(() => {
  if (require.main === module) process.exit(0);
}).catch(err => {
  console.error('Seed failed:', err);
  if (require.main === module) process.exit(1);
});

module.exports = seed;
