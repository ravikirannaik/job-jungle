-- Add student ID and email to players table
ALTER TABLE players ADD COLUMN student_id TEXT;
ALTER TABLE players ADD COLUMN email TEXT;

-- Index for looking up by student_id within a game
CREATE UNIQUE INDEX idx_players_student_id ON players(game_id, student_id) WHERE student_id IS NOT NULL;

-- Reload the schema cache
NOTIFY pgrst, 'reload schema';
