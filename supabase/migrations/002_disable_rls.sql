-- Disable RLS on all tables for classroom use (no auth needed)
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE hires DISABLE ROW LEVEL SECURITY;

-- Also grant full access to anon role (the public API key)
GRANT ALL ON games TO anon;
GRANT ALL ON players TO anon;
GRANT ALL ON offers TO anon;
GRANT ALL ON hires TO anon;

-- Reload the schema cache
NOTIFY pgrst, 'reload schema';
