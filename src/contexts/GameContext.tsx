'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Game, Player, Offer, Hire } from '@/lib/types';

interface GameContextType {
  game: Game | null;
  player: Player | null;
  players: Player[];
  offers: Offer[];
  hires: Hire[];
  loading: boolean;
  error: string | null;
  refreshPlayers: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshHires: () => Promise<void>;
  setPlayer: (p: Player | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({
  gameId,
  children,
}: {
  gameId: string;
  children: ReactNode;
}) {
  const [game, setGame] = useState<Game | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hires, setHires] = useState<Hire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch game
  const fetchGame = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (err) setError(err.message);
    else setGame(data);
  }, [gameId]);

  // Fetch all players
  const refreshPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at');
    if (data) setPlayers(data);
  }, [gameId]);

  // Fetch offers for current round
  const refreshOffers = useCallback(async () => {
    if (!game) return;
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('game_id', gameId)
      .eq('round', game.current_round)
      .order('created_at', { ascending: false });
    if (data) setOffers(data);
  }, [gameId, game?.current_round]);

  // Fetch all hires
  const refreshHires = useCallback(async () => {
    const { data } = await supabase
      .from('hires')
      .select('*')
      .eq('game_id', gameId)
      .order('round')
      .order('created_at');
    if (data) setHires(data);
  }, [gameId]);

  // Initial fetch
  useEffect(() => {
    async function init() {
      setLoading(true);
      await fetchGame();
      await refreshPlayers();
      await refreshHires();
      setLoading(false);
    }
    init();
  }, [fetchGame, refreshPlayers, refreshHires]);

  // Fetch offers when round changes
  useEffect(() => {
    if (game?.current_round) {
      refreshOffers();
    }
  }, [game?.current_round, refreshOffers]);

  // Restore player from localStorage
  useEffect(() => {
    if (players.length === 0) return;
    const token = localStorage.getItem(`jj_session_${gameId}`);
    if (token && !player) {
      const found = players.find(p => p.session_token === token);
      if (found) setPlayer(found);
    }
  }, [players, gameId, player]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        setGame(payload.new as Game);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        refreshPlayers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'offers',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        refreshOffers();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hires',
        filter: `game_id=eq.${gameId}`,
      }, () => {
        refreshHires();
        refreshPlayers(); // balances changed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, refreshPlayers, refreshOffers, refreshHires]);

  // Keep player state in sync
  useEffect(() => {
    if (player) {
      const updated = players.find(p => p.id === player.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(player)) {
        setPlayer(updated);
      }
    }
  }, [players, player]);

  return (
    <GameContext.Provider value={{
      game,
      player,
      players,
      offers,
      hires,
      loading,
      error,
      refreshPlayers,
      refreshOffers,
      refreshHires,
      setPlayer,
    }}>
      {children}
    </GameContext.Provider>
  );
}
