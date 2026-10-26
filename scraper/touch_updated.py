"""Touch updated_at utk baris yang seo_note-nya baru diisi + trigger ke depan.

Kenapa: sitemap memakai updated_at sebagai lastmod. Tanpa trigger, mengisi
seo_note tidak mengubah updated_at -> Google diberi tahu "tidak berubah".
"""
import psycopg2

def load_env() -> dict:
    env = {}
    for line in open(r"D:\download\chordkuyid\backend\.env", encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env

env = load_env()
conn = psycopg2.connect(env["DATABASE_URL"])
cur = conn.cursor()

# 1. trigger utk edit konten/seo_note ke depannya
cur.execute("""
CREATE OR REPLACE FUNCTION touch_chords_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
""")
cur.execute("DROP TRIGGER IF EXISTS trg_chords_touch ON chords;")
cur.execute("""
CREATE TRIGGER trg_chords_touch
BEFORE UPDATE OF seo_note, content ON chords
FOR EACH ROW EXECUTE FUNCTION touch_chords_updated_at();
""")

# 2. sekali: tandai konten yang berubah (>0.99 view aktivitas) - semua yg punya seo_note
cur.execute("SELECT COUNT(*) FROM chords WHERE seo_note <> '' AND updated_at < '2026-09-30'")
print("baris perlu di-touch:", cur.fetchone()[0])
cur.execute("UPDATE chords SET updated_at = now() WHERE seo_note <> '' AND updated_at < '2026-09-30'")
print("ter-update:", cur.rowcount)
conn.commit()

cur.execute("SELECT COUNT(*) FROM chords WHERE updated_at >= '2026-10-01'")
print("total updated_at >= 1 Okt:", cur.fetchone()[0])
conn.close()
