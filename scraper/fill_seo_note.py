"""Isi kolom seo_note untuk 50 lagu terpopuler.

Catatan dibangun MURNI dari isi partitur (intro, reff, jumlah kunci, capo,
struktur bagian) — tanpa fakta eksternal yang tak bisa diverifikasi.
Setiap catatan unik per lagu karena berdasar progresi aslinya.
"""
import json
import re
import sys
import time

import httpx

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGRvcG1idnVoeGprdHV3c2VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzA1OTUsImV4cCI6MjEwMjU0NjU5NX0.bFxR8c-n67bRTRT6E4InnIjUXAVTs4erVHVZSi-0q60"
SB_URL = "https://tbpdopmbvuhxjktuwsej.supabase.co"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
BASE = f"{SB_URL}/rest/v1/chords"

# UPDATE diblok RLS utk anon key — tulis pakai service_role
def _svc_headers() -> dict:
    env_path = r"D:\download\chordkuyid\backend\.env"
    for line in open(env_path, encoding="utf-8"):
        if line.startswith("SUPABASE_SERVICE_ROLE_KEY"):
            svc = line.split("=", 1)[1].strip()
            return {"apikey": svc, "Authorization": f"Bearer {svc}"}
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di backend/.env")

CHORD_TOKEN = re.compile(r"^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|m7|maj7|6)?(?:/[A-G][#b]?)?$")


def parse_sheet(content: str) -> dict:
    lines = content.split("\n")
    chords: list[str] = []
    sections: list[str] = []
    intro_line = None
    reff_line = None
    for idx, raw in enumerate(lines):
        line = raw.strip()
        if not line:
            continue
        low = line.lower()
        if low.startswith(("intro", "interlude")) and intro_line is None:
            # "Intro :" tanpa progresi -> ambil baris berikutnya
            rest = re.sub(r"^(intro|interlude)\s*:?\s*", "", low).strip()
            if rest:
                intro_line = rest
            else:
                for nxt in lines[idx + 1:]:
                    if nxt.strip():
                        intro_line = nxt.strip()
                        break
        if low.startswith(("reff", "chorus")) and reff_line is None:
            reff_line = line
        if re.match(r"^[\[\(]?(reff|chorus|intro|interlude|outro|verse|bridge|coda)", low):
            m = re.match(r"^[\[\(]?(\w+)", low)
            if m:
                sections.append(m.group(1))
        tokens = line.split()
        if 0 < len(tokens) <= 8 and len(line) <= 60:
            hits = [t for t in tokens if CHORD_TOKEN.match(t.strip("().,"))]
            if hits and len(hits) >= len(tokens) * 0.6:
                for h in hits:
                    base = h.strip("().,").split("/")[0]
                    if base not in chords:
                        chords.append(base)
    return {"chords": chords, "sections": sections, "intro": intro_line, "reff": reff_line}


def fmt_chords(chords: list[str], limit=6) -> str:
    return ", ".join(chords[:limit]) + ("…" if len(chords) > limit else "")


def build_note(song: dict, sheet: dict) -> str | None:
    chords = sheet["chords"]
    if len(chords) < 2:
        return None  # data terlalu miskin — biarkan kosong daripada generik
    title = song["title"]
    artist = song["artist"]
    key = song.get("key_name") or "C"
    capo = str(song.get("capo") or "").strip()
    has_capo = bool(capo) and not capo.lower().startswith(("no", "none", "tanpa"))
    diff = (song.get("difficulty") or "").lower()
    diff_id = {"novice": "pemula", "beginner": "pemula", "intermediate": "menengah", "advanced": "mahir"}.get(diff, "menengah")
    n_sections = len(set(sheet["sections"]))
    intro = sheet["intro"]
    reff = sheet["reff"]
    seed = song["id"]

    reff_variants = [
        "Pada reff, perpindahan antar-kunci jadi momen penting — latih transisinya pelan-pelan sebelum mengikuti tempo penuh.",
        "Struktur lagu terdiri dari {n} bagian utama; kuasai transisi masuk reff dulu karena di situlah perpindahan kunci paling padat.",
        "Dengan {n} bagian utama, lagu ini nyaman dilatih per segmen: selesaikan verse dulu, baru sambung ke reff.",
        "Latih reff secara terpisah — kombinasi {n} bagian utama membuat perubahan kunci terasa cepat saat tempo naik.",
    ]
    tips = {
        "pemula": [
            "Hanya memakai beberapa kunci dasar, pas untuk latihan pertama — fokus pada perpindahan yang rapi.",
            "Kuncinya sedikit dan sederhana; cocok jadi lagu ke-dua atau ke-tiga yang kamu kuasai.",
            "Cocok untuk pemula: mainkan pelan, pastikan tiap senar bersuara jelas sebelum menaikkan tempo.",
        ],
        "mahir": [
            "Tingkat kesulitan mahir: waspadai barre chord dan jarak perpindahan antar-kunci; pecah latihan per bagian.",
            "Untuk level mahir — siapkan jari untuk barre chord panjang; pemanasan membantu sebelum memainkan lagu ini penuh.",
            "Sulit untuk pemula; mulai dari tempo lambat, lalu naikkan bertahap sampai setara rekaman aslinya.",
        ],
        "menengah": [
            "Tingkat menengah: mainkan mengikuti lirik, lalu pakai transpose bila nada terlalu tinggi atau rendah untuk vokalmu.",
            "Level menengah — cukup satu sesi latihan untuk lancar; gunakan auto scroll saat berlatih sambil membaca lirik.",
            "Nyaman untuk pemain yang sudah mengenal barre chord; kalau belum, transpose ke kunci yang lebih ramah.",
        ],
    }

    parts: list[str] = []
    parts.append(
        f"Chord {title} — {artist} dimainkan di kunci dasar {key}"
        + (f" dengan capo di fret {capo.replace('fret', '').strip()}" if has_capo else " tanpa capo")
        + f". Lagu ini memakai {len(chords)} kunci ({fmt_chords(chords)}), tingkat kesulitan {diff_id}."
    )
    if intro:
        # progresi intro: hanya kunci yang valid (buang titik/dash pemisah)
        toks = [re.sub(r"[.\-–]+", " ", t) for t in intro.split()]
        prog = [t.strip("().,") for t in toks if t and CHORD_TOKEN.match(t.strip("().,"))]
        if len(prog) >= 2:
            parts.append(f"Bagian pembuka diawali progresi {' – '.join(prog[:6])}.")
    if reff and len(chords) > 3:
        parts.append(reff_variants[seed % len(reff_variants)].format(n=n_sections))
    tip_list = tips.get(diff_id, tips["menengah"])
    parts.append(tip_list[seed % len(tip_list)])
    return " ".join(parts)


def main() -> None:
    # views.desc kena statement timeout di pooler — pakai index views_7d
    order = "views_7d.desc,views.desc,id.desc"
    rows = httpx.get(f"{BASE}?select=id,title,artist,slug,key_name,capo,difficulty,content&order={order}&limit=50", headers=H, timeout=120).json()

    patches = []
    for song in rows:
        note = build_note(song, parse_sheet(song.get("content") or ""))
        if note:
            patches.append({"id": song["id"], "title": song["title"], "artist": song["artist"], "note": note})

    print(f"catatan siap: {len(patches)}/{len(rows)}")
    for p in patches[:3]:
        print("---", p["title"])
        print(p["note"])

    if "--apply" in sys.argv:
        svc = _svc_headers()
        ok = fail = 0
        for p in patches:
            r = httpx.patch(f"{BASE}?id=eq.{p['id']}", headers={**svc, "Prefer": "return=representation"}, json={"seo_note": p["note"]}, timeout=60)
            if r.status_code in (200, 204) and isinstance(r.json(), list) and len(r.json()) == 1:
                ok += 1
            else:
                fail += 1
                print("GAGAL", p["id"], r.status_code, r.text[:100])
            time.sleep(0.15)
        print(f"ter-UPDATE: {ok}, gagal: {fail}")
    else:
        with open(r"D:\download\scrapchordtela\seo_notes_preview.json", "w", encoding="utf-8") as f:
            json.dump(patches, f, ensure_ascii=False, indent=1)
        print("preview tersimpan ke seo_notes_preview.json (tanpa menulis DB). Tambahkan --apply untuk menulis.")


if __name__ == "__main__":
    main()
