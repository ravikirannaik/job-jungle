// Database row types matching Supabase schema

export interface Game {
  id: string;
  room_code: string;
  instructor_name: string;
  status: 'lobby' | 'round' | 'between_rounds' | 'ended';
  current_round: number;
  round_end_at: string | null;
  max_rounds: number;
  round_duration_sec: number;
  kite_price: number;
  education_cost: number;
  pa_pink: number;
  pa_blue: number;
  employer_entry_threshold: number;
  employer_entry_after_round: number;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  role: 'worker' | 'employer';
  skill: 'pink' | 'blue';
  endowment: number;
  balance: number;
  employer_firm_name: string | null;
  became_employer_round: number | null;
  session_token: string | null;
  joined_at: string;
}

export interface Offer {
  id: string;
  game_id: string;
  round: number;
  worker_id: string;
  employer_id: string;
  wage: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  resolved_at: string | null;
}

export interface Hire {
  id: string;
  game_id: string;
  round: number;
  worker_id: string;
  employer_id: string;
  wage: number;
  worker_skill: 'pink' | 'blue';
  hire_order: number;
  mp_value: number;
  created_at: string;
}

// Joined types for UI
export interface OfferWithNames extends Offer {
  worker_name?: string;
  worker_skill?: 'pink' | 'blue';
  employer_name?: string;
}

export interface HireWithNames extends Hire {
  worker_name?: string;
  employer_name?: string;
}
