'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;

    setJoining(true);
    setError('');

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: roomCode.trim().toUpperCase(), name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to join');
        setJoining(false);
        return;
      }

      // Save session token for reconnection
      localStorage.setItem(`jj_session_${data.game.id}`, data.player.session_token);
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
          <h1 className="text-4xl font-bold tracking-tight">Job Jungle</h1>
          <p className="mt-2 text-gray-500">
            Labour Market Simulation
          </p>
        </div>

        {/* Join Game Form */}
        <form onSubmit={handleJoin} className="space-y-4">
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
              className="w-full px-4 py-3 text-2xl text-center tracking-[0.3em] font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={joining || !roomCode.trim() || !name.trim()}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </form>

        {/* Instructor link */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Are you the instructor?</p>
          <button
            onClick={() => router.push('/create')}
            className="text-blue-600 font-medium hover:underline"
          >
            Create a new game
          </button>
        </div>
      </div>
    </main>
  );
}
