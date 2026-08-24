-- Kolom updated_at untuk deteksi perubahan (pre-render inkremental)
alter table chords add column if not exists updated_at timestamptz not null default now();
update chords set updated_at = '1970-01-01' where updated_at < '2000-01-01';

create or replace function sync_chords_fields() returns trigger as $$
begin
  if coalesce(new.judul,'') <> '' then
    new.title := new.judul;
    new.artist := new.penyanyi;
  elsif coalesce(new.title,'') <> '' then
    new.judul := new.title;
    new.penyanyi := new.artist;
  end if;

  if coalesce(new.isi_chord,'') <> '' then
    new.content := new.isi_chord;
  end if;
  if coalesce(new.content,'') <> '' then
    new.isi_chord := new.content;
  end if;

  if coalesce(new.base_key,'') <> '' then
    new.key_name := new.base_key;
  end if;
  if coalesce(new.key_name,'') <> '' then
    new.base_key := new.key_name;
  end if;

  if coalesce(new.lastmod,'') = '' then
    new.lastmod := to_char(now(),'YYYY-MM-DD HH24:MI:SS');
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
