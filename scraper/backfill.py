"""
Langkah 1 - BACKFILL STATLESS (Tanpa Kursor File)
- Membaca antrian `census_songs.jsonl`
- Mengambil semua `slug` yang sudah ada di database Supabase (pakai paginasi)
- Mencocokkan slug dari URL antrian TANPA me-request HTTP
- Mengambil tepat BACKFILL_LIMIT (default 800) lagu BARU yang belum ada
- Aman dijalankan kapan saja, tidak bergantung pada git commit kursor
"""
import json
import os
import re
import time

from chordtela_scraper import fetch, parse_detail, supabase

DIR = os.path.dirname(os.path.abspath(__file__))
QUEUE = os.path.join(DIR, "census_songs.jsonl")
LIMIT = int(os.getenv("BACKFILL_LIMIT", "800"))


def slugify(text: str) -> str:
    t = (text or "").lower().strip()
    t = re.sub(r"[^a-z0-9_ -]", "", t)
    t = re.sub(r"[-\s_]+", "-", t)
    return t.strip("-")


def get_slug_from_url(url: str, default_artist: str) -> str:
    # URL chordtela: .../2026/04/artist-title.html atau .../artist-title.html
    filename = url.rstrip("/").split("/")[-1].replace(".html", "")
    filename_slug = slugify(filename)
    art_slug = slugify(default_artist)
    if filename_slug.startswith(art_slug + "-"):
        return filename_slug
    return f"{art_slug}-{filename_slug}"


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


def main():
    print("Memuat data existing dari Supabase...", flush=True)
    existing_slugs = load_existing_slugs()
    print(f"Sudah ada di DB: {len(existing_slugs)} lagu", flush=True)

    queue = load_queue()
    print(f"Total antrian sensus: {len(queue)} lagu", flush=True)

    todo: list[dict] = []
    for item in queue:
        predicted = get_slug_from_url(item["song_url"], item.get("artist", ""))
        if predicted not in existing_slugs:
            todo.append({**item, "predicted_slug": predicted})

    print(f"Lagu BARU yang belum di-scrape: {len(todo)} lagu", flush=True)
    if not todo:
        print("BACKFILL SELESAI. Semua lagu sensus sudah masuk database.", flush=True)
        return

    batch = todo[:LIMIT]
    print(f"Men-scrape {len(batch)} lagu untuk sesi ini (LIMIT={LIMIT})...", flush=True)

    done = 0
    failed = 0
    t0 = time.time()

    for item in batch:
        url = item["song_url"]
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
            if done % 25 == 0:
                rate = done / (time.time() - t0) * 3600
                print(f"[{done}/{len(batch)}] {artist} - {title} | {rate:.0f}/jam", flush=True)
        except Exception as e:
            failed += 1
            print(f"[GAGAL INSERT] {song_slug} :: {e}", flush=True)

    print(f"\nSesi selesai: +{done} lagu baru tersimpan, {failed} gagal.", flush=True)
    print(f"Sisa lagu yang belum di-scrape: {len(todo) - done} lagu.", flush=True)


if __name__ == "__main__":
    main()
