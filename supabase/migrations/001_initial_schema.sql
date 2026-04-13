-- Job Jungle: Classroom Labour Market Simulation
-- Database Schema for Supabase (PostgreSQL)

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE games (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code     CHAR(4) UNIQUE NOT NULL,
  instructor_name TEXT NOT NULL DEFAULT 'Instructor',
  status        TEXT NOT NULL DEFAULT 'lobby'
                CHECK (status IN ('lobby','round','between_rounds','ended')),
  current_round INT NOT NULL DEFAULT 0,
  round_end_at  TIMESTAMPTZ,
  max_rounds    INT NOT NULL DEFAULT 6,
  round_duration_sec INT NOT NULL DEFAULT 420, -- 7 minutes
  kite_price    INT NOT NULL DEFAULT 15,
  education_cost INT NOT NULL DEFAULT 25,
  pa_pink       INT NOT NULL DEFAULT 15,
  pa_blue       INT NOT NULL DEFAULT 35,
  employer_entry_threshold INT NOT NULL DEFAULT 100,
  employer_entry_after_round INT NOT NULL DEFAULT 3,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE players (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'worker'
                CHECK (role IN ('worker','employer')),
  skill         TEXT NOT NULL DEFAULT 'pink'
                CHECK (skill IN ('pink','blue')),
  endowment     INT NOT NULL DEFAULT 0,
  balance       INT NOT NULL DEFAULT 0,
  employer_firm_name TEXT,              -- e.g. "Firm A", assigned by instructor
  became_employer_round INT,            -- round when worker converted
  session_token TEXT,                   -- for reconnection
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, name)
);

CREATE TABLE offers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round         INT NOT NULL,
  worker_id     UUID NOT NULL REFERENCES players(id),
  employer_id   UUID NOT NULL REFERENCES players(id),
  wage          INT NOT NULL CHECK (wage >= 0),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE TABLE hires (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id       UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round         INT NOT NULL,
  worker_id     UUID NOT NULL REFERENCES players(id),
  employer_id   UUID NOT NULL REFERENCES players(id),
  wage          INT NOT NULL,
  worker_skill  TEXT NOT NULL CHECK (worker_skill IN ('pink','blue')),
  hire_order    INT NOT NULL,           -- nth worker of this skill hired by this employer this round (1-indexed)
  mp_value      INT NOT NULL,           -- P x MP for this hire position
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(worker_id, round)              -- one hire per worker per round
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_offers_game_round ON offers(game_id, round);
CREATE INDEX idx_offers_worker ON offers(worker_id, round);
CREATE INDEX idx_offers_employer ON offers(employer_id, round);
CREATE INDEX idx_hires_game_round ON hires(game_id, round);
CREATE INDEX idx_hires_employer ON hires(employer_id, round);

-- Enforce: only one pending offer per worker per round
CREATE UNIQUE INDEX idx_one_pending_offer
  ON offers(worker_id, round) WHERE status = 'pending';

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Run these in Supabase Dashboard > Database > Replication
-- or via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE offers;
ALTER PUBLICATION supabase_realtime ADD TABLE hires;
