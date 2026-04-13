import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getPxMP } from '@/lib/game-logic';

// POST: Worker sends a wage offer to an employer
export async function POST(request: Request) {
  const supabase = createServerClient();
  const { gameId, workerId, employerId, wage } = await request.json();

  // Validate game is in round
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game || game.status !== 'round') {
    return NextResponse.json({ error: 'No active round' }, { status: 400 });
  }

  // Validate worker exists and is a worker
  const { data: worker } = await supabase
    .from('players')
    .select('*')
    .eq('id', workerId)
    .eq('game_id', gameId)
    .single();

  if (!worker || worker.role !== 'worker') {
    return NextResponse.json({ error: 'Invalid worker' }, { status: 400 });
  }

  // Check worker not already hired this round
  const { data: existingHire } = await supabase
    .from('hires')
    .select('id')
    .eq('worker_id', workerId)
    .eq('round', game.current_round)
    .maybeSingle();

  if (existingHire) {
    return NextResponse.json({ error: 'Already hired this round' }, { status: 400 });
  }

  // Insert offer (DB enforces one pending per worker per round)
  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      game_id: gameId,
      round: game.current_round,
      worker_id: workerId,
      employer_id: employerId,
      wage,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'You already have a pending offer. Withdraw it first.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(offer);
}

// PATCH: Employer accepts/rejects an offer, or worker withdraws
export async function PATCH(request: Request) {
  const supabase = createServerClient();
  const { offerId, action } = await request.json();
  // action: 'accept' | 'reject' | 'withdraw'

  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (!offer || offer.status !== 'pending') {
    return NextResponse.json({ error: 'Offer not found or not pending' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (action === 'reject' || action === 'withdraw') {
    const { data } = await supabase
      .from('offers')
      .update({ status: action === 'withdraw' ? 'withdrawn' : 'rejected', resolved_at: now })
      .eq('id', offerId)
      .select()
      .single();

    return NextResponse.json(data);
  }

  if (action === 'accept') {
    // Check worker not already hired (race condition guard)
    const { data: existingHire } = await supabase
      .from('hires')
      .select('id')
      .eq('worker_id', offer.worker_id)
      .eq('round', offer.round)
      .maybeSingle();

    if (existingHire) {
      await supabase
        .from('offers')
        .update({ status: 'rejected', resolved_at: now })
        .eq('id', offerId);
      return NextResponse.json({ error: 'Worker was already hired' }, { status: 400 });
    }

    // Get worker skill
    const { data: worker } = await supabase
      .from('players')
      .select('skill, balance')
      .eq('id', offer.worker_id)
      .single();

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 400 });
    }

    // Count existing hires for this employer this round by skill
    const { count } = await supabase
      .from('hires')
      .select('id', { count: 'exact' })
      .eq('employer_id', offer.employer_id)
      .eq('round', offer.round)
      .eq('worker_skill', worker.skill);

    const hireOrder = (count || 0) + 1;
    const mpValue = getPxMP(worker.skill as 'pink' | 'blue', hireOrder);

    // Create hire
    const { data: hire, error: hireErr } = await supabase
      .from('hires')
      .insert({
        game_id: offer.game_id,
        round: offer.round,
        worker_id: offer.worker_id,
        employer_id: offer.employer_id,
        wage: offer.wage,
        worker_skill: worker.skill,
        hire_order: hireOrder,
        mp_value: mpValue,
      })
      .select()
      .single();

    if (hireErr) {
      return NextResponse.json({ error: hireErr.message }, { status: 500 });
    }

    // Update worker balance
    await supabase
      .from('players')
      .update({ balance: worker.balance + offer.wage })
      .eq('id', offer.worker_id);

    // Accept this offer
    await supabase
      .from('offers')
      .update({ status: 'accepted', resolved_at: now })
      .eq('id', offerId);

    // Auto-reject other pending offers for this worker this round
    await supabase
      .from('offers')
      .update({ status: 'rejected', resolved_at: now })
      .eq('worker_id', offer.worker_id)
      .eq('round', offer.round)
      .eq('status', 'pending')
      .neq('id', offerId);

    return NextResponse.json(hire);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
