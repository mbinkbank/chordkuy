"""
Langkah 1 - BACKFILL DENGAN CURSOR FILE
- Membaca antrian `census_songs.jsonl`
- Melanjutkan dari URL terakhir yang berhasil di-insert
- Tetap memeriksa slug existing di Supabase agar aman
- Menargetkan tepat BACKFILL_LIMIT lagu baru tersimpan per run (selama stok masih ada)
"""
import json
import os
import re
import time
from datetime import datetime, timezone

from chordtela_scraper import fetch, parse_detail, supabase

DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(DIR, "census_songs.jsonl")
CURSOR = os.path.join(DIR, "backfill_cursor.json")
LIMIT = int(os.getenv("BACKFILL_LIMIT", "800"))


def slugify(text: str) -> str:
    t = (text or "").lower().strip()
    t = re.sub(r"[^a-z0-9_ -]", "", t)
    t = re.sub(r"[-\s_]+", "-", t)
    return t.strip("-")


def get_slug_from_url(url: str, default_artist: str) -> str:
    filename = url.rstrip("/").split("/")[-1].replace(".html", "")
    filename_slug = slugify(filename)
    art_slug = slugify(default_artist)
    if art_slug and filename_slug.startswith(art_slug + "-"):
        return filename_slug
    return f"{art_slug}-{filename_slug}" if art_slug else filename_slug


def load_existing_slugs() -> set[str]:
    slugs = set()
    offset = 0
    while True:
        rows = supabase.table("chords").select("slug").range(offset, offset + 999).execute().data
        if not rows:
            break
        for r in rows:
            if r.get("slug"):
                slugs.add(r["slug"])
        offset += len(rows)
        if len(rows) < 1000:
            break
    return slugs


def load_queue() -> list[dict]:
    items = []
    with open(QUEUE, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if s:
                items.append(json.loads(s))
    return items


def load_cursor() -> dict:
    if not os.path.exists(CURSOR):
        return {"last_song_url": "", "last_done": "", "batch_count": 0}
    try:
        with open(CURSOR, encoding="utf-8") as f:
            data = json.load(f)
        return {
            "last_song_url": data.get("last_song_url", ""),
            "last_done": data.get("last_done", ""),
            "batch_count": int(data.get("batch_count", 0) or 0),
        }
    except Exception:
        return {"last_song_url": "", "last_done": "", "batch_count": 0}


def save_cursor(last_song_url: str, batch_count: int) -> None:
    payload = {
        "last_song_url": last_song_url,
        "last_done": datetime.now(timezone.utc).isoformat(),
        "batch_count": batch_count,
    }
    with open(CURSOR, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def build_scan_order(queue: list[dict], last_song_url: str) -> list[dict]:
    if not queue:
        return []
    if not last_song_url:
        return queue
    idx = next((i for i, item in enumerate(queue) if item.get("song_url") == last_song_url), -1)
    if idx == -1:
        return queue
    return queue[idx + 1 :] + queue[: idx + 1]


def main():
    print("Memuat data existing dari Supabase...", flush=True)
    existing_slugs = load_existing_slugs()
    print(f"Sudah ada di DB: {len(existing_slugs)} lagu", flush=True)

    queue = load_queue()
    print(f"Total antrian sensus: {len(queue)} lagu", flush=True)
    if not queue:
        print("Queue kosong.", flush=True)
        return

    cursor = load_cursor()
    last_song_url = cursor["last_song_url"]
    if last_song_url:
        print(f"Cursor terakhir: {last_song_url}", flush=True)
    scan_order = build_scan_order(queue, last_song_url)

    done = 0
    failed = 0
    checked = 0
    t0 = time.time()
    last_inserted_url = last_song_url

    for item in scan_order:
        if done >= LIMIT:
            break
        url = item["song_url"]
        checked += 1

        predicted = get_slug_from_url(url, item.get("artist", ""))
        if predicted in existing_slugs:
            print(f"[SKIP PREDIKSI DUPLIKAT] {predicted}", flush=True)
            continue

        try:
            html = fetch(url)
            parsed = parse_detail(html)
        except Exception as e:
            failed += 1
            print(f"[GAGAL FETCH] {url} :: {e}", flush=True)
            continue

        if not parsed or not parsed.get("content"):
            print(f"[SKIP KOSONG] {url}", flush=True)
            continue

        full_title = parsed.pop("full_title")
        if " - " in full_title:
            artist, title = (p.strip() for p in full_title.split(" - ", 1))
        else:
            artist, title = item.get("artist", "Unknown"), full_title

        song_slug = f"{slugify(artist)}-{slugify(title)}"
        art_slug = slugify(artist)

        if song_slug in existing_slugs:
            print(f"[SKIP DUPLIKAT] {song_slug}", flush=True)
            continue

        record = {
            "title": title,
            "artist": artist,
            "slug": song_slug,
            "artist_slug": art_slug,
            **parsed,
        }

        try:
            supabase.table("chords").insert(record).execute()
            existing_slugs.add(song_slug)
            done += 1
            last_inserted_url = url
            save_cursor(last_inserted_url, done)
            if done % 25 == 0:
                rate = done / max(time.time() - t0, 1) * 3600
                print(f"[{done}/{LIMIT}] {artist} - {title} | {rate:.0f}/jam", flush=True)
        except Exception as e:
            failed += 1
            print(f"[GAGAL INSERT] {song_slug} :: {e}", flush=True)

    if done == 0 and checked >= len(scan_order):
        print("BACKFILL SELESAI. Semua lagu sensus sudah masuk database.", flush=True)
        return

    print(f"\nSesi selesai: +{done} lagu baru tersimpan, {failed} gagal, {checked} URL diperiksa.", flush=True)
    print(f"Cursor baru: {last_inserted_url}", flush=True)


if __name__ == "__main__":
    main()
