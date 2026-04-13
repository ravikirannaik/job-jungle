import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateEndowment, generateSessionToken } from '@/lib/game-logic';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { roomCode, name } = await request.json();

  if (!roomCode || !name?.trim()) {
    return NextResponse.json(
      { error: 'Room code and name are required' },
      { status: 400 }
    );
  }

  // Find game by room code
  const { data: game, error: gameErr } = await supabase
    .from('games')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .single();

  if (gameErr || !game) {
    return NextResponse.json(
      { error: 'Game not found. Check your room code.' },
      { status: 404 }
    );
  }

  if (game.status !== 'lobby') {
    return NextResponse.json(
      { error: 'Game has already started. Cannot join.' },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  const endowment = calculateEndowment(trimmedName);
  const sessionToken = generateSessionToken();

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: trimmedName,
      role: 'worker',
      skill: 'pink',
      endowment,
      balance: endowment,
      session_token: sessionToken,
    })
    .select()
    .single();

  if (playerErr) {
    if (playerErr.code === '23505') {
      return NextResponse.json(
        { error: 'A player with that name already exists in this game.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: playerErr.message }, { status: 500 });
  }

  return NextResponse.json({ player, game });
}
