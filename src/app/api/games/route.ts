import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/game-logic';

export async function POST(request: Request) {
  const supabase = createServerClient();
  const body = await request.json();
  const instructorName = body.instructorName || 'Instructor';

  // Try up to 5 times to generate a unique room code
  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateRoomCode();

    const { data, error } = await supabase
      .from('games')
      .insert({
        room_code: roomCode,
        instructor_name: instructorName,
        status: 'lobby',
        current_round: 0,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation — try another code
      if (error.code === '23505') continue;
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: 'Failed to generate unique room code' },
    { status: 500 }
  );
}
