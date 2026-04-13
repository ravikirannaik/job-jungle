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

  if (!game || game.status !== 'round') {
    return NextResponse.json({ error: 'No active round to end' }, { status: 400 });
  }

  // 1. Auto-reject all pending offers for this round
  await supabase
    .from('offers')
    .update({ status: 'rejected', resolved_at: new Date().toISOString() })
    .eq('game_id', gameId)
    .eq('round', game.current_round)
    .eq('status', 'pending');

  // 2. Get all workers in this game
  const { data: workers } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('role', 'worker');

  // 3. Get hires for this round
  const { data: roundHires } = await supabase
    .from('hires')
    .select('worker_id')
    .eq('game_id', gameId)
    .eq('round', game.current_round);

  const hiredWorkerIds = new Set((roundHires || []).map(h => h.worker_id));

  // 4. Distribute PA to unemployed workers
  for (const worker of (workers || [])) {
    if (!hiredWorkerIds.has(worker.id)) {
      const pa = worker.skill === 'pink' ? game.pa_pink : game.pa_blue;
      await supabase
        .from('players')
        .update({ balance: worker.balance + pa })
        .eq('id', worker.id);
    }
  }

  // 5. Transition game state
  const isLastRound = game.current_round >= game.max_rounds;
  const { data: updated, error } = await supabase
    .from('games')
    .update({
      status: isLastRound ? 'ended' : 'between_rounds',
      round_end_at: null,
    })
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
