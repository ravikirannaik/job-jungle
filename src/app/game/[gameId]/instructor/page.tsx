'use client';

import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { FIRM_NAMES } from '@/lib/constants';
import { getPxMP, calculateRevenue } from '@/lib/game-logic';
import type { Player } from '@/lib/types';

export default function InstructorDashboard() {
  const { game, players, offers, hires, loading } = useGame();
  const remaining = useTimer(game?.round_end_at ?? null);
  const [selectedEmployers, setSelectedEmployers] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const workers = useMemo(() => players.filter(p => p.role === 'worker'), [players]);
  const employers = useMemo(() => players.filter(p => p.role === 'employer'), [players]);

  const currentRoundHires = useMemo(
    () => hires.filter(h => h.round === game?.current_round),
    [hires, game?.current_round]
  );

  const currentRoundOffers = useMemo(
    () => offers.filter(o => o.status === 'pending'),
    [offers]
  );

  const hiredWorkerIds = useMemo(
    () => new Set(currentRoundHires.map(h => h.worker_id)),
    [currentRoundHires]
  );

  if (loading || !game) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  async function apiCall(endpoint: string, body: object) {
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Connection error');
    }
    setActionLoading(false);
  }

  function toggleEmployer(playerId: string) {
    setSelectedEmployers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  async function assignRoles() {
    const empList = Array.from(selectedEmployers).map((id, i) => ({
      playerId: id,
      firmName: FIRM_NAMES[i] || `Firm ${i + 1}`,
    }));
    await apiCall('/api/instructor/assign-roles', { gameId: game!.id, employers: empList });
  }

  async function startRound() {
    await apiCall('/api/instructor/start-round', { gameId: game!.id });
  }

  async function endRound() {
    await apiCall('/api/instructor/end-round', { gameId: game!.id });
  }

  // Employer profit calculation for summary
  function getEmployerProfit(employerId: string) {
    const empHires = currentRoundHires.filter(h => h.employer_id === employerId);
    const revenue = empHires.reduce((sum, h) => sum + h.mp_value, 0);
    const wages = empHires.reduce((sum, h) => sum + h.wage, 0);
    return { revenue, wages, profit: revenue - wages, count: empHires.length };
  }

  return (
    <main className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Jungle</h1>
          <p className="text-gray-500 text-sm">Instructor Dashboard</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold tracking-[0.2em] bg-gray-100 px-4 py-2 rounded-lg">
            {game.room_code}
          </div>
          <p className="text-xs text-gray-500 mt-1">Room Code</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
        <StatusBadge status={game.status} />
        {game.current_round > 0 && (
          <span className="font-medium">Round {game.current_round} of {game.max_rounds}</span>
        )}
        {game.status === 'round' && (
          <span className={`font-mono text-xl font-bold ml-auto ${remaining <= 60 ? 'text-red-600' : ''}`}>
            {formatTime(remaining)}
          </span>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {players.length} players joined
        </span>
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {game.status === 'lobby' && (
          <>
            <button
              onClick={assignRoles}
              disabled={actionLoading || selectedEmployers.size === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              Assign {selectedEmployers.size} as Employers
            </button>
            <button
              onClick={startRound}
              disabled={actionLoading || employers.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              Start Round 1
            </button>
          </>
        )}

        {game.status === 'round' && (
          <button
            onClick={endRound}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            End Round {game.current_round}
          </button>
        )}

        {game.status === 'between_rounds' && (
          <>
            <button
              onClick={startRound}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              Start Round {game.current_round + 1}
            </button>
            {game.current_round >= game.max_rounds && (
              <button
                onClick={() => apiCall('/api/instructor/end-round', { gameId: game.id })}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
              >
                End Game
              </button>
            )}
          </>
        )}

        {game.status === 'ended' && (
          <a
            href={`/game/${game.id}/results`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            View Results
          </a>
        )}
      </div>

      {/* Round Activity (during active round) */}
      {game.status === 'round' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold mb-2">
            Round {game.current_round} Activity
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{currentRoundHires.length}</div>
              <div className="text-xs text-gray-500">Hired</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{currentRoundOffers.length}</div>
              <div className="text-xs text-gray-500">Pending Offers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">
                {workers.length - hiredWorkerIds.size}
              </div>
              <div className="text-xs text-gray-500">Looking</div>
            </div>
          </div>
        </div>
      )}

      {/* Employer Summary */}
      {employers.length > 0 && game.current_round > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Employers</h3>
          <div className="space-y-2">
            {employers.map(emp => {
              const stats = getEmployerProfit(emp.id);
              return (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm">
                  <span className="font-medium">{emp.employer_firm_name} ({emp.name})</span>
                  <div className="flex gap-4 text-gray-600">
                    <span>{stats.count} hired</span>
                    <span>Rev: ${stats.revenue}</span>
                    <span>Wages: ${stats.wages}</span>
                    <span className={stats.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      Profit: ${stats.profit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Roster */}
      <div>
        <h3 className="font-semibold mb-2">
          Players ({players.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {game.status === 'lobby' && <th className="p-2">Employer?</th>}
                <th className="p-2">Name</th>
                <th className="p-2">Role</th>
                <th className="p-2">Skill</th>
                <th className="p-2">Endowment</th>
                <th className="p-2">Balance</th>
                {game.status === 'round' && <th className="p-2">Status</th>}
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  {game.status === 'lobby' && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedEmployers.has(p.id) || p.role === 'employer'}
                        onChange={() => toggleEmployer(p.id)}
                        className="w-4 h-4"
                      />
                    </td>
                  )}
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.role === 'employer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {p.role === 'employer' ? p.employer_firm_name || 'Employer' : 'Worker'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.skill === 'blue' ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'
                    }`}>
                      {p.skill === 'blue' ? 'Blue (Skilled)' : 'Pink (Unskilled)'}
                    </span>
                  </td>
                  <td className="p-2">${p.endowment}</td>
                  <td className="p-2 font-medium">${p.balance}</td>
                  {game.status === 'round' && (
                    <td className="p-2">
                      {p.role === 'worker' ? (
                        hiredWorkerIds.has(p.id) ? (
                          <span className="text-green-600 font-medium">Hired</span>
                        ) : (
                          <span className="text-orange-500">Looking</span>
                        )
                      ) : (
                        <span className="text-blue-600">
                          {currentRoundHires.filter(h => h.employer_id === p.id).length} hired
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    lobby: 'bg-yellow-100 text-yellow-800',
    round: 'bg-green-100 text-green-800',
    between_rounds: 'bg-blue-100 text-blue-800',
    ended: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    lobby: 'Lobby',
    round: 'Round Active',
    between_rounds: 'Between Rounds',
    ended: 'Game Ended',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
