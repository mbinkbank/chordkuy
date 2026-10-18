"""Apply notes_all.jsonl ke DB via Postgres (COPY / execute_values, cepat).

Pemakaian: python apply_notes.py notes_all.jsonl
"""
import json
import sys

import psycopg2
import psycopg2.extras


def load_env() -> dict:
    env = {}
    for line in open(r"D:\download\chordkuyid\backend\.env", encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def main() -> None:
    path = sys.argv[1] if len(sys.argv) > 1 else "notes_all.jsonl"
    rows = []
    for line in open(path, encoding="utf-8"):
        try:
            d = json.loads(line)
            rows.append((d["note"], d["id"]))
        except Exception:
            pass
    print(f"membaca {len(rows)} catatan dari {path}")

    env = load_env()
    conn = psycopg2.connect(env["DATABASE_URL"])
    cur = conn.cursor()
    before = None
    cur.execute("SELECT COUNT(*) FROM chords WHERE seo_note IS NOT NULL AND seo_note <> ''")
    before = cur.fetchone()[0]

    psycopg2.extras.execute_values(
        cur,
        "UPDATE chords AS c SET seo_note = data.note FROM (VALUES %s) AS data(note, id) WHERE c.id = data.id",
        rows,
        page_size=500,
    )
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM chords WHERE seo_note IS NOT NULL AND seo_note <> ''")
    after = cur.fetchone()[0]
    print(f"sebelum: {before}, sesudah: {after} (+{after - before})")
    conn.close()


if __name__ == "__main__":
    main()
