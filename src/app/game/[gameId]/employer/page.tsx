'use client';

import { useMemo, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { getPxMP } from '@/lib/game-logic';
import { PINK_PxMP, BLUE_PxMP, PINK_KITES, BLUE_KITES, KITE_PRICE } from '@/lib/constants';

export default function EmployerPage() {
  const { game, player, players, offers, hires, loading, setPlayer } = useGame();
  const remaining = useTimer(game?.round_end_at ?? null);

  // Restore player from localStorage
  useEffect(() => {
    if (!loading && !player && game) {
      const savedId = localStorage.getItem('jj_player_id');
      if (savedId) {
        const found = players.find(p => p.id === savedId);
        if (found) setPlayer(found);
      }
    }
  }, [loading, player, game, players, setPlayer]);

  const currentRoundHires = useMemo(
    () => player ? hires.filter(h => h.round === game?.current_round && h.employer_id === player.id) : [],
    [hires, game?.current_round, player]
  );

  const incomingOffers = useMemo(
    () => player ? offers.filter(o => o.employer_id === player.id && o.status === 'pending') : [],
    [offers, player]
  );

  // Count hires by skill this round
  const pinkHired = useMemo(
    () => currentRoundHires.filter(h => h.worker_skill === 'pink').length,
    [currentRoundHires]
  );
  const blueHired = useMemo(
    () => currentRoundHires.filter(h => h.worker_skill === 'blue').length,
    [currentRoundHires]
  );

  // Revenue & profit this round
  const roundRevenue = useMemo(() => {
    const pinkKites = pinkHired > 0 ? PINK_KITES[Math.min(pinkHired, PINK_KITES.length) - 1] : 0;
    const blueKites = blueHired > 0 ? BLUE_KITES[Math.min(blueHired, BLUE_KITES.length) - 1] : 0;
    return (pinkKites + blueKites) * KITE_PRICE;
  }, [pinkHired, blueHired]);

  const roundWages = useMemo(
    () => currentRoundHires.reduce((sum, h) => sum + h.wage, 0),
    [currentRoundHires]
  );

  // Cumulative profit across all rounds
  const allMyHires = useMemo(
    () => player ? hires.filter(h => h.employer_id === player.id) : [],
    [hires, player]
  );

  const cumulativeProfit = useMemo(() => {
    const byRound: Record<number, { revenue: number; wages: number }> = {};
    for (const h of allMyHires) {
      if (!byRound[h.round]) byRound[h.round] = { revenue: 0, wages: 0 };
      byRound[h.round].wages += h.wage;
      byRound[h.round].revenue += h.mp_value;
    }
    return Object.values(byRound).reduce((sum, r) => sum + r.revenue - r.wages, 0);
  }, [allMyHires]);

  function getWorkerName(workerId: string) {
    return players.find(p => p.id === workerId)?.name || '?';
  }

  function getWorkerSkill(workerId: string): 'pink' | 'blue' {
    return (players.find(p => p.id === workerId)?.skill as 'pink' | 'blue') || 'pink';
  }

  async function respondToOffer(offerId: string, action: 'accept' | 'reject') {
    try {
      const res = await fetch('/api/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Action failed');
    } catch {
      alert('Connection error');
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!game) return <div className="flex-1 flex items-center justify-center">Game not found</div>;

  if (!player) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Session expired. Please rejoin.</p>
          <a href="/" className="text-blue-600 hover:underline">Go to home</a>
        </div>
      </div>
    );
  }

  // Redirect workers to worker page
  if (player.role === 'worker') {
    if (typeof window !== 'undefined') {
      window.location.href = `/game/${game.id}/worker`;
    }
    return null;
  }

  const nextPinkMP = getPxMP('pink', pinkHired + 1);
  const nextBlueMP = getPxMP('blue', blueHired + 1);

  return (
    <main className="flex-1 flex flex-col max-w-lg mx-auto w-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b p-3 flex items-center justify-between">
        <div>
          <div className="font-bold">{player.employer_firm_name}</div>
          <div className="text-xs text-gray-500">{player.name}</div>
        </div>
        {game.status === 'round' && (
          <span className={`font-mono text-lg font-bold ${remaining <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
            {formatTime(remaining)}
          </span>
        )}
        <div className="text-right">
          <div className="text-sm">Round {game.current_round}/{game.max_rounds}</div>
          <div className="text-xs font-medium text-green-600">Profit: ${cumulativeProfit}</div>
        </div>
      </div>

      {/* Employer identity bar */}
      <div className="bg-blue-500 p-2 text-center text-white font-semibold text-sm">
        EMPLOYER — {player.employer_firm_name}
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Game Status */}
        {game.status === 'lobby' && (
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="font-medium">Waiting for the game to start...</p>
          </div>
        )}

        {game.status === 'ended' && (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="font-bold text-lg">Game Over!</p>
            <p className="text-2xl font-bold mt-2">${cumulativeProfit}</p>
            <p className="text-sm text-gray-500">Total Profit</p>
            <a href={`/game/${game.id}/results`}
              className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              View Results
            </a>
          </div>
        )}

        {/* MP Schedule (collapsible) */}
        {game.status === 'round' && (
          <details open={game.current_round <= 2}>
            <summary className="cursor-pointer font-semibold text-sm mb-2">
              Output & MP Schedule (P=${KITE_PRICE}/kite)
            </summary>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-pink-50 rounded">
                <div className="font-semibold text-pink-700 mb-1">Pink (Unskilled)</div>
                <div className="font-medium text-pink-600 mb-1">
                  Next hire = #{pinkHired + 1} (max wage: ${nextPinkMP})
                </div>
                {PINK_PxMP.map((v, i) => (
                  <div key={i} className={`flex justify-between ${i < pinkHired ? 'opacity-40' : ''} ${i === pinkHired ? 'font-bold' : ''}`}>
                    <span>Worker {i + 1}</span>
                    <span>${v}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-semibold text-blue-700 mb-1">Blue (Skilled)</div>
                <div className="font-medium text-blue-600 mb-1">
                  Next hire = #{blueHired + 1} (max wage: ${nextBlueMP})
                </div>
                {BLUE_PxMP.map((v, i) => (
                  <div key={i} className={`flex justify-between ${i < blueHired ? 'opacity-40' : ''} ${i === blueHired ? 'font-bold' : ''}`}>
                    <span>Worker {i + 1}</span>
                    <span>${v}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}

        {/* Incoming Offers */}
        {game.status === 'round' && (
          <div>
            <h3 className="font-semibold mb-2">
              Incoming Offers ({incomingOffers.length})
            </h3>
            {incomingOffers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center p-4">
                No offers yet. Workers will send you wage demands.
              </p>
            ) : (
              <div className="space-y-2">
                {incomingOffers.map(offer => {
                  const workerSkill = getWorkerSkill(offer.worker_id);
                  const nextMP = workerSkill === 'pink' ? nextPinkMP : nextBlueMP;
                  const aboveMP = offer.wage > nextMP;

                  return (
                    <div key={offer.id} className={`p-3 rounded-lg border-2 ${
                      aboveMP ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{getWorkerName(offer.worker_id)}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                            workerSkill === 'blue' ? 'bg-blue-200 text-blue-800' : 'bg-pink-200 text-pink-800'
                          }`}>
                            {workerSkill}
                          </span>
                        </div>
                        <span className="text-lg font-bold">${offer.wage}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {aboveMP ? (
                          <span className="text-red-600 font-medium">Above MP! Next {workerSkill} P x MP = ${nextMP}</span>
                        ) : (
                          <span className="text-green-600 font-medium">Below MP (profit: ${nextMP - offer.wage})</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => respondToOffer(offer.id, 'accept')}
                          className="flex-1 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToOffer(offer.id, 'reject')}
                          className="flex-1 py-2 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* This Round's Hires */}
        {currentRoundHires.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Round {game.current_round} Hires</h4>
            {currentRoundHires.map(h => (
              <div key={h.id} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0">
                <span>
                  {getWorkerName(h.worker_id)}
                  <span className={`ml-1 text-xs ${h.worker_skill === 'blue' ? 'text-blue-600' : 'text-pink-600'}`}>
                    ({h.worker_skill})
                  </span>
                </span>
                <span className="font-medium">${h.wage}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-300 text-sm">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="font-medium">${roundRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span>Wages</span>
                <span className="font-medium">-${roundWages}</span>
              </div>
              <div className="flex justify-between font-bold mt-1">
                <span>Round Profit</span>
                <span className={roundRevenue - roundWages >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${roundRevenue - roundWages}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Between rounds message */}
        {game.status === 'between_rounds' && (
          <div className="p-3 bg-gray-50 rounded-lg text-center text-sm">
            Waiting for Round {game.current_round + 1}...
          </div>
        )}
      </div>
    </main>
  );
}
