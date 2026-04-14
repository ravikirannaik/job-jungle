'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import { findByName } from '@/lib/roster';
import { PINK_PxMP, BLUE_PxMP, KITE_PRICE } from '@/lib/constants';
import type { Hire, Player } from '@/lib/types';

export default function ReportCardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const { game, players, hires, loading } = useGame();

  const player = useMemo(
    () => players.find(p => p.id === playerId),
    [players, playerId]
  );

  const rosterEntry = useMemo(
    () => player ? findByName(player.name) : undefined,
    [player]
  );

  const allPlayers = players;

  // ─── Worker Report Data ───
  const workerHires = useMemo(
    () => player ? hires.filter(h => h.worker_id === player.id).sort((a, b) => a.round - b.round) : [],
    [hires, player]
  );

  const workerRoundData = useMemo(() => {
    if (!game || !player || player.role === 'employer') return [];
    return Array.from({ length: game.current_round }, (_, i) => {
      const round = i + 1;
      const hire = workerHires.find(h => h.round === round);
      const employer = hire ? allPlayers.find(p => p.id === hire.employer_id) : null;
      const paAmount = player.skill === 'blue' ? game.pa_blue : game.pa_pink;
      return {
        round,
        hired: !!hire,
        employer: employer?.employer_firm_name || null,
        wage: hire?.wage ?? null,
        mpValue: hire?.mp_value ?? null,
        pa: !hire ? paAmount : 0,
        income: hire ? hire.wage : paAmount,
        skill: hire?.worker_skill || player.skill,
      };
    });
  }, [game, player, workerHires, allPlayers]);

  // ─── Employer Report Data ───
  const employerHires = useMemo(
    () => player ? hires.filter(h => h.employer_id === player.id).sort((a, b) => a.round - b.round || a.hire_order - b.hire_order) : [],
    [hires, player]
  );

  const employerRoundData = useMemo(() => {
    if (!game || !player || player.role !== 'employer') return [];
    return Array.from({ length: game.current_round }, (_, i) => {
      const round = i + 1;
      const roundHires = employerHires.filter(h => h.round === round);
      const revenue = roundHires.reduce((s, h) => s + h.mp_value, 0);
      const wages = roundHires.reduce((s, h) => s + h.wage, 0);
      return {
        round,
        hires: roundHires.map(h => ({
          workerName: allPlayers.find(p => p.id === h.worker_id)?.name || '?',
          skill: h.worker_skill,
          wage: h.wage,
          mpValue: h.mp_value,
          surplus: h.mp_value - h.wage,
        })),
        revenue,
        wages,
        profit: revenue - wages,
        hireCount: roundHires.length,
      };
    });
  }, [game, player, employerHires, allPlayers]);

  // ─── Rankings ───
  const workers = useMemo(() => allPlayers.filter(p => p.role === 'worker' || p.became_employer_round), [allPlayers]);
  const employers = useMemo(() => allPlayers.filter(p => p.role === 'employer'), [allPlayers]);

  const workerRank = useMemo(() => {
    if (!player || player.role === 'employer') return null;
    const sorted = [...workers].sort((a, b) => b.balance - a.balance);
    return sorted.findIndex(w => w.id === player.id) + 1;
  }, [workers, player]);

  const employerRank = useMemo(() => {
    if (!player || player.role !== 'employer') return null;
    const withProfit = employers.map(emp => {
      const empHires = hires.filter(h => h.employer_id === emp.id);
      const profit = empHires.reduce((s, h) => s + h.mp_value - h.wage, 0);
      return { id: emp.id, profit };
    }).sort((a, b) => b.profit - a.profit);
    return withProfit.findIndex(e => e.id === player.id) + 1;
  }, [employers, hires, player]);

  // ─── Summary Stats ───
  const workerStats = useMemo(() => {
    if (!workerRoundData.length) return null;
    const timesHired = workerRoundData.filter(r => r.hired).length;
    const timesUnemployed = workerRoundData.filter(r => !r.hired).length;
    const totalIncome = workerRoundData.reduce((s, r) => s + r.income, 0);
    const avgWage = timesHired > 0
      ? Math.round(workerRoundData.filter(r => r.hired).reduce((s, r) => s + (r.wage || 0), 0) / timesHired)
      : 0;
    return { timesHired, timesUnemployed, totalIncome, avgWage };
  }, [workerRoundData]);

  const employerStats = useMemo(() => {
    if (!employerRoundData.length) return null;
    const totalRevenue = employerRoundData.reduce((s, r) => s + r.revenue, 0);
    const totalWages = employerRoundData.reduce((s, r) => s + r.wages, 0);
    const totalProfit = totalRevenue - totalWages;
    const totalHires = employerRoundData.reduce((s, r) => s + r.hireCount, 0);
    const avgWagePaid = totalHires > 0 ? Math.round(totalWages / totalHires) : 0;
    return { totalRevenue, totalWages, totalProfit, totalHires, avgWagePaid };
  }, [employerRoundData]);

  if (loading || !game) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!player) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Player not found.</div>;
  }

  const isWorker = player.role === 'worker';

  return (
    <main className="flex-1 p-4 max-w-2xl mx-auto w-full print:max-w-none print:p-8">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Jungle Report Card</h1>
            <p className="text-sm text-gray-500">ECON207 Labour Market Simulation</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-500">Name</div>
          <div className="font-semibold">{player.name}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Student ID</div>
          <div className="font-semibold">{rosterEntry?.studentId || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Email</div>
          <div className="text-sm">{rosterEntry?.email || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Role</div>
          <div className="font-semibold">
            {isWorker ? (
              <span className={player.skill === 'blue' ? 'text-blue-600' : 'text-pink-600'}>
                Worker ({player.skill === 'blue' ? 'Skilled' : 'Unskilled'})
              </span>
            ) : (
              <span className="text-blue-700">Employer — {player.employer_firm_name}</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Starting Endowment</div>
          <div className="font-semibold">${player.endowment}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Room Code</div>
          <div className="font-mono font-semibold">{game.room_code}</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 border-b pb-1">Performance Summary</h2>
        {isWorker && workerStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Final Balance" value={`$${player.balance}`} highlight />
            <StatCard label="Avg Wage" value={`$${workerStats.avgWage}`} />
            <StatCard label="Times Hired" value={`${workerStats.timesHired}/${game.current_round}`} />
            <StatCard label="Rank" value={`#${workerRank} of ${workers.length}`} />
          </div>
        )}
        {!isWorker && employerStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Profit" value={`$${employerStats.totalProfit}`} highlight />
            <StatCard label="Total Revenue" value={`$${employerStats.totalRevenue}`} />
            <StatCard label="Total Wages Paid" value={`$${employerStats.totalWages}`} />
            <StatCard label="Rank" value={`#${employerRank} of ${employers.length}`} />
          </div>
        )}
      </div>

      {/* Round-by-Round Detail */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 border-b pb-1">Round-by-Round Performance</h2>

        {isWorker && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-left bg-gray-50">
                <th className="p-2">Round</th>
                <th className="p-2">Status</th>
                <th className="p-2">Employer</th>
                <th className="p-2">Wage</th>
                <th className="p-2">P x MP</th>
                <th className="p-2">Income</th>
              </tr>
            </thead>
            <tbody>
              {workerRoundData.map(r => (
                <tr key={r.round} className="border-b">
                  <td className="p-2 font-medium">R{r.round}</td>
                  <td className="p-2">
                    {r.hired ? (
                      <span className="text-green-600 font-medium">Hired</span>
                    ) : (
                      <span className="text-orange-500">Unemployed</span>
                    )}
                  </td>
                  <td className="p-2">{r.employer || <span className="text-gray-400">—</span>}</td>
                  <td className="p-2">{r.wage !== null ? `$${r.wage}` : '—'}</td>
                  <td className="p-2 text-gray-500">{r.mpValue !== null ? `$${r.mpValue}` : '—'}</td>
                  <td className="p-2 font-medium">${r.income}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-bold">
                <td className="p-2" colSpan={5}>Total Earnings</td>
                <td className="p-2">${workerStats?.totalIncome || 0}</td>
              </tr>
              <tr className="font-bold text-lg">
                <td className="p-2" colSpan={5}>Final Balance (Endowment + Earnings)</td>
                <td className="p-2 text-green-600">${player.balance}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {!isWorker && employerRoundData.map(r => (
          <div key={r.round} className="mb-4">
            <div className="flex items-center justify-between bg-blue-50 p-2 rounded-t font-medium text-sm">
              <span>Round {r.round}</span>
              <span className={r.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                Profit: ${r.profit}
              </span>
            </div>
            {r.hires.length > 0 ? (
              <table className="w-full text-sm border border-t-0">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="p-1.5">Worker</th>
                    <th className="p-1.5">Skill</th>
                    <th className="p-1.5">Wage</th>
                    <th className="p-1.5">P x MP</th>
                    <th className="p-1.5">Surplus</th>
                  </tr>
                </thead>
                <tbody>
                  {r.hires.map((h, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-1.5">{h.workerName}</td>
                      <td className="p-1.5">
                        <span className={h.skill === 'blue' ? 'text-blue-600' : 'text-pink-600'}>
                          {h.skill}
                        </span>
                      </td>
                      <td className="p-1.5">${h.wage}</td>
                      <td className="p-1.5 text-gray-500">${h.mpValue}</td>
                      <td className={`p-1.5 font-medium ${h.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${h.surplus}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium text-xs">
                    <td className="p-1.5" colSpan={2}>Round Total</td>
                    <td className="p-1.5">${r.wages}</td>
                    <td className="p-1.5">${r.revenue}</td>
                    <td className={`p-1.5 ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${r.profit}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <div className="border border-t-0 p-2 text-sm text-gray-400 text-center">
                No hires this round
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Economics Takeaways */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg print:break-before-auto">
        <h2 className="font-bold text-sm mb-2">Key Economics Concepts Demonstrated</h2>
        <ul className="text-xs space-y-1 text-gray-700">
          {isWorker ? (
            <>
              <li><strong>Wage = P x MP in equilibrium:</strong> Your wages should converge toward the employer&apos;s marginal product value over rounds.</li>
              <li><strong>Skill premium:</strong> Blue (skilled) workers earn higher wages reflecting higher productivity.</li>
              <li><strong>Human capital investment:</strong> Education costs $25 but raises your MP schedule permanently.</li>
              <li><strong>Public assistance:</strong> Unemployed workers receive PA (${game.pa_pink} pink / ${game.pa_blue} blue) — the reservation wage floor.</li>
            </>
          ) : (
            <>
              <li><strong>Diminishing marginal product:</strong> Each additional hire produces fewer kites — hiring should stop when W &gt; P x MP.</li>
              <li><strong>Profit maximization:</strong> Hire until Wage = P x MP. Surplus declines with each additional worker.</li>
              <li><strong>Labour demand curve:</strong> The MP schedule is your demand curve — it determines max wage for each hire.</li>
              <li><strong>Market entry:</strong> New firms enter when profits are high, driving wages up and profits down.</li>
            </>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t pt-4">
        <p>ECON207 Labour Economics | Prof. Ravikiran Naik | FLAME University</p>
        <p>Generated from Job Jungle game {game.room_code} | {game.current_round} rounds</p>
      </div>
    </main>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg text-center ${highlight ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50'}`}>
      <div className={`text-xl font-bold ${highlight ? 'text-green-700' : ''}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
