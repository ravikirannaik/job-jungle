import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { calculateEndowment, generateSessionToken } from '@/lib/game-logic';
import { findByStudentId } from '@/lib/roster';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const { roomCode, studentId } = await request.json();

  if (!roomCode || !studentId?.trim()) {
    return NextResponse.json(
      { error: 'Room code and Student ID are required' },
      { status: 400 }
    );
  }

  // Look up student in roster
  const student = findByStudentId(studentId.trim());
  if (!student) {
    return NextResponse.json(
      { error: 'Student ID not found in the class roster.' },
      { status: 404 }
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

  const endowment = calculateEndowment(student.name);
  const sessionToken = generateSessionToken();

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: student.name,
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
      // Already joined — find existing player and return
      const { data: existing } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id)
        .eq('name', student.name)
        .single();

      if (existing) {
        return NextResponse.json({ player: existing, game });
      }
      return NextResponse.json(
        { error: 'You have already joined this game.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: playerErr.message }, { status: 500 });
  }

  return NextResponse.json({ player, game, student: { email: student.email } });
}
