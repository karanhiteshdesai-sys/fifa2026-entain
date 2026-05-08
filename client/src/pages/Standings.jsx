import { useState, useEffect } from 'react';
import api from '../services/api';

function Standings() {
  const [matches, setMatches] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data } = await api.get('/matches');
        setMatches(data);
      } catch (err) {
        console.error('Failed to fetch matches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();

    // Auto-refresh every 60 seconds for live updates
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  const groups = [...new Set(matches.map(m => m.group_name))].filter(Boolean).sort();

  const calculateStandings = (groupName) => {
    const groupMatches = matches.filter(m => m.group_name === groupName && m.status === 'finished');
    const teams = [...new Set(
      matches.filter(m => m.group_name === groupName).flatMap(m => [m.home_team, m.away_team])
    )];

    const standings = teams.map(team => {
      const stats = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };

      groupMatches.forEach(match => {
        if (match.home_team === team) {
          stats.played++;
          stats.gf += match.home_score;
          stats.ga += match.away_score;
          if (match.home_score > match.away_score) { stats.won++; stats.points += 3; }
          else if (match.home_score === match.away_score) { stats.drawn++; stats.points += 1; }
          else { stats.lost++; }
        } else if (match.away_team === team) {
          stats.played++;
          stats.gf += match.away_score;
          stats.ga += match.home_score;
          if (match.away_score > match.home_score) { stats.won++; stats.points += 3; }
          else if (match.away_score === match.home_score) { stats.drawn++; stats.points += 1; }
          else { stats.lost++; }
        }
      });

      stats.gd = stats.gf - stats.ga;
      return stats;
    });

    // Sort: points desc, then GD desc, then GF desc
    return standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading standings...</div>;
  }

  const standings = calculateStandings(selectedGroup);
  const groupMatches = matches.filter(m => m.group_name === selectedGroup);
  const finishedMatches = groupMatches.filter(m => m.status === 'finished');
  const upcomingMatches = groupMatches.filter(m => m.status === 'upcoming');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🏆 Group Standings</h2>
        <p className="text-gray-400 text-xs">Auto-refreshes every 60s</p>
      </div>

      {/* Group Selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedGroup === g ? 'bg-entain-accent text-entain-dark' : 'bg-entain-navy text-gray-300 hover:text-white'
            }`}
          >
            Group {g}
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="bg-entain-navy rounded-xl border border-entain-blue/20 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-entain-blue/20">
          <h3 className="text-white font-semibold">Group {selectedGroup}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-entain-blue/20 text-xs">
              <th className="text-left text-gray-400 px-5 py-2 w-8">#</th>
              <th className="text-left text-gray-400 px-3 py-2">Team</th>
              <th className="text-center text-gray-400 px-2 py-2">P</th>
              <th className="text-center text-gray-400 px-2 py-2">W</th>
              <th className="text-center text-gray-400 px-2 py-2">D</th>
              <th className="text-center text-gray-400 px-2 py-2">L</th>
              <th className="text-center text-gray-400 px-2 py-2">GF</th>
              <th className="text-center text-gray-400 px-2 py-2">GA</th>
              <th className="text-center text-gray-400 px-2 py-2">GD</th>
              <th className="text-center text-gray-400 px-2 py-2 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr
                key={team.team}
                className={`border-b border-entain-blue/10 ${
                  index < 2 ? 'bg-entain-green/5' : index === 2 ? 'bg-yellow-500/5' : ''
                }`}
              >
                <td className="px-5 py-3 text-gray-400 text-sm">{index + 1}</td>
                <td className="px-3 py-3 text-white font-medium text-sm">{team.team}</td>
                <td className="text-center text-gray-300 text-sm">{team.played}</td>
                <td className="text-center text-gray-300 text-sm">{team.won}</td>
                <td className="text-center text-gray-300 text-sm">{team.drawn}</td>
                <td className="text-center text-gray-300 text-sm">{team.lost}</td>
                <td className="text-center text-gray-300 text-sm">{team.gf}</td>
                <td className="text-center text-gray-300 text-sm">{team.ga}</td>
                <td className="text-center text-sm">
                  <span className={team.gd > 0 ? 'text-entain-green' : team.gd < 0 ? 'text-entain-red' : 'text-gray-400'}>
                    {team.gd > 0 ? '+' : ''}{team.gd}
                  </span>
                </td>
                <td className="text-center text-white font-bold text-sm">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-2 border-t border-entain-blue/10 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-entain-green/50"></span> Qualifies automatically</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500/50"></span> Possible 3rd place qualifier</span>
        </div>
      </div>

      {/* Match Results */}
      {finishedMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-3">Results</h3>
          <div className="space-y-2">
            {finishedMatches.map(match => (
              <div key={match.id} className="bg-entain-navy rounded-lg p-3 border border-entain-blue/20 flex items-center justify-between">
                <span className="text-white text-sm w-28 text-right">{match.home_team}</span>
                <span className="text-white font-bold text-lg mx-4">{match.home_score} - {match.away_score}</span>
                <span className="text-white text-sm w-28">{match.away_team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcomingMatches.map(match => (
              <div key={match.id} className="bg-entain-navy/50 rounded-lg p-3 border border-entain-blue/10 flex items-center justify-between">
                <span className="text-gray-300 text-sm w-28 text-right">{match.home_team}</span>
                <div className="text-center mx-4">
                  <span className="text-gray-500 text-xs">
                    {new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <span className="text-gray-300 text-sm w-28">{match.away_team}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Standings;
