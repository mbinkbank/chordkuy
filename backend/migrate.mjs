import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // 1. Kolom jembatan untuk aplikasi admin (format referensi)
  await pool.query(`
    alter table chords
      add column if not exists judul text not null default '',
      add column if not exists penyanyi text not null default '',
      add column if not exists base_key text not null default '',
      add column if not exists album text not null default '',
      add column if not exists album_image text not null default '',
      add column if not exists lastmod text not null default '',
      add column if not exists isi_chord text not null default '',
      add column if not exists youtube_url text not null default '',
      add column if not exists songwriter text not null default '',
      add column if not exists year text not null default '',
      add column if not exists songtype text not null default '';
  `);
  console.log("✅ Kolom jembatan ditambahkan");

  // 2. Isi data lama
  await pool.query(`
    update chords set
      judul = coalesce(nullif(judul,''), title),
      penyanyi = coalesce(nullif(penyanyi,''), artist),
      base_key = coalesce(nullif(base_key,''), key_name),
      isi_chord = coalesce(nullif(isi_chord,''), content)
    where judul = '' or penyanyi = '' or base_key = '' or isi_chord = '';
  `);
  console.log("✅ Data lama tersinkron");

  // 3. Trigger sinkron dua arah: situs baca title/artist/content, admin tulis judul/penyanyi/isi_chord
  await pool.query(`
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

      return new;
    end;
    $$ language plpgsql;
  `);
  await pool.query(`
    drop trigger if exists trg_sync_chords on chords;
    create trigger trg_sync_chords
      before insert or update on chords
      for each row execute function sync_chords_fields();
  `);
  console.log("✅ Trigger sinkronisasi aktif");

  await pool.end();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});

// backfill lastmod
await pool.query("update chords set lastmod = to_char(now(),'YYYY-MM-DD HH24:MI:SS') where lastmod = ''");

// trigger v2: auto-isi lastmod untuk lagu baru hasil scraper
await pool.query(\create or replace function sync_chords_fields() returns trigger as \$\$
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
      \$\$ language plpgsql;\);
