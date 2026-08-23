import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(`
    create table if not exists tb_chord (
      judul text not null,
      penyanyi text not null,
      base_key text not null default '',
      album text not null default '',
      album_image text not null default '',
      lastmod text not null default '',
      isi_chord text not null default '',
      language text not null default '',
      youtube_url text not null default '',
      songwriter text not null default '',
      year text not null default '',
      songtype text not null default '',
      primary key (judul, penyanyi)
    );
  `);
  await pool.query(`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password_hash text not null,
      name text not null,
      role text not null default 'editor',
      created_at timestamp not null default now()
    );
  `);
  console.log("✅ Tabel tb_chord & users siap");

  const email = "mariobaladollun@gmail.com";
  const existing = await pool.query("select id from users where email=$1", [email]);
  if (existing.rowCount === 0) {
    const hash = await bcrypt.hash("Risna@19972003", 12);
    await pool.query(
      "insert into users (email, password_hash, name, role) values ($1,$2,$3,$4)",
      [email, hash, "Admin Chordkuy", "admin"],
    );
    console.log("✅ Admin dibuat:", email, "/ Risna@19972003");
  } else {
    console.log("ℹ️ Admin sudah ada");
  }
  await pool.end();
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
