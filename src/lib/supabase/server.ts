import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side client (no cookies needed — we use session tokens, not Supabase auth)
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
