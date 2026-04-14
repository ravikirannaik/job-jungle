'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [section, setSection] = useState<'A' | 'B' | ''>('');
  const [roomCode, setRoomCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!section || !roomCode.trim() || !studentId.trim()) return;

    setJoining(true);
    setError('');

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.trim().toUpperCase(),
          studentId: studentId.trim(),
          section,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to join');
        setJoining(false);
        return;
      }

      localStorage.setItem(`jj_session_${data.game.id}`, data.player.session_token || '');
      localStorage.setItem('jj_player_id', data.player.id);
      localStorage.setItem('jj_game_id', data.game.id);

      router.push(`/game/${data.game.id}/worker`);
    } catch {
      setError('Connection failed. Try again.');
      setJoining(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-mu-base">Job Jungle</h1>
          <p className="mt-2 text-gray-500">
            Labour Market Simulation — ECON207
          </p>
        </div>

        {/* Join Game Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSection('A')}
                className={`py-3 rounded-lg border-2 font-semibold text-lg transition-colors ${
                  section === 'A'
                    ? 'border-mu-base bg-mu-base-light text-mu-base'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
              >
                Section A
              </button>
              <button
                type="button"
                onClick={() => setSection('B')}
                className={`py-3 rounded-lg border-2 font-semibold text-lg transition-colors ${
                  section === 'B'
                    ? 'border-mu-base bg-mu-base-light text-mu-base'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
              >
                Section B
              </button>
            </div>
          </div>

          {/* Room Code */}
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium mb-1">
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              maxLength={4}
              placeholder="e.g. A3K7"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-2xl text-center tracking-[0.3em] font-mono border-2 border-gray-300 rounded-lg focus:border-mu-base focus:outline-none uppercase"
              required
            />
          </div>

          {/* Student ID */}
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium mb-1">
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="e.g. 240531"
              value={studentId}
              onChange={e => setStudentId(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 text-2xl text-center tracking-[0.15em] font-mono border-2 border-gray-300 rounded-lg focus:border-mu-base focus:outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Your FLAME University student ID number</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={joining || !section || !roomCode.trim() || !studentId.trim()}
            className="w-full py-3 bg-mu-base text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        {/* Instructor link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Are you the instructor?</p>
          <button
            onClick={() => router.push('/create')}
            className="text-mu-base font-medium hover:underline"
          >
            Create a new game
          </button>
        </div>
      </div>
    </main>
  );
}
