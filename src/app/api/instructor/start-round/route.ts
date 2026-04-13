import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId } = await request.json();

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Valid transitions: lobby → round 1, between_rounds → next round
  if (game.status !== 'lobby' && game.status !== 'between_rounds') {
    return NextResponse.json(
      { error: 'Can only start a round from lobby or between rounds' },
      { status: 400 }
    );
  }

  const nextRound = game.current_round + 1;
  if (nextRound > game.max_rounds) {
    return NextResponse.json({ error: 'All rounds completed' }, { status: 400 });
  }

  const roundEndAt = new Date(Date.now() + game.round_duration_sec * 1000).toISOString();

  const { data: updated, error } = await supabase
    .from('games')
    .update({
      status: 'round',
      current_round: nextRound,
      round_end_at: roundEndAt,
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
