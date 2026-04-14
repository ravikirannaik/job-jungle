'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateGame() {
  const router = useRouter();
  const [instructorName, setInstructorName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorName: instructorName.trim() || 'Instructor' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create game');
        setCreating(false);
        return;
      }

      // Save instructor token
      localStorage.setItem(`jj_instructor_${data.id}`, 'true');
      localStorage.setItem('jj_game_id', data.id);

      router.push(`/game/${data.id}/instructor`);
    } catch {
      setError('Connection failed. Try again.');
      setCreating(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create Game</h1>
          <p className="mt-2 text-gray-500">Set up a new Job Jungle session</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="instructorName" className="block text-sm font-medium mb-1">
              Your Name (Instructor)
            </label>
            <input
              id="instructorName"
              type="text"
              placeholder="Prof. Naik"
              value={instructorName}
              onChange={e => setInstructorName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mu-base focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="w-full text-center text-gray-500 hover:text-gray-700"
        >
          Back to home
        </button>
      </div>
    </main>
  );
}
