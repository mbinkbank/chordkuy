"""
Langkah 1 - BACKFILL: isi seluruh lagu dari antrian sensus ke database.
- Antrian : census_songs.jsonl ({"artist", "song_url"} per baris) — hasil census.py
- Kursor  : backfill_cursor.json {"index": N} — di-commit ulang oleh workflow tiap run
- Skip    : lagu yang sudah ada di DB (judul+artis)
- Gagal   : dicatat ke backfill_failed.jsonl (bisa di-retry belakangan)
"""
import json
import os
import time

from chordtela_scraper import fetch, parse_detail, supabase

DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(DIR, "census_songs.jsonl")
CURSOR = os.path.join(DIR, "backfill_cursor.json")
FAILED = os.path.join(DIR, "backfill_failed.jsonl")
LIMIT = int(os.getenv("BACKFILL_LIMIT", "800"))


def load_queue() -> list[dict]:
    items = []
    with open(QUEUE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


def main():
    queue = load_queue()
    idx = 0
    if os.path.exists(CURSOR):
        idx = json.load(open(CURSOR, encoding="utf-8")).get("index", 0)
    print(f"Antrian: {len(queue)} lagu | kursor: {idx} | limit run ini: {LIMIT}", flush=True)

    existing = set()
    try:
        rows = supabase.table("chords").select("title,artist").execute().data
        for r in rows:
            existing.add((r["title"].lower().strip(), r["artist"].lower().strip()))
        print(f"Sudah ada di DB: {len(existing)} lagu", flush=True)
    except Exception as e:
        print(f"[WARN] gagal muat existing: {e}", flush=True)

    done = skipped = failed = 0
    i = idx
    t0 = time.time()
    while i < len(queue) and done < LIMIT:
        item = queue[i]
        i += 1
        try:
            html = fetch(item["song_url"])
            parsed = parse_detail(html)
        except Exception as e:
            failed += 1
            with open(FAILED, "a", encoding="utf-8") as f:
                f.write(json.dumps({"url": item["song_url"], "error": str(e)[:200]}, ensure_ascii=False) + "\n")
            print(f"[GAGAL] {item['song_url']} :: {e}", flush=True)
            continue

        if not parsed or not parsed["content"]:
            print(f"[SKIP kosong] {item['song_url']}", flush=True)
            continue

        full_title = parsed.pop("full_title")
        if " - " in full_title:
            artist, title = (p.strip() for p in full_title.split(" - ", 1))
        else:
            artist, title = item["artist"], full_title

        key = (title.lower().strip(), artist.lower().strip())
        if key in existing:
            skipped += 1
            continue

        try:
            supabase.table("chords").insert({"title": title, "artist": artist, **parsed}).execute()
            existing.add(key)
            done += 1
            if done % 25 == 0:
                rate = done / (time.time() - t0) * 3600
                print(f"[{done}/{LIMIT}] {artist} - {title} | {rate:.0f}/jam", flush=True)
        except Exception as e:
            failed += 1
            with open(FAILED, "a", encoding="utf-8") as f:
                f.write(json.dumps({"url": item["song_url"], "error": str(e)[:200]}, ensure_ascii=False) + "\n")
            print(f"[GAGAL INSERT] {artist} - {title} :: {e}", flush=True)

    with open(CURSOR, "w", encoding="utf-8") as f:
        json.dump({"index": i, "total": len(queue)}, f)
    print(f"\nRun selesai: +{done} baru | {skipped} skip (sudah ada) | {failed} gagal | kursor {i}/{len(queue)}", flush=True)
    if i >= len(queue):
        print("BACKFILL TUNTAS. Beralih ke mode incremental (feed).", flush=True)


if __name__ == "__main__":
    main()
