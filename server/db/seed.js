const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding FIFA 2026 database with real tournament data...');

const DB_PATH = path.join(__dirname, 'data.json');

const adminPassword = bcrypt.hashSync('admin123', 10);
const userPassword = bcrypt.hashSync('user123', 10);

const data = {
  users: [
    { id: 1, name: 'Admin', email: 'admin@entaingroup.com', password: adminPassword, role: 'admin', status: 'approved', points: 99999, created_at: new Date().toISOString() },
    { id: 2, name: 'Karan Desai', email: 'karan.desai@entaingroup.com', password: userPassword, role: 'admin', status: 'approved', points: 99999, created_at: new Date().toISOString() },
  ],
  matches: [
    // ===== GROUP A =====
    { id: 1, home_team: 'Mexico', away_team: 'South Africa', group_name: 'A', stage: 'group', match_date: '2026-06-11T19:00:00', venue: 'Mexico City Stadium (Estadio Azteca)', home_odds: 1.7, draw_odds: 3.5, away_odds: 5.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 2, home_team: 'South Korea', away_team: 'Czechia', group_name: 'A', stage: 'group', match_date: '2026-06-12T02:00:00', venue: 'Guadalajara Stadium (Estadio Akron)', home_odds: 2.1, draw_odds: 3.3, away_odds: 3.4, status: 'upcoming', home_score: null, away_score: null },
    { id: 3, home_team: 'Czechia', away_team: 'South Africa', group_name: 'A', stage: 'group', match_date: '2026-06-18T16:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)', home_odds: 2.3, draw_odds: 3.2, away_odds: 3.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 4, home_team: 'Mexico', away_team: 'South Korea', group_name: 'A', stage: 'group', match_date: '2026-06-19T01:00:00', venue: 'Guadalajara Stadium (Estadio Akron)', home_odds: 2.4, draw_odds: 3.2, away_odds: 2.9, status: 'upcoming', home_score: null, away_score: null },
    { id: 5, home_team: 'Czechia', away_team: 'Mexico', group_name: 'A', stage: 'group', match_date: '2026-06-25T01:00:00', venue: 'Mexico City Stadium (Estadio Azteca)', home_odds: 4.0, draw_odds: 3.3, away_odds: 1.9, status: 'upcoming', home_score: null, away_score: null },
    { id: 6, home_team: 'South Africa', away_team: 'South Korea', group_name: 'A', stage: 'group', match_date: '2026-06-25T01:00:00', venue: 'Monterrey Stadium (Estadio BBVA)', home_odds: 3.5, draw_odds: 3.3, away_odds: 2.1, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP B =====
    { id: 7, home_team: 'Canada', away_team: 'Bosnia and Herzegovina', group_name: 'B', stage: 'group', match_date: '2026-06-12T19:00:00', venue: 'Toronto Stadium (BMO Field)', home_odds: 2.0, draw_odds: 3.3, away_odds: 3.6, status: 'upcoming', home_score: null, away_score: null },
    { id: 8, home_team: 'Qatar', away_team: 'Switzerland', group_name: 'B', stage: 'group', match_date: '2026-06-13T19:00:00', venue: 'San Francisco Bay Area Stadium (Levi\'s)', home_odds: 4.5, draw_odds: 3.5, away_odds: 1.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 9, home_team: 'Switzerland', away_team: 'Bosnia and Herzegovina', group_name: 'B', stage: 'group', match_date: '2026-06-18T19:00:00', venue: 'Los Angeles Stadium (SoFi)', home_odds: 1.9, draw_odds: 3.3, away_odds: 4.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 10, home_team: 'Canada', away_team: 'Qatar', group_name: 'B', stage: 'group', match_date: '2026-06-18T22:00:00', venue: 'BC Place, Vancouver', home_odds: 1.6, draw_odds: 3.8, away_odds: 5.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 11, home_team: 'Switzerland', away_team: 'Canada', group_name: 'B', stage: 'group', match_date: '2026-06-24T19:00:00', venue: 'BC Place, Vancouver', home_odds: 2.5, draw_odds: 3.2, away_odds: 2.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 12, home_team: 'Bosnia and Herzegovina', away_team: 'Qatar', group_name: 'B', stage: 'group', match_date: '2026-06-24T19:00:00', venue: 'Seattle Stadium (Lumen Field)', home_odds: 1.8, draw_odds: 3.4, away_odds: 4.5, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP C =====
    { id: 13, home_team: 'Brazil', away_team: 'Morocco', group_name: 'C', stage: 'group', match_date: '2026-06-13T22:00:00', venue: 'New York New Jersey Stadium (MetLife)', home_odds: 2.2, draw_odds: 3.2, away_odds: 3.2, status: 'upcoming', home_score: null, away_score: null },
    { id: 14, home_team: 'Haiti', away_team: 'Scotland', group_name: 'C', stage: 'group', match_date: '2026-06-14T01:00:00', venue: 'Boston Stadium (Gillette)', home_odds: 4.5, draw_odds: 3.5, away_odds: 1.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 15, home_team: 'Scotland', away_team: 'Morocco', group_name: 'C', stage: 'group', match_date: '2026-06-19T22:00:00', venue: 'Boston Stadium (Gillette)', home_odds: 3.8, draw_odds: 3.3, away_odds: 2.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 16, home_team: 'Brazil', away_team: 'Haiti', group_name: 'C', stage: 'group', match_date: '2026-06-20T00:30:00', venue: 'Philadelphia Stadium (Lincoln Financial)', home_odds: 1.1, draw_odds: 8.0, away_odds: 20.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 17, home_team: 'Scotland', away_team: 'Brazil', group_name: 'C', stage: 'group', match_date: '2026-06-24T22:00:00', venue: 'Miami Stadium (Hard Rock)', home_odds: 7.0, draw_odds: 4.5, away_odds: 1.4, status: 'upcoming', home_score: null, away_score: null },
    { id: 18, home_team: 'Morocco', away_team: 'Haiti', group_name: 'C', stage: 'group', match_date: '2026-06-24T22:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)', home_odds: 1.2, draw_odds: 6.5, away_odds: 13.0, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP D =====
    { id: 19, home_team: 'USA', away_team: 'Paraguay', group_name: 'D', stage: 'group', match_date: '2026-06-13T01:00:00', venue: 'Los Angeles Stadium (SoFi)', home_odds: 1.5, draw_odds: 4.0, away_odds: 6.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 20, home_team: 'Australia', away_team: 'Turkiye', group_name: 'D', stage: 'group', match_date: '2026-06-14T04:00:00', venue: 'BC Place, Vancouver', home_odds: 3.5, draw_odds: 3.3, away_odds: 2.1, status: 'upcoming', home_score: null, away_score: null },
    { id: 21, home_team: 'Turkiye', away_team: 'Paraguay', group_name: 'D', stage: 'group', match_date: '2026-06-19T04:00:00', venue: 'San Francisco Bay Area Stadium (Levi\'s)', home_odds: 1.9, draw_odds: 3.4, away_odds: 4.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 22, home_team: 'USA', away_team: 'Australia', group_name: 'D', stage: 'group', match_date: '2026-06-19T19:00:00', venue: 'Seattle Stadium (Lumen Field)', home_odds: 1.5, draw_odds: 4.0, away_odds: 6.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 23, home_team: 'Turkiye', away_team: 'USA', group_name: 'D', stage: 'group', match_date: '2026-06-26T02:00:00', venue: 'Los Angeles Stadium (SoFi)', home_odds: 3.2, draw_odds: 3.3, away_odds: 2.2, status: 'upcoming', home_score: null, away_score: null },
    { id: 24, home_team: 'Paraguay', away_team: 'Australia', group_name: 'D', stage: 'group', match_date: '2026-06-26T02:00:00', venue: 'San Francisco Bay Area Stadium (Levi\'s)', home_odds: 2.5, draw_odds: 3.2, away_odds: 2.8, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP E =====
    { id: 25, home_team: 'Germany', away_team: 'Curacao', group_name: 'E', stage: 'group', match_date: '2026-06-14T17:00:00', venue: 'Houston Stadium (NRG)', home_odds: 1.1, draw_odds: 9.0, away_odds: 25.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 26, home_team: 'Ivory Coast', away_team: 'Ecuador', group_name: 'E', stage: 'group', match_date: '2026-06-14T23:00:00', venue: 'Philadelphia Stadium (Lincoln Financial)', home_odds: 2.8, draw_odds: 3.2, away_odds: 2.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 27, home_team: 'Germany', away_team: 'Ivory Coast', group_name: 'E', stage: 'group', match_date: '2026-06-20T20:00:00', venue: 'Toronto Stadium (BMO Field)', home_odds: 1.6, draw_odds: 3.8, away_odds: 5.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 28, home_team: 'Ecuador', away_team: 'Curacao', group_name: 'E', stage: 'group', match_date: '2026-06-21T00:00:00', venue: 'Kansas City Stadium (Arrowhead)', home_odds: 1.2, draw_odds: 6.0, away_odds: 15.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 29, home_team: 'Curacao', away_team: 'Ivory Coast', group_name: 'E', stage: 'group', match_date: '2026-06-25T20:00:00', venue: 'Philadelphia Stadium (Lincoln Financial)', home_odds: 8.0, draw_odds: 4.5, away_odds: 1.4, status: 'upcoming', home_score: null, away_score: null },
    { id: 30, home_team: 'Ecuador', away_team: 'Germany', group_name: 'E', stage: 'group', match_date: '2026-06-25T20:00:00', venue: 'New York New Jersey Stadium (MetLife)', home_odds: 4.5, draw_odds: 3.5, away_odds: 1.8, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP F =====
    { id: 31, home_team: 'Netherlands', away_team: 'Japan', group_name: 'F', stage: 'group', match_date: '2026-06-14T20:00:00', venue: 'Dallas Stadium (AT&T)', home_odds: 2.3, draw_odds: 3.3, away_odds: 3.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 32, home_team: 'Sweden', away_team: 'Tunisia', group_name: 'F', stage: 'group', match_date: '2026-06-15T02:00:00', venue: 'Monterrey Stadium (Estadio BBVA)', home_odds: 2.2, draw_odds: 3.2, away_odds: 3.3, status: 'upcoming', home_score: null, away_score: null },
    { id: 33, home_team: 'Netherlands', away_team: 'Sweden', group_name: 'F', stage: 'group', match_date: '2026-06-20T17:00:00', venue: 'Houston Stadium (NRG)', home_odds: 1.7, draw_odds: 3.6, away_odds: 4.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 34, home_team: 'Tunisia', away_team: 'Japan', group_name: 'F', stage: 'group', match_date: '2026-06-21T04:00:00', venue: 'Monterrey Stadium (Estadio BBVA)', home_odds: 3.5, draw_odds: 3.3, away_odds: 2.1, status: 'upcoming', home_score: null, away_score: null },
    { id: 35, home_team: 'Japan', away_team: 'Sweden', group_name: 'F', stage: 'group', match_date: '2026-06-25T23:00:00', venue: 'Dallas Stadium (AT&T)', home_odds: 2.0, draw_odds: 3.3, away_odds: 3.6, status: 'upcoming', home_score: null, away_score: null },
    { id: 36, home_team: 'Tunisia', away_team: 'Netherlands', group_name: 'F', stage: 'group', match_date: '2026-06-25T23:00:00', venue: 'Kansas City Stadium (Arrowhead)', home_odds: 5.5, draw_odds: 3.8, away_odds: 1.6, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP G =====
    { id: 37, home_team: 'Belgium', away_team: 'Egypt', group_name: 'G', stage: 'group', match_date: '2026-06-15T19:00:00', venue: 'Seattle Stadium (Lumen Field)', home_odds: 1.8, draw_odds: 3.5, away_odds: 4.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 38, home_team: 'Iran', away_team: 'New Zealand', group_name: 'G', stage: 'group', match_date: '2026-06-16T01:00:00', venue: 'Los Angeles Stadium (SoFi)', home_odds: 1.9, draw_odds: 3.3, away_odds: 4.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 39, home_team: 'Belgium', away_team: 'Iran', group_name: 'G', stage: 'group', match_date: '2026-06-21T19:00:00', venue: 'Los Angeles Stadium (SoFi)', home_odds: 1.5, draw_odds: 4.0, away_odds: 6.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 40, home_team: 'New Zealand', away_team: 'Egypt', group_name: 'G', stage: 'group', match_date: '2026-06-22T01:00:00', venue: 'BC Place, Vancouver', home_odds: 3.8, draw_odds: 3.3, away_odds: 2.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 41, home_team: 'Egypt', away_team: 'Iran', group_name: 'G', stage: 'group', match_date: '2026-06-27T03:00:00', venue: 'Seattle Stadium (Lumen Field)', home_odds: 2.3, draw_odds: 3.2, away_odds: 3.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 42, home_team: 'New Zealand', away_team: 'Belgium', group_name: 'G', stage: 'group', match_date: '2026-06-27T03:00:00', venue: 'BC Place, Vancouver', home_odds: 8.0, draw_odds: 4.5, away_odds: 1.4, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP H =====
    { id: 43, home_team: 'Spain', away_team: 'Cabo Verde', group_name: 'H', stage: 'group', match_date: '2026-06-15T16:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)', home_odds: 1.1, draw_odds: 9.0, away_odds: 25.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 44, home_team: 'Saudi Arabia', away_team: 'Uruguay', group_name: 'H', stage: 'group', match_date: '2026-06-15T22:00:00', venue: 'Miami Stadium (Hard Rock)', home_odds: 4.5, draw_odds: 3.5, away_odds: 1.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 45, home_team: 'Spain', away_team: 'Saudi Arabia', group_name: 'H', stage: 'group', match_date: '2026-06-21T16:00:00', venue: 'Atlanta Stadium (Mercedes-Benz)', home_odds: 1.2, draw_odds: 6.5, away_odds: 15.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 46, home_team: 'Uruguay', away_team: 'Cabo Verde', group_name: 'H', stage: 'group', match_date: '2026-06-21T22:00:00', venue: 'Miami Stadium (Hard Rock)', home_odds: 1.2, draw_odds: 6.0, away_odds: 14.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 47, home_team: 'Cabo Verde', away_team: 'Saudi Arabia', group_name: 'H', stage: 'group', match_date: '2026-06-27T00:00:00', venue: 'Houston Stadium (NRG)', home_odds: 3.0, draw_odds: 3.2, away_odds: 2.4, status: 'upcoming', home_score: null, away_score: null },
    { id: 48, home_team: 'Uruguay', away_team: 'Spain', group_name: 'H', stage: 'group', match_date: '2026-06-27T00:00:00', venue: 'Guadalajara Stadium (Estadio Akron)', home_odds: 3.5, draw_odds: 3.3, away_odds: 2.1, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP I =====
    { id: 49, home_team: 'France', away_team: 'Senegal', group_name: 'I', stage: 'group', match_date: '2026-06-16T19:00:00', venue: 'New York New Jersey Stadium (MetLife)', home_odds: 1.4, draw_odds: 4.5, away_odds: 7.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 50, home_team: 'Iraq', away_team: 'Norway', group_name: 'I', stage: 'group', match_date: '2026-06-16T22:00:00', venue: 'Boston Stadium (Gillette)', home_odds: 3.5, draw_odds: 3.3, away_odds: 2.1, status: 'upcoming', home_score: null, away_score: null },
    { id: 51, home_team: 'France', away_team: 'Iraq', group_name: 'I', stage: 'group', match_date: '2026-06-22T21:00:00', venue: 'Philadelphia Stadium (Lincoln Financial)', home_odds: 1.2, draw_odds: 6.5, away_odds: 14.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 52, home_team: 'Norway', away_team: 'Senegal', group_name: 'I', stage: 'group', match_date: '2026-06-23T00:00:00', venue: 'New York New Jersey Stadium (MetLife)', home_odds: 2.5, draw_odds: 3.2, away_odds: 2.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 53, home_team: 'Norway', away_team: 'France', group_name: 'I', stage: 'group', match_date: '2026-06-26T19:00:00', venue: 'Boston Stadium (Gillette)', home_odds: 5.0, draw_odds: 3.6, away_odds: 1.7, status: 'upcoming', home_score: null, away_score: null },
    { id: 54, home_team: 'Senegal', away_team: 'Iraq', group_name: 'I', stage: 'group', match_date: '2026-06-26T19:00:00', venue: 'Toronto Stadium (BMO Field)', home_odds: 1.7, draw_odds: 3.5, away_odds: 5.0, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP J =====
    { id: 55, home_team: 'Argentina', away_team: 'Algeria', group_name: 'J', stage: 'group', match_date: '2026-06-17T01:00:00', venue: 'Kansas City Stadium (Arrowhead)', home_odds: 1.3, draw_odds: 5.0, away_odds: 9.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 56, home_team: 'Austria', away_team: 'Jordan', group_name: 'J', stage: 'group', match_date: '2026-06-17T04:00:00', venue: 'San Francisco Bay Area Stadium (Levi\'s)', home_odds: 1.7, draw_odds: 3.6, away_odds: 5.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 57, home_team: 'Argentina', away_team: 'Austria', group_name: 'J', stage: 'group', match_date: '2026-06-22T17:00:00', venue: 'Dallas Stadium (AT&T)', home_odds: 1.4, draw_odds: 4.5, away_odds: 7.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 58, home_team: 'Jordan', away_team: 'Algeria', group_name: 'J', stage: 'group', match_date: '2026-06-23T03:00:00', venue: 'San Francisco Bay Area Stadium (Levi\'s)', home_odds: 3.0, draw_odds: 3.2, away_odds: 2.4, status: 'upcoming', home_score: null, away_score: null },
    { id: 59, home_team: 'Algeria', away_team: 'Austria', group_name: 'J', stage: 'group', match_date: '2026-06-28T02:00:00', venue: 'Kansas City Stadium (Arrowhead)', home_odds: 2.8, draw_odds: 3.2, away_odds: 2.5, status: 'upcoming', home_score: null, away_score: null },
    { id: 60, home_team: 'Jordan', away_team: 'Argentina', group_name: 'J', stage: 'group', match_date: '2026-06-28T02:00:00', venue: 'Dallas Stadium (AT&T)', home_odds: 12.0, draw_odds: 5.5, away_odds: 1.2, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP K =====
    { id: 61, home_team: 'Portugal', away_team: 'DR Congo', group_name: 'K', stage: 'group', match_date: '2026-06-17T17:00:00', venue: 'Houston Stadium (NRG)', home_odds: 1.3, draw_odds: 5.0, away_odds: 10.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 62, home_team: 'Uzbekistan', away_team: 'Colombia', group_name: 'K', stage: 'group', match_date: '2026-06-18T02:00:00', venue: 'Mexico City Stadium (Estadio Azteca)', home_odds: 5.0, draw_odds: 3.6, away_odds: 1.7, status: 'upcoming', home_score: null, away_score: null },
    { id: 63, home_team: 'Portugal', away_team: 'Uzbekistan', group_name: 'K', stage: 'group', match_date: '2026-06-23T17:00:00', venue: 'Houston Stadium (NRG)', home_odds: 1.2, draw_odds: 6.5, away_odds: 15.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 64, home_team: 'Colombia', away_team: 'DR Congo', group_name: 'K', stage: 'group', match_date: '2026-06-24T02:00:00', venue: 'Guadalajara Stadium (Estadio Akron)', home_odds: 1.4, draw_odds: 4.5, away_odds: 8.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 65, home_team: 'Colombia', away_team: 'Portugal', group_name: 'K', stage: 'group', match_date: '2026-06-27T23:30:00', venue: 'Miami Stadium (Hard Rock)', home_odds: 3.2, draw_odds: 3.3, away_odds: 2.2, status: 'upcoming', home_score: null, away_score: null },
    { id: 66, home_team: 'DR Congo', away_team: 'Uzbekistan', group_name: 'K', stage: 'group', match_date: '2026-06-27T23:30:00', venue: 'Atlanta Stadium (Mercedes-Benz)', home_odds: 2.3, draw_odds: 3.2, away_odds: 3.0, status: 'upcoming', home_score: null, away_score: null },

    // ===== GROUP L =====
    { id: 67, home_team: 'England', away_team: 'Croatia', group_name: 'L', stage: 'group', match_date: '2026-06-17T20:00:00', venue: 'Dallas Stadium (AT&T)', home_odds: 1.9, draw_odds: 3.4, away_odds: 4.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 68, home_team: 'Ghana', away_team: 'Panama', group_name: 'L', stage: 'group', match_date: '2026-06-17T23:00:00', venue: 'Toronto Stadium (BMO Field)', home_odds: 2.5, draw_odds: 3.2, away_odds: 2.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 69, home_team: 'England', away_team: 'Ghana', group_name: 'L', stage: 'group', match_date: '2026-06-23T20:00:00', venue: 'Boston Stadium (Gillette)', home_odds: 1.3, draw_odds: 5.0, away_odds: 10.0, status: 'upcoming', home_score: null, away_score: null },
    { id: 70, home_team: 'Panama', away_team: 'Croatia', group_name: 'L', stage: 'group', match_date: '2026-06-23T23:00:00', venue: 'Toronto Stadium (BMO Field)', home_odds: 4.5, draw_odds: 3.5, away_odds: 1.8, status: 'upcoming', home_score: null, away_score: null },
    { id: 71, home_team: 'Panama', away_team: 'England', group_name: 'L', stage: 'group', match_date: '2026-06-27T21:00:00', venue: 'New York New Jersey Stadium (MetLife)', home_odds: 10.0, draw_odds: 5.0, away_odds: 1.3, status: 'upcoming', home_score: null, away_score: null },
    { id: 72, home_team: 'Croatia', away_team: 'Ghana', group_name: 'L', stage: 'group', match_date: '2026-06-27T21:00:00', venue: 'Philadelphia Stadium (Lincoln Financial)', home_odds: 1.8, draw_odds: 3.5, away_odds: 4.5, status: 'upcoming', home_score: null, away_score: null },
  ],
  bets: [],
  nextId: { users: 3, matches: 73, bets: 1 }
};

fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

console.log(`✅ Seeded ${data.matches.length} matches (12 groups, all 72 group stage fixtures)`);
console.log(`✅ Seeded ${data.users.length} users`);
console.log('🏆 Database ready with real FIFA 2026 World Cup data!');
