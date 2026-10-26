"""Sisir antrian sensus, sisakan HANYA URL yang belum ada di DB -> census_pending.jsonl

Kenapa: backfill.py memutar seluruh census (46.538 URL) dan kehabisan
MAX_RUNTIME (150m) sebelum mencapai kandidat baru, sehingga kursor mandek
dan setiap run mengulang dari titik yang sama.

Pemakaian: python build_pending_queue.py
"""
import json
import re

import httpx

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
B = "https://tbpdopmbvuhxjktuwsej.supabase.co/rest/v1/chords"
QUEUE = r"D:\download\chordkuyid\scraper\census_songs.jsonl"
OUT = r"D:\download\chordkuyid\scraper\census_pending.jsonl"


def slugify(text: str) -> str:
    t = (text or "").lower().strip()
    t = re.sub(r"[^a-z0-9_ -]", "", t)
    t = re.sub(r"[-\s_]+", "-", t)
    return t.strip("-")


def main() -> None:
    slugs, urls = set(), set()
    for off in range(0, 40000, 1000):
        r = httpx.get(f"{B}?select=slug,source_url&order=id.asc&limit=1000&offset={off}", headers=H, timeout=60)
        rows = r.json()
        if not isinstance(rows, list) or not rows:
            break
        for x in rows:
            if x.get("slug"):
                slugs.add(x["slug"])
            if x.get("source_url"):
                urls.add(x["source_url"])
        if len(rows) < 1000:
            break

    pending = []
    for line in open(QUEUE, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        item = json.loads(line)
        u = item["song_url"]
        if u in urls:
            continue
        fn = u.rstrip("/").split("/")[-1].replace(".html", "")
        fn_s = slugify(fn)
        art = slugify(item.get("artist", ""))
        cands = [fn_s] if fn_s else []
        if art:
            cands.append(fn_s if fn_s.startswith(art + "-") else f"{art}-{fn_s}")
        if any(c in slugs for c in cands):
            continue
        pending.append(item)

    with open(OUT, "w", encoding="utf-8") as f:
        for it in pending:
            f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print(f"pending: {len(pending)} URL -> {OUT}")


if __name__ == "__main__":
    main()
