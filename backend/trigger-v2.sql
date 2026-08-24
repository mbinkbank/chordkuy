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

  return new;
end;
$$ language plpgsql;
