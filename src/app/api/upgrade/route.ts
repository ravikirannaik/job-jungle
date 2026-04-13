import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId, playerId } = await request.json();

  // Validate game is between rounds
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game || game.status !== 'between_rounds') {
    return NextResponse.json(
      { error: 'Education upgrade only available between rounds' },
      { status: 400 }
    );
  }

  // Validate player
  const { data: player } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .eq('game_id', gameId)
    .single();

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  if (player.role !== 'worker') {
    return NextResponse.json({ error: 'Only workers can upgrade' }, { status: 400 });
  }

  if (player.skill !== 'pink') {
    return NextResponse.json({ error: 'Already upgraded to Blue' }, { status: 400 });
  }

  if (player.balance < game.education_cost) {
    return NextResponse.json(
      { error: `Need $${game.education_cost} to upgrade. You have $${player.balance}.` },
      { status: 400 }
    );
  }

  // Deduct cost and upgrade
  const { data: updated, error } = await supabase
    .from('players')
    .update({
      skill: 'blue',
      balance: player.balance - game.education_cost,
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
