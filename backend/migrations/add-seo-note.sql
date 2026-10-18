-- Jalankan SEKALI di Supabase SQL Editor.

-- Kolom catatan SEO unik per lagu (diisi manual/script untuk lagu populer)
ALTER TABLE chords ADD COLUMN IF NOT EXISTS seo_note text DEFAULT '';
