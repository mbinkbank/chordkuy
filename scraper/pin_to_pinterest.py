"""Auto-pin harian ke Pinterest (API v5).

- Sumber gambar: https://chordkuy.id/pin/index.json (500 pin terpopuler, dibuat saat build)
- Skip yang sudah dipin: pin_history.jsonl (cursor, di-commit tiap run)
- Metadata lagu dari Supabase (judul, artis, kunci, capo, difficulty)
- Distribusi board Opsi A:
    * artis Barat (nama tanpa kata Indonesia umum + heuristik latin) -> "Chord Lagu Barat"
    * difficulty novice -> juga "Chord untuk Pemula" (bergantian)
    * sisanya -> "Chord Gitar Indonesia" / "Chord Lagu Populer" bergantian
- Auto-refresh access token (refresh token berlaku 1 tahun)

Env:
  PINTEREST_APP_ID, PINTEREST_APP_SECRET (GitHub Secrets)
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  PINS_PER_RUN (default 5)
"""
import base64
import json
import os
import sys
import time
from pathlib import Path

import httpx

DIR = Path(__file__).parent
HISTORY = DIR / "pin_history.jsonl"
SITE = "https://chordkuy.id"
API = "https://api.pinterest.com/v5"

APP_ID = os.environ["PINTEREST_APP_ID"]
APP_SECRET = os.environ["PINTEREST_APP_SECRET"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SVC = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PINS_PER_RUN = int(os.environ.get("PINS_PER_RUN", "5"))

# Heuristik artis Barat: pola nama umum EN; sisanya dianggap Indonesia/daerah
WEST_HINTS = (
    " the ", "ed sheeran", "taylor swift", "avril", "selena", "bruno", "billie", "olivia",
    "justin", "shawn", "coldplay", "maroon", "greenday", "green day", "nirvana", "beatles",
    "queen", "bon jovi", "guns", "metallica", "linkin", "sum 41", "blink", "oasis",
    "radiohead", "arctic", "keane", "sara", "sarah", "john", "james", "david", "michael",
    "eric", "bob marley", "passenger", "yellow", "kodaline", "train", "one republic",
    "onerepublic", "imagine", "miley", "katy", "rihanna", "beyonce", "adele", "sam smith",
    "lewis", "anne-marie", "dua lipa", "charlie", "shaun", "lauv", "troye", "conan",
    "alec benjamin", "james arthur", "james bay", "milo", "greylan", "alex crichton",
    "million hope", "sienna spiro", "sarah kinsley", "millionaires", "david Kushner",
)


def load_env_file() -> None:
    """Fallback lokal: baca backend/.env kalau env var belum lengkap."""
    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        return
    env_path = Path(r"D:\download\chordkuyid\backend\.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def load_history() -> set[str]:
    if not HISTORY.exists():
        return set()
    out = set()
    for line in HISTORY.read_text(encoding="utf-8").splitlines():
        try:
            out.add(json.loads(line)["slug"])
        except Exception:
            pass
    return out


def append_history(slug: str, board_id: str, pin_id: str) -> None:
    with HISTORY.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"slug": slug, "board": board_id, "pin": pin_id, "t": int(time.time())}) + "\n")


def get_access_token() -> str:
    """Ambil access token dari app_settings; refresh bila expiring < 1 hari."""
    r = httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers={"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json"},
        timeout=60,
    )
    # rpc exec_sql mungkin tidak ada — baca langsung via REST
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/app_settings?select=key,value",
        headers={"apikey": SVC, "Authorization": f"Bearer {SVC}"},
        timeout=60,
    )
    r.raise_for_status()
    settings = {row["key"]: row["value"] for row in r.json()}

    access = settings.get("pinterest_access_token")
    expires_at = int(float(settings.get("pinterest_expires_at", "0") or 0))
    if access and expires_at - time.time() > 86400:
        return access

    # refresh
    refresh = settings.get("pinterest_refresh_token")
    if not refresh:
        raise SystemExit("Tidak ada token. Buka https://chordkuy.id/api/pinterest/login dulu.")
    basic = base64.b64encode(f"{APP_ID}:{APP_SECRET}".encode()).decode()
    r = httpx.post(
        f"{API}/oauth/token",
        headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
        data={"grant_type": "refresh_token", "refresh_token": refresh},
        timeout=60,
    )
    if r.status_code == 401:
        # refresh token lama dicabut (Pinterest merotasi) -> butuh re-auth manual
        raise SystemExit("Refresh token invalid. Buka https://chordkuy.id/api/pinterest/login untuk re-auth.")
    r.raise_for_status()
    tok = r.json()

    def upsert(key: str, value: str) -> None:
        httpx.post(
            f"{SUPABASE_URL}/rest/v1/app_settings",
            headers={
                "apikey": SVC,
                "Authorization": f"Bearer {SVC}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates",
            },
            json={"key": key, "value": value, "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
            timeout=60,
        )

    upsert("pinterest_access_token", tok["access_token"])
    if tok.get("refresh_token"):
        upsert("pinterest_refresh_token", tok["refresh_token"])
    upsert("pinterest_expires_at", str(int(time.time() + tok.get("expires_in", 0) * 1000)))
    print("token di-refresh")
    return tok["access_token"]


def get_boards(token: str) -> dict[str, str]:
    r = httpx.get(f"{API}/boards", headers={"Authorization": f"Bearer {token}"}, timeout=60)
    r.raise_for_status()
    return {b["name"]: b["id"] for b in r.json().get("items", [])}


def is_western(artist: str) -> bool:
    a = " " + artist.lower() + " "
    return any(h in a for h in WEST_HINTS)


def pick_board(artist: str, difficulty: str, counter: int, boards: dict[str, str]) -> str | None:
    def find(*keywords: str) -> str | None:
        for name, bid in boards.items():
            low = name.lower()
            if any(k in low for k in keywords):
                return bid
        return None

    b_indo = find("indonesia")
    b_west = find("barat")
    b_begin = find("pemula")
    b_pop = find("populer")
    if is_western(artist):
        return b_west or b_pop or next(iter(boards.values()), None)
    if (difficulty or "").lower() == "novice" and b_begin and counter % 2 == 0:
        return b_begin
    return (b_pop if counter % 2 == 0 else b_indo) or b_indo or next(iter(boards.values()), None)


def song_meta(slug: str) -> dict | None:
    r = httpx.get(
        f"{SUPABASE_URL}/rest/v1/chords?select=title,artist,key_name,capo,difficulty&slug=eq.{slug}&limit=1",
        headers={"apikey": SVC, "Authorization": f"Bearer {SVC}"},
        timeout=60,
    )
    rows = r.json()
    return rows[0] if isinstance(rows, list) and rows else None


def main() -> None:
    load_env_file()
    done_before = load_history()

    r = httpx.get(f"{SITE}/pin/index.json", timeout=60)
    r.raise_for_status()
    all_slugs: list[str] = json.loads(r.text)
    queue = [s for s in all_slugs if s not in done_before]
    print(f"pin tersedia: {len(all_slugs)} | belum dipin: {len(queue)}")
    if not queue:
        print("SEMUA PIN HABIS. Jalankan generate-pin-images dengan limit lebih besar.")
        return

    token = get_access_token()
    boards = get_boards(token)
    if not boards:
        raise SystemExit("Tidak ada board di akun Pinterest. Buat dulu 4 papan yang direkomendasikan.")
    print(f"boards: {list(boards)}")

    created = failed = 0
    counter = sum(1 for _ in done_before)
    for slug in queue:
        if created >= PINS_PER_RUN:
            break
        meta = song_meta(slug)
        if not meta:
            append_history(slug, "skip-no-meta", "")
            continue
        title = f"Chord Gitar {meta['title']} - {meta['artist']}"
        capo = (meta.get("capo") or "").replace("fret", "").strip()
        desc = (
            f"Kunci gitar {meta['title']} — {meta['artist']}. "
            f"Kunci dasar {meta.get('key_name', 'C')}"
            + (f", capo fret {capo}" if capo and not capo.lower().startswith("no") else "")
            + ". Lirik + transpose + auto scroll di chordkuy.id "
            f"#chordgitar #kuncigitar #{''.join(meta['artist'].split())[:20]}"
        )
        board_id = pick_board(meta["artist"], meta.get("difficulty", ""), counter, boards)
        payload = {
            "board_id": board_id,
            "title": title[:100],
            "description": desc[:497],
            "media_source": {"source_type": "image_url", "url": f"{SITE}/pin/{slug}.png"},
            "link": f"{SITE}/chord/{slug}",
        }
        try:
            r = httpx.post(
                f"{API}/pins",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
                timeout=90,
            )
            if r.status_code in (200, 201):
                pin_id = r.json().get("id", "")
                board_name = next((n for n, i in boards.items() if i == board_id), board_id)
                append_history(slug, board_id, pin_id)
                created += 1
                counter += 1
                print(f"[{created}/{PINS_PER_RUN}] {title} -> {board_name}")
            else:
                failed += 1
                print(f"GAGAL {r.status_code}: {r.text[:120]} | {slug}")
                if r.status_code == 401:
                    raise SystemExit("Token invalid saat pin — perlu re-auth manual.")
                if failed >= 5:
                    print("Terlalu banyak gagal — berhenti.")
                    break
            time.sleep(3)
        except SystemExit:
            raise
        except Exception as e:
            failed += 1
            print(f"ERR {slug}: {e}")

    print(f"\nSELESAI: {created} pin dibuat, {failed} gagal.")
    if created == 0 and failed == 0:
        print("Tidak ada pin baru hari ini.")


if __name__ == "__main__":
    main()
