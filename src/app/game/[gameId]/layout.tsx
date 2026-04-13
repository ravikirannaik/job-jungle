'use client';

import { use } from 'react';
import { GameProvider } from '@/contexts/GameContext';

export default function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);

  return (
    <GameProvider gameId={gameId}>
      {children}
    </GameProvider>
  );
}
