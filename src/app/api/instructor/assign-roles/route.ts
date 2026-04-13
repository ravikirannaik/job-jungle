import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId, employers } = await request.json();
  // employers: [{ playerId: string, firmName: string }]

  if (!gameId || !employers?.length) {
    return NextResponse.json({ error: 'gameId and employers required' }, { status: 400 });
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

  // Set selected players as employers
  for (const emp of employers) {
    await supabase
      .from('players')
      .update({ role: 'employer', employer_firm_name: emp.firmName })
      .eq('id', emp.playerId);
  }

  // Fetch updated players
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at');

  return NextResponse.json({ players });
}
