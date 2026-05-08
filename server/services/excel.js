const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join(__dirname, '..', 'db', 'fifa2026_data.xlsx');

async function generateExcel() {
  const db = require('../db/database');
  const data = db.getData();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FIFA 2026 Predictions - Entain';
  workbook.created = new Date();

  // ===== SHEET 1: Users =====
  const usersSheet = workbook.addWorksheet('Users', {
    properties: { tabColor: { argb: '00D4AA' } }
  });

  usersSheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Role', key: 'role', width: 10 },
    { header: 'Points Balance', key: 'points', width: 15 },
    { header: 'Registered At', key: 'created_at', width: 22 },
  ];

  // Style header row
  usersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  usersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };

  data.users.forEach(user => {
    usersSheet.addRow({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      created_at: user.created_at
    });
  });

  // ===== SHEET 2: Bets =====
  const betsSheet = workbook.addWorksheet('Bets', {
    properties: { tabColor: { argb: 'FFD700' } }
  });

  betsSheet.columns = [
    { header: 'Bet ID', key: 'id', width: 8 },
    { header: 'User', key: 'user_name', width: 20 },
    { header: 'Email', key: 'user_email', width: 35 },
    { header: 'Match', key: 'match', width: 30 },
    { header: 'Group', key: 'group', width: 8 },
    { header: 'Prediction', key: 'prediction', width: 12 },
    { header: 'Stake (EP)', key: 'stake', width: 12 },
    { header: 'Odds', key: 'odds', width: 8 },
    { header: 'Potential Payout', key: 'potential_payout', width: 16 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Actual Payout', key: 'payout', width: 14 },
    { header: 'Placed At', key: 'created_at', width: 22 },
  ];

  betsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  betsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };

  data.bets.forEach(bet => {
    const user = data.users.find(u => u.id === bet.user_id);
    const match = data.matches.find(m => m.id === bet.match_id);

    const row = betsSheet.addRow({
      id: bet.id,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || 'Unknown',
      match: match ? `${match.home_team} vs ${match.away_team}` : 'Unknown',
      group: match?.group_name || '',
      prediction: bet.prediction,
      stake: bet.stake,
      odds: bet.odds,
      potential_payout: Math.round(bet.stake * bet.odds),
      status: bet.status,
      payout: bet.payout,
      created_at: bet.created_at
    });

    // Color code status
    const statusCell = row.getCell('status');
    if (bet.status === 'won') {
      statusCell.font = { color: { argb: '00C853' }, bold: true };
    } else if (bet.status === 'lost') {
      statusCell.font = { color: { argb: 'FF5252' }, bold: true };
    } else {
      statusCell.font = { color: { argb: 'FFA000' } };
    }
  });

  // ===== SHEET 3: Matches =====
  const matchesSheet = workbook.addWorksheet('Matches', {
    properties: { tabColor: { argb: '0F3460' } }
  });

  matchesSheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Home Team', key: 'home_team', width: 18 },
    { header: 'Away Team', key: 'away_team', width: 18 },
    { header: 'Group', key: 'group_name', width: 8 },
    { header: 'Date', key: 'match_date', width: 20 },
    { header: 'Venue', key: 'venue', width: 35 },
    { header: 'Home Odds', key: 'home_odds', width: 11 },
    { header: 'Draw Odds', key: 'draw_odds', width: 11 },
    { header: 'Away Odds', key: 'away_odds', width: 11 },
    { header: 'Status', key: 'status', width: 10 },
    { header: 'Score', key: 'score', width: 10 },
  ];

  matchesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  matchesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };

  data.matches.forEach(match => {
    matchesSheet.addRow({
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      group_name: match.group_name,
      match_date: match.match_date,
      venue: match.venue,
      home_odds: match.home_odds,
      draw_odds: match.draw_odds,
      away_odds: match.away_odds,
      status: match.status,
      score: match.status === 'finished' ? `${match.home_score} - ${match.away_score}` : '-'
    });
  });

  // ===== SHEET 4: Leaderboard =====
  const leaderboardSheet = workbook.addWorksheet('Leaderboard', {
    properties: { tabColor: { argb: 'FFD700' } }
  });

  leaderboardSheet.columns = [
    { header: 'Rank', key: 'rank', width: 8 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Points', key: 'points', width: 12 },
    { header: 'Total Bets', key: 'total_bets', width: 12 },
    { header: 'Won', key: 'won', width: 8 },
    { header: 'Lost', key: 'lost', width: 8 },
    { header: 'Win Rate', key: 'win_rate', width: 10 },
    { header: 'Total Winnings', key: 'total_winnings', width: 15 },
  ];

  leaderboardSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  leaderboardSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };

  const leaderboard = db.getLeaderboard();
  leaderboard.forEach((player, index) => {
    leaderboardSheet.addRow({
      rank: index + 1,
      name: player.name,
      email: data.users.find(u => u.id === player.id)?.email || '',
      points: player.points,
      total_bets: player.total_bets,
      won: player.bets_won,
      lost: player.bets_lost,
      win_rate: player.total_bets > 0 ? `${Math.round((player.bets_won / player.total_bets) * 100)}%` : '0%',
      total_winnings: player.total_winnings || 0
    });
  });

  // Save the file
  await workbook.xlsx.writeFile(EXCEL_PATH);
  return EXCEL_PATH;
}

module.exports = { generateExcel, EXCEL_PATH };
