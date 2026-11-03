-- Jalankan SEKALI di Supabase SQL Editor.
-- Menyimpan token & konfigurasi Pinterest (diakses worker + scraper via service key).

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
