import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId, firms } = await request.json();
  // firms: [{ playerIds: string[], firmName: string }]

  if (!gameId || !firms?.length) {
    return NextResponse.json({ error: 'gameId and firms required' }, { status: 400 });
  }

  // Validate game is in lobby
  const { data: game } = await supabase
    .from('games')
    .select('status')
    .eq('id', gameId)
    .single();

  if (!game || game.status !== 'lobby') {
    return NextResponse.json({ error: 'Game must be in lobby phase' }, { status: 400 });
  }

  // First reset all players to workers (in case re-assigning)
  await supabase
    .from('players')
    .update({ role: 'worker', employer_firm_name: null })
    .eq('game_id', gameId);

  // Set each firm's players as employers with shared firm name
  for (const firm of firms) {
    for (const playerId of firm.playerIds) {
      await supabase
        .from('players')
        .update({ role: 'employer', employer_firm_name: firm.firmName })
        .eq('id', playerId);
    }
  }

  // Fetch updated players
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at');

  return NextResponse.json({ players });
}
