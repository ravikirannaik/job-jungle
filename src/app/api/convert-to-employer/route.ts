import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId, playerId, firmName } = await request.json();

  // Validate game
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game || game.status !== 'between_rounds') {
    return NextResponse.json(
      { error: 'Conversion only available between rounds' },
      { status: 400 }
    );
  }

  if (game.current_round < game.employer_entry_after_round) {
    return NextResponse.json(
      { error: `Employer entry opens after Round ${game.employer_entry_after_round}` },
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
    return NextResponse.json({ error: 'Already an employer' }, { status: 400 });
  }

  if (player.balance < game.employer_entry_threshold) {
    return NextResponse.json(
      { error: `Need $${game.employer_entry_threshold} to become an employer. You have $${player.balance}.` },
      { status: 400 }
    );
  }

  // Convert to employer
  const { data: updated, error } = await supabase
    .from('players')
    .update({
      role: 'employer',
      employer_firm_name: firmName || `Firm ${player.name}`,
      became_employer_round: game.current_round + 1,
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
