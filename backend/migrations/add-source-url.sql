ALTER TABLE chords ADD COLUMN IF NOT EXISTS source_url text DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_chords_source_url ON chords (source_url);
