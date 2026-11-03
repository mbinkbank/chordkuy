-- Jalankan SEKALI di Supabase SQL Editor.
-- Menyimpan token & konfigurasi Pinterest (diakses worker + scraper via service role).
--
-- RLS WAJIB aktif: tabel ini berisi token Pinterest (setara kata sandi).
-- Tanpa policy apa pun -> anon/public tidak bisa baca/tulis.
-- Worker & scraper memakai service role key yang bypass RLS.

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
