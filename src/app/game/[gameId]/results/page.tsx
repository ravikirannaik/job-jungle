'use client';

import { useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PINK_PxMP, BLUE_PxMP, KITE_PRICE } from '@/lib/constants';
import { findByName } from '@/lib/roster';
import type { Hire, Player } from '@/lib/types';

export default function ResultsPage() {
  const { game, players, hires, loading } = useGame();

  const workers = useMemo(() => players.filter(p => p.role === 'worker' || p.became_employer_round), [players]);
  const employers = useMemo(() => players.filter(p => p.role === 'employer'), [players]);

  // --- Data for charts ---

  // 1. Wage convergence by round
  const wageByRound = useMemo(() => {
    if (!game) return [];
    const rounds = Array.from({ length: game.current_round }, (_, i) => i + 1);
    return rounds.map(round => {
      const roundHires = hires.filter(h => h.round === round);
      const pinkHires = roundHires.filter(h => h.worker_skill === 'pink');
      const blueHires = roundHires.filter(h => h.worker_skill === 'blue');
      const avgPink = pinkHires.length > 0
        ? Math.round(pinkHires.reduce((s, h) => s + h.wage, 0) / pinkHires.length)
        : null;
      const avgBlue = blueHires.length > 0
        ? Math.round(blueHires.reduce((s, h) => s + h.wage, 0) / blueHires.length)
        : null;
      return { round, avgPink, avgBlue, hires: roundHires.length };
    });
  }, [hires, game]);

  // 2. Skill premium by round
  const skillPremium = useMemo(() => {
    return wageByRound.map(d => ({
      round: d.round,
      premium: d.avgBlue !== null && d.avgPink !== null ? d.avgBlue - d.avgPink : null,
    }));
  }, [wageByRound]);

  // 3. Employer profit by round
  const employerProfitData = useMemo(() => {
    if (!game) return [];
    const rounds = Array.from({ length: game.current_round }, (_, i) => i + 1);
    return rounds.map(round => {
      const entry: Record<string, number | string> = { round };
      for (const emp of employers) {
        const empHires = hires.filter(h => h.employer_id === emp.id && h.round === round);
        const revenue = empHires.reduce((s, h) => s + h.mp_value, 0);
        const wages = empHires.reduce((s, h) => s + h.wage, 0);
        entry[emp.employer_firm_name || emp.name] = revenue - wages;
      }
      return entry;
    });
  }, [hires, employers, game]);

  // 4. Endowment vs final income (workers only)
  const endowmentVsIncome = useMemo(() => {
    return workers.map(w => ({
      name: w.name,
      endowment: w.endowment,
      balance: w.balance,
      skill: w.skill,
    }));
  }, [workers]);

  // 5. Unemployment rate by round
  const unemploymentData = useMemo(() => {
    if (!game) return [];
    const rounds = Array.from({ length: game.current_round }, (_, i) => i + 1);
    return rounds.map(round => {
      const roundWorkers = players.filter(p =>
        p.role === 'worker' || (p.became_employer_round && p.became_employer_round > round)
      );
      const roundHires = hires.filter(h => h.round === round);
      const hiredIds = new Set(roundHires.map(h => h.worker_id));
      const unemployed = roundWorkers.filter(w => !hiredIds.has(w.id)).length;
      const total = roundWorkers.length;
      return {
        round,
        rate: total > 0 ? Math.round((unemployed / total) * 100) : 0,
        unemployed,
        total,
      };
    });
  }, [hires, players, game]);

  // 6. Leaderboards
  const workerLeaderboard = useMemo(
    () => [...workers].sort((a, b) => b.balance - a.balance),
    [workers]
  );

  const employerLeaderboard = useMemo(() => {
    return employers.map(emp => {
      const empHires = hires.filter(h => h.employer_id === emp.id);
      const totalRevenue = empHires.reduce((s, h) => s + h.mp_value, 0);
      const totalWages = empHires.reduce((s, h) => s + h.wage, 0);
      return { ...emp, profit: totalRevenue - totalWages };
    }).sort((a, b) => b.profit - a.profit);
  }, [employers, hires]);

  // CSV Export
  function exportCSV() {
    const rows = [['Round', 'Worker', 'Skill', 'Employer', 'Wage', 'MP_Value', 'Hire_Order']];
    for (const h of hires) {
      const w = players.find(p => p.id === h.worker_id);
      const e = players.find(p => p.id === h.employer_id);
      rows.push([
        String(h.round),
        w?.name || '',
        h.worker_skill,
        e?.employer_firm_name || e?.name || '',
        String(h.wage),
        String(h.mp_value),
        String(h.hire_order),
      ]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-jungle-${game?.room_code}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !game) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  const empColors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

  return (
    <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Game Results</h1>
          <p className="text-gray-500 text-sm">Room {game.room_code} | {game.current_round} rounds</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-2">Top Workers</h2>
          <div className="space-y-1">
            {workerLeaderboard.slice(0, 10).map((w, i) => (
              <div key={w.id} className={`flex justify-between p-2 rounded text-sm ${
                i === 0 ? 'bg-yellow-100 font-bold' : 'bg-gray-50'
              }`}>
                <span>
                  {i + 1}. {w.name}
                  <span className={`ml-1 text-xs ${w.skill === 'blue' ? 'text-blue-600' : 'text-pink-600'}`}>
                    ({w.skill})
                  </span>
                </span>
                <span>${w.balance}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold mb-2">Top Employers</h2>
          <div className="space-y-1">
            {employerLeaderboard.map((e, i) => (
              <div key={e.id} className={`flex justify-between p-2 rounded text-sm ${
                i === 0 ? 'bg-yellow-100 font-bold' : 'bg-gray-50'
              }`}>
                <span>{i + 1}. {e.employer_firm_name} ({e.name})</span>
                <span>${e.profit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 1: Wage Convergence */}
      <div>
        <h2 className="font-bold mb-2">Wage Convergence</h2>
        <p className="text-xs text-gray-500 mb-2">Average wage by round vs P x MP reference</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={wageByRound}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" label={{ value: 'Round', position: 'bottom' }} />
            <YAxis label={{ value: 'Wage ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={PINK_PxMP[0]} stroke="#f472b6" strokeDasharray="5 5" label="Pink 1st MP" />
            <ReferenceLine y={BLUE_PxMP[0]} stroke="#60a5fa" strokeDasharray="5 5" label="Blue 1st MP" />
            <Line type="monotone" dataKey="avgPink" stroke="#ec4899" strokeWidth={2} name="Avg Pink Wage" connectNulls />
            <Line type="monotone" dataKey="avgBlue" stroke="#3b82f6" strokeWidth={2} name="Avg Blue Wage" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Skill Premium */}
      <div>
        <h2 className="font-bold mb-2">Skill Premium (Blue - Pink)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={skillPremium}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis label={{ value: 'Premium ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="premium" fill="#8b5cf6" name="Wage Premium" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: Employer Profit */}
      <div>
        <h2 className="font-bold mb-2">Employer Profit Trajectory</h2>
        <p className="text-xs text-gray-500 mb-2">Should decline with entry after Round 3</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={employerProfitData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={0} stroke="#999" />
            {employers.map((emp, i) => (
              <Line
                key={emp.id}
                type="monotone"
                dataKey={emp.employer_firm_name || emp.name}
                stroke={empColors[i % empColors.length]}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 4: Endowment vs Final Income */}
      <div>
        <h2 className="font-bold mb-2">Endowment vs Final Income</h2>
        <p className="text-xs text-gray-500 mb-2">Does starting inequality persist?</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endowment" name="Endowment" label={{ value: 'Endowment ($)', position: 'bottom' }} />
            <YAxis dataKey="balance" name="Final Balance" label={{ value: 'Final Income ($)', angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={endowmentVsIncome.filter(d => d.skill === 'pink')}
              fill="#ec4899"
              name="Pink"
            />
            <Scatter
              data={endowmentVsIncome.filter(d => d.skill === 'blue')}
              fill="#3b82f6"
              name="Blue"
            />
            <Legend />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 5: Unemployment Rate */}
      <div>
        <h2 className="font-bold mb-2">Unemployment Rate</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={unemploymentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="rate" fill="#f59e0b" name="Unemployment %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Report Cards */}
      <div>
        <h2 className="font-bold mb-2">Report Cards</h2>
        <p className="text-xs text-gray-500 mb-3">Click any name to view their personalized round-by-round report card.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[...workerLeaderboard, ...employerLeaderboard].map(p => {
            const roster = findByName(p.name);
            return (
              <a
                key={p.id}
                href={`/game/${game.id}/report/${p.id}`}
                target="_blank"
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 text-sm transition-colors"
              >
                <span className="truncate">
                  {p.name}
                  {roster && <span className="text-gray-400 ml-1 text-xs">({roster.studentId})</span>}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  p.role === 'employer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {p.role === 'employer' ? 'Emp' : p.skill === 'blue' ? 'Blue' : 'Pink'}
                </span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Full Transaction Log */}
      <div>
        <h2 className="font-bold mb-2">All Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left bg-gray-50">
                <th className="p-2">Round</th>
                <th className="p-2">Worker</th>
                <th className="p-2">Skill</th>
                <th className="p-2">Employer</th>
                <th className="p-2">Wage</th>
                <th className="p-2">P x MP</th>
                <th className="p-2">Surplus</th>
              </tr>
            </thead>
            <tbody>
              {hires.map(h => {
                const w = players.find(p => p.id === h.worker_id);
                const e = players.find(p => p.id === h.employer_id);
                return (
                  <tr key={h.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{h.round}</td>
                    <td className="p-2">{w?.name}</td>
                    <td className="p-2">
                      <span className={h.worker_skill === 'blue' ? 'text-blue-600' : 'text-pink-600'}>
                        {h.worker_skill}
                      </span>
                    </td>
                    <td className="p-2">{e?.employer_firm_name}</td>
                    <td className="p-2 font-medium">${h.wage}</td>
                    <td className="p-2">${h.mp_value}</td>
                    <td className="p-2">
                      <span className={h.mp_value - h.wage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${h.mp_value - h.wage}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
