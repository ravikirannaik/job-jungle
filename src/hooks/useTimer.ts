'use client';

import { useState, useEffect } from 'react';

/**
 * Countdown timer that computes remaining seconds from an absolute end timestamp.
 * Returns 0 when expired. Updates every second.
 */
export function useTimer(endAt: string | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endAt) {
      setRemaining(0);
      return;
    }

    function update() {
      const end = new Date(endAt!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((end - now) / 1000));
      setRemaining(diff);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  return remaining;
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
