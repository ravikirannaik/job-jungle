'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTimer, formatTime } from '@/hooks/useTimer';
import type { Player } from '@/lib/types';

export default function WorkerPage() {
  const { game, player, players, offers, hires, loading, setPlayer } = useGame();
  const remaining = useTimer(game?.round_end_at ?? null);
  const [wage, setWage] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // If player not found, try restoring from localStorage
  useEffect(() => {
    if (!loading && !player && game) {
      const savedId = localStorage.getItem('jj_player_id');
      if (savedId) {
        const found = players.find(p => p.id === savedId);
        if (found) setPlayer(found);
      }
    }
  }, [loading, player, game, players, setPlayer]);

  const employers = useMemo(
    () => players.filter(p => p.role === 'employer'),
    [players]
  );

  const currentRoundHires = useMemo(
    () => hires.filter(h => h.round === game?.current_round),
    [hires, game?.current_round]
  );

  const myHireThisRound = useMemo(
    () => player ? currentRoundHires.find(h => h.worker_id === player.id) : null,
    [currentRoundHires, player]
  );

  const myPendingOffer = useMemo(
    () => player ? offers.find(o => o.worker_id === player.id && o.status === 'pending') : null,
    [offers, player]
  );

  const myRejectedOffers = useMemo(
    () => player ? offers.filter(o => o.worker_id === player.id && o.status === 'rejected') : [],
    [offers, player]
  );

  // Hire history across all rounds
  const myHireHistory = useMemo(
    () => player ? hires.filter(h => h.worker_id === player.id).sort((a, b) => a.round - b.round) : [],
    [hires, player]
  );

  // Count hires per employer this round for display
  function getEmployerHireCount(empId: string) {
    return currentRoundHires.filter(h => h.employer_id === empId).length;
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!game) {
    return <div className="flex-1 flex items-center justify-center">Game not found</div>;
  }

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Session expired. Please rejoin the game.</p>
          <a href="/" className="text-blue-600 hover:underline">Go to home</a>
        </div>
      </div>
    );
  }

  // Redirect employers to employer page
  if (player.role === 'employer') {
    if (typeof window !== 'undefined') {
      window.location.href = `/game/${game.id}/employer`;
    }
    return null;
  }

  async function sendOffer() {
    if (!selectedEmployer || !wage || !player || !game) return;
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          workerId: player.id,
          employerId: selectedEmployer,
          wage: parseInt(wage),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send offer');
      } else {
        setWage('');
        setSelectedEmployer(null);
      }
    } catch {
      setError('Connection error');
    }
    setSending(false);
  }

  async function withdrawOffer() {
    if (!myPendingOffer) return;
    try {
      await fetch('/api/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: myPendingOffer.id, action: 'withdraw' }),
      });
    } catch {
      setError('Failed to withdraw');
    }
  }

  async function buyEducation() {
    if (!player || !game) return;
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, playerId: player.id }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Upgrade failed');
    } catch {
      alert('Connection error');
    }
  }

  async function becomeEmployer() {
    if (!player || !game) return;
    const firmName = prompt('Enter your firm name:');
    if (!firmName) return;
    try {
      const res = await fetch('/api/convert-to-employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, playerId: player.id, firmName }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Conversion failed');
      else window.location.href = `/game/${game.id}/employer`;
    } catch {
      alert('Connection error');
    }
  }

  const paAmount = player.skill === 'pink' ? game.pa_pink : game.pa_blue;

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b p-3 flex items-center justify-between">
        <div className="text-sm">
          {game.current_round > 0 ? (
            <span className="font-medium">Round {game.current_round}/{game.max_rounds}</span>
          ) : (
            <span className="text-gray-500">Waiting to start</span>
          )}
        </div>
        {game.status === 'round' && (
          <span className={`font-mono text-lg font-bold ${remaining <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatTime(remaining)}
          </span>
        )}
        <div className="text-right">
          <div className="text-lg font-bold">${player.balance}</div>
          <div className="text-xs text-gray-500">Balance</div>
        </div>
      </div>

      {/* Skill Badge */}
      <div className={`p-3 text-center text-white font-semibold text-sm ${
        player.skill === 'blue' ? 'bg-blue-500' : 'bg-pink-400'
      }`}>
        {player.skill === 'blue' ? 'BLUE CARD - Skilled' : 'PINK CARD - Unskilled'}
        <span className="ml-2 opacity-75">({player.name})</span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Game Status Messages */}
        {game.status === 'lobby' && (
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="font-medium">Waiting for the game to start...</p>
            <p className="text-sm text-gray-500 mt-1">Your endowment: ${player.endowment}</p>
          </div>
        )}

        {game.status === 'ended' && (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="font-bold text-lg">Game Over!</p>
            <p className="text-2xl font-bold mt-2">${player.balance}</p>
            <p className="text-sm text-gray-500">Final Balance</p>
            <div className="flex gap-2 justify-center mt-3">
              <a href={`/game/${game.id}/report/${player.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                My Report Card
              </a>
              <a href={`/game/${game.id}/results`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                View Results
              </a>
            </div>
          </div>
        )}

        {/* During Round — Main Action */}
        {game.status === 'round' && (
          <>
            {/* Hired */}
            {myHireThisRound && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                <p className="text-green-700 font-bold text-lg">Hired!</p>
                <p className="text-sm text-gray-600 mt-1">
                  {employers.find(e => e.id === myHireThisRound.employer_id)?.employer_firm_name} at ${myHireThisRound.wage}
                </p>
                <p className="text-xs text-gray-500 mt-2">Wait for the round to end.</p>
              </div>
            )}

            {/* Pending Offer */}
            {!myHireThisRound && myPendingOffer && (
              <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-orange-700">Offer Pending</p>
                    <p className="text-sm text-gray-600">
                      ${myPendingOffer.wage} to {employers.find(e => e.id === myPendingOffer.employer_id)?.employer_firm_name}
                    </p>
                  </div>
                  <button
                    onClick={withdrawOffer}
                    className="px-3 py-1 text-sm bg-orange-200 text-orange-800 rounded hover:bg-orange-300"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            )}

            {/* Rejected (flash) */}
            {!myHireThisRound && !myPendingOffer && myRejectedOffers.length > 0 && (
              <div className="p-2 bg-red-50 rounded text-center text-sm text-red-600">
                Last offer was rejected. Try again!
              </div>
            )}

            {/* Send Offer — only if not hired and no pending offer */}
            {!myHireThisRound && !myPendingOffer && (
              <div>
                <h3 className="font-semibold mb-2">Available Employers</h3>
                <div className="space-y-2">
                  {employers.map(emp => {
                    const hireCount = getEmployerHireCount(emp.id);
                    const isSelected = selectedEmployer === emp.id;
                    return (
                      <div key={emp.id}>
                        <button
                          onClick={() => setSelectedEmployer(isSelected ? null : emp.id)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{emp.employer_firm_name}</span>
                            <span className="text-xs text-gray-500">{hireCount} hired</span>
                          </div>
                        </button>

                        {isSelected && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 block mb-1">Your wage demand ($)</label>
                              <input
                                type="number"
                                min={0}
                                value={wage}
                                onChange={e => setWage(e.target.value)}
                                placeholder={`Min PA: $${paAmount}`}
                                className="w-full px-3 py-2 border rounded-lg text-lg"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={sendOffer}
                              disabled={sending || !wage || parseInt(wage) < 0}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium whitespace-nowrap"
                            >
                              {sending ? '...' : 'Send Offer'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

                <p className="text-xs text-gray-400 mt-3 text-center">
                  Tip: If no employer hires you, you get ${paAmount} Public Assistance.
                </p>
              </div>
            )}
          </>
        )}

        {/* Between Rounds — Upgrade Options */}
        {game.status === 'between_rounds' && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center text-sm">
              Waiting for Round {game.current_round + 1} to start...
            </div>

            {/* Education Upgrade */}
            {player.skill === 'pink' && player.balance >= game.education_cost && (
              <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <h4 className="font-semibold text-purple-800">Education Available</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Cost: ${game.education_cost} | Your balance: ${player.balance}
                </p>
                <p className="text-sm text-gray-600">
                  Upgrade from Pink to Blue — higher productivity, higher wages!
                </p>
                <button
                  onClick={buyEducation}
                  className="mt-3 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Buy Education (${game.education_cost})
                </button>
              </div>
            )}

            {/* Employer Entry */}
            {game.current_round >= game.employer_entry_after_round &&
             player.balance >= game.employer_entry_threshold && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <h4 className="font-semibold text-green-800">Become an Employer?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Balance: ${player.balance} (threshold: ${game.employer_entry_threshold})
                </p>
                <p className="text-sm text-gray-600">
                  Start your own firm! You cannot be a worker again.
                </p>
                <button
                  onClick={becomeEmployer}
                  className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Become Employer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hire History */}
        {myHireHistory.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-sm">Your History</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-1">Round</th>
                  <th className="p-1">Employer</th>
                  <th className="p-1">Wage</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: game.current_round }, (_, i) => i + 1).map(round => {
                  const hire = myHireHistory.find(h => h.round === round);
                  return (
                    <tr key={round} className="border-b">
                      <td className="p-1">{round}</td>
                      <td className="p-1">
                        {hire
                          ? employers.find(e => e.id === hire.employer_id)?.employer_firm_name || '?'
                          : <span className="text-gray-400">Unemployed (PA)</span>
                        }
                      </td>
                      <td className="p-1 font-medium">
                        {hire ? `$${hire.wage}` : `$${paAmount}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
