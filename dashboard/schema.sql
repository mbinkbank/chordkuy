-- Jalankan SEKALI di Supabase SQL Editor.
-- Urutan aman: buat policy dulu, baru aktifkan RLS.

-- 1. Publik boleh baca (untuk situs utama)
create policy "public read chords"
  on chords for select
  using (true);

-- 2. Hanya user login (admin) yang boleh menulis
create policy "admin insert chords"
  on chords for insert
  to authenticated
  with check (true);

create policy "admin update chords"
  on chords for update
  to authenticated
  using (true)
  with check (true);

create policy "admin delete chords"
  on chords for delete
  to authenticated
  using (true);

-- 3. Aktifkan RLS
alter table chords enable row level security;
