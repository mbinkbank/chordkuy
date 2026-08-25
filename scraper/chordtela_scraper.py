"""
Chordtela Scraper - High Fidelity Text Extraction.
Preserves exact monospaced spaces, chords, and lyric alignment.
"""
import os
import re
import random
import subprocess
import time
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

BASE_URL = "https://www.chordtela.com"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/127.0.0.0 Safari/537.36"
)
DELAY_MIN = 2.0
DELAY_MAX = 5.0
LIMIT = int(os.getenv("DAILY_LIMIT", "300"))

BARRE_CHORDS = {"F", "Fm", "B", "Bm", "C#", "C#m", "D#", "D#m", "F#", "F#m", "G#", "G#m", "A#", "A#m", "Bb", "Bbm", "Eb", "Ebm", "Ab", "Abm"}

INTRO_LIKE_RE = re.compile(r"^(intro\s*:?|musik\s*:?|music\s*:?|outro\s*:?|int\.\s*|interlude\s*:?|solo\s*:?)", re.IGNORECASE)
EXPLICIT_SECTION_RE = re.compile(r"^(intro\s*:?|musik\s*:?|music\s*:?|verse\s*\d*:?|chorus\s*:?|bridge\s*:?|outro\s*:?|interlude\s*:?|int\s*[.:]?|solo\s*:?|reff\s*:?|hook\s*:?|coda\s*:?)$", re.IGNORECASE)
CHORD_FIND_RE = re.compile(
    r"(-?\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:/[A-G][#b]?)?"
    r"|-[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d|M)*(?:/[A-G][#b]?)?"
    r"|\([A-G][#b]?[^\s()]*\))"
)
CHORD_TOKEN_RE = re.compile(r"^([A-G][#b]?)((?:m|maj|min|dim|aug|sus|add|\d|M)*)(?:/([A-G][#b]?))?$")
NX_RE = re.compile(r"^\(\d+x?\)$", re.IGNORECASE)
DOTS_RE = re.compile(r"^\.+$")
MARKER_RE = re.compile(r"^\(\*+\)$")


def is_chord_token(token: str) -> bool:
    clean = re.sub(r"^[()\-\[\]]+|[()\-\[\]]+$", "", token.strip())
    return bool(CHORD_TOKEN_RE.match(clean))


def tokenize_line(line: str) -> list[tuple[str | None, str]]:
    """Pecah baris jadi segmen (chord|None, text) — port dari parseLineInplace."""
    segments: list[tuple[str | None, str]] = []
    last_idx = 0
    for m in CHORD_FIND_RE.finditer(line):
        start, end = m.span()
        if start > last_idx:
            segments.append((None, line[last_idx:start]))
        token = m.group(0)
        if is_chord_token(token):
            segments.append((token, ""))
        else:
            segments.append((None, token))
        last_idx = end
    if last_idx < len(line):
        segments.append((None, line[last_idx:]))
    return segments or [(None, line)]


def _seg_is_noise(text: str) -> bool:
    t = text.strip()
    return not t or bool(NX_RE.match(t)) or bool(DOTS_RE.match(t))


def is_chord_only(segments) -> bool:
    return all(chord is not None or _seg_is_noise(text) for chord, text in segments)


def is_lyrics(segments) -> bool:
    return any(
        chord is None and (t := text.strip()) and not NX_RE.match(t) and not DOTS_RE.match(t)
        for chord, text in segments
    )


def joined_text(segments) -> str:
    return "".join(chord if chord else text for chord, text in segments).strip()


def is_marker(segments) -> bool:
    return bool(MARKER_RE.match(joined_text(segments)))


def normalize(raw: str) -> str:
    """NBSP & replacement char -> spasi biasa."""
    return raw.replace("\u00a0", " ").replace("\ufffd", "")


def structure_sheet(raw_text: str) -> list[dict]:
    """Ubah teks mentah jadi struktur: section / line / blank."""
    rows = raw_text.replace("\r\n", "\n").split("\n")
    out: list[dict] = []
    for row in rows:
        trimmed = row.strip()
        if not trimmed:
            out.append({"type": "blank"})
            continue
        if re.match(r"^[-_=]+$", trimmed):
            continue
        original_chord = re.sub(r"[\[\]()=_\-]+", " ", trimmed)
        original_chord = re.sub(r"\s+", " ", original_chord).strip()
        if re.match(r"^original\s+chord$", original_chord, re.IGNORECASE):
            out.append({"type": "section", "label": "ORIGINAL CHORD"})
            continue
        prefix = INTRO_LIKE_RE.match(trimmed)
        if prefix and len(trimmed) > prefix.end():
            label = prefix.group(0)
            rest = row[row.index(label) + len(label):].lstrip()
            out.append({"type": "section", "label": label})
            out.append({"type": "line", "segments": tokenize_line(rest)})
            continue
        bracketed = trimmed.startswith("[") and trimmed.endswith("]") and not is_chord_token(trimmed[1:-1])
        if bracketed or EXPLICIT_SECTION_RE.match(trimmed):
            out.append({"type": "section", "label": trimmed})
            continue
        out.append({"type": "line", "segments": tokenize_line(row)})
    return out


def apply_blank_rules(items: list[dict]) -> list[dict]:
    """Aturan blank line yang sama dengan parser web."""
    cleaned: list[dict] = []
    for i, item in enumerate(items):
        if item["type"] == "blank":
            prev = next((x for x in reversed(cleaned) if x["type"] != "blank"), None)
            nxt = next((x for x in items[i + 1:] if x["type"] != "blank"), None)

            def line_ok(x):
                return x is not None and x["type"] == "line"

            remove = False
            if line_ok(nxt) and not is_marker(nxt["segments"]):
                prev_chord = line_ok(prev) and is_chord_only(prev["segments"])
                prev_lyr = line_ok(prev) and is_lyrics(prev["segments"])
                next_chord = is_chord_only(nxt["segments"])
                next_lyr = is_lyrics(nxt["segments"])
                remove = (prev_chord and next_lyr) or (prev_lyr and next_chord) or (prev_chord and next_chord)
            if remove:
                continue
            if cleaned and cleaned[-1]["type"] == "blank":
                continue
            cleaned.append(item)
            continue
        cleaned.append(item)
    return cleaned


def format_intro_runs(items: list[dict]) -> list[dict]:
    """Rata kiri run chord di bawah label instrumental + blank di akhir run."""
    result: list[dict] = []
    i = 0
    while i < len(items):
        cur = items[i]
        result.append(cur)
        if cur["type"] == "section" and INTRO_LIKE_RE.match(cur["label"].strip()):
            j = i + 1
            while j < len(items) and items[j]["type"] == "blank":
                j += 1
            run_lines = []
            while (
                j < len(items)
                and items[j]["type"] == "line"
                and is_chord_only(items[j]["segments"])
                and not (
                    j + 1 < len(items)
                    and items[j + 1]["type"] == "line"
                    and is_lyrics(items[j + 1]["segments"])
                    and not is_marker(items[j + 1]["segments"])
                )
            ):
                run_lines.append(items[j])
                j += 1
                while j < len(items) and items[j]["type"] == "blank":
                    j += 1
            if run_lines:
                for l in run_lines:
                    first_chord, first_text = l["segments"][0]
                    if first_chord is None and first_text.startswith(" "):
                        new_seg = [(None, first_text.lstrip())] + list(l["segments"][1:])
                        result.append({"type": "line", "segments": new_seg})
                    else:
                        result.append(l)
                stop = items[j] if j < len(items) else None
                if (
                    stop is not None
                    and stop["type"] == "line"
                    and not is_marker(stop["segments"])
                    and result[-1]["type"] != "blank"
                ):
                    result.append({"type": "blank"})
                i = j
                continue
        i += 1
    return result


def dedent_blocks(items: list[dict]) -> str:
    """Hapus prefix spasi sama di setiap blok; posisi chord-lirik tetap relatif sama."""
    lines_out: list[str] = []
    block: list[dict] = []

    def first_indent(b: dict) -> int:
        c, t = b["segments"][0]
        if c is not None or not t.startswith(" "):
            return 0
        return len(t) - len(t.lstrip(" "))

    def flush():
        nonlocal block
        if not block:
            return
        min_indent = min(first_indent(b) for b in block)
        for b in block:
            segs = list(b["segments"])
            fc, ft = segs[0]
            if min_indent > 0 and fc is None and len(ft) >= min_indent:
                segs[0] = (None, ft[min_indent:])
            lines_out.append("".join(c if c else t for c, t in segs))
        block = []

    for item in items:
        if item["type"] == "section":
            flush()
            if lines_out and lines_out[-1] != "":
                lines_out.append("")
            lines_out.append(item["label"])
        elif item["type"] == "blank":
            flush()
            lines_out.append("")
        else:
            block.append(item)
    flush()
    return "\n".join(lines_out).strip()


def format_content(raw_text: str) -> str:
    text = normalize(raw_text)
    items = apply_blank_rules(structure_sheet(text))
    items = format_intro_runs(items)
    return dedent_blocks(items)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


PROXY_BASE = os.getenv("SCRAPE_PROXY_URL", "").rstrip("/")
SCRAPER_TOKEN = os.getenv("SCRAPE_PROXY_TOKEN", "")


def fetch(url: str) -> bytes:
    print(f"[GET] {url}", flush=True)
    if PROXY_BASE:
        import json as _json
        import urllib.error
        import urllib.parse
        import urllib.request

        endpoint = f"{PROXY_BASE}/api/scrape-fetch?url={urllib.parse.quote(url, safe='')}"
        req = urllib.request.Request(
            endpoint,
            headers={
                "x-scraper-token": SCRAPER_TOKEN,
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = _json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"proxy HTTP {e.code} pada {e.url[:80]}") from None
        if data.get("status") != 200:
            raise RuntimeError(f"upstream HTTP {data.get('status')} via proxy untuk {url}")
        time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
        return data["body"].encode()
    res = subprocess.run(
        ["curl", "-s", "-L", "-A", USER_AGENT, url],
        capture_output=True,
        timeout=60,
    )
    res.check_returncode()
    time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
    return res.stdout


def extract_chords(text: str) -> list[str]:
    if not text:
        return []
    matches = re.findall(r'\b[A-G][b#]?(?:m|maj|min|dim|aug|sus|add|\d)*\b', text)
    return list(dict.fromkeys(matches))


ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def detect_key(ordered_chords: list[str]) -> str:
    """Kunci asli = chord pertama; kalau minor dan relative major-nya ikut muncul, pakai relative major."""
    if not ordered_chords:
        return "C"
    first = ordered_chords[0]
    m = re.match(r"^([A-G][#b]?)m$", first)
    if m and m.group(1) in ROOTS:
        rel = ROOTS[(ROOTS.index(m.group(1)) + 3) % 12]
        if rel in ordered_chords:
            return rel
    return first


def calculate_difficulty(content: str) -> str:
    if not content:
        return "novice"
    chords = set(extract_chords(content))
    unique_count = len(chords)
    has_barre = any(c in BARRE_CHORDS for c in chords)
    complex_types = sum(1 for c in chords if any(x in c for x in ['7', '9', '11', '13', 'dim', 'aug', 'sus', 'add', '/', 'm7', 'maj7']))

    if unique_count >= 10 or complex_types >= 4:
        return "advanced"
    elif has_barre or unique_count >= 5 or complex_types >= 1:
        return "intermediate"
    else:
        return "novice"


def clean_content(raw_text: str) -> str:
    if not raw_text:
        return ""
    lines = raw_text.split("\n")
    start_idx = -1
    section_pattern = re.compile(r'^\s*(?:#+|\[)?\s*(intro|verse\s*1?|chorus|reff|hook)\b', re.IGNORECASE)
    
    for idx, line in enumerate(lines):
        trimmed = line.strip()
        if section_pattern.search(trimmed):
            start_idx = idx
            break
        if re.match(r'^-{5,}$', trimmed):
            start_idx = idx + 1
            break

    # Hanya buang baris sampah di atas jika label section muncul sangat awal.
    # Jika konten dimulai langsung dengan chord tanpa label (tanpa Intro), JANGAN dipotong.
    if start_idx != -1 and 0 < start_idx < len(lines) and start_idx <= 5:
        lines = lines[start_idx:]
    
    return "\n".join(lines).strip()


def parse_detail(html_str: str) -> dict | None:
    soup = BeautifulSoup(html_str, "html.parser")
    title_tag = soup.select_one("h1.post-title.entry-title")
    if not title_tag:
        return None
    full_title = title_tag.get_text(strip=True)
    full_title = re.sub(r'^(Kunci Gitar|Chord)\s+', '', full_title, flags=re.IGNORECASE)
    full_title = re.sub(r'\s+(Chord Dasar|Chord)\s*$', '', full_title, flags=re.IGNORECASE).strip()

    telabox = soup.select_one("div.telabox pre") or soup.select_one("div.telabox")
    if not telabox:
        return None
    
    # Hapus elemen tooltip chordtela agar tidak merusak spasi
    for span in telabox.select("span.custom, span.tbi-tooltip span"):
        span.decompose()

    for br in telabox.find_all("br"):
        br.replace_with("\n")

    # Ambil teks mentah murni dengan spasi asli
    raw_text = telabox.get_text()

    # Extract Capo
    capo_match = re.search(r"capo[^\d\n]*(\d+)", raw_text, re.IGNORECASE)
    capo = f"fret {capo_match.group(1)}" if capo_match else "No capo"

    # Extract Tuning
    tuning_match = re.search(r"tuning[^\w]*([A-G\s#b]+)", raw_text, re.IGNORECASE)
    tuning = tuning_match.group(1).strip() if tuning_match else "E A D G B E"

    # Trim content agar mulai dari intro, lalu format bersih (aturan tampilan web)
    content = clean_content(normalize(raw_text))
    if not content:
        content = raw_text
    content = format_content(content)

    # Detect Key Name
    chords = extract_chords(content)
    key_name = detect_key(chords)

    # Calculate Difficulty
    difficulty = calculate_difficulty(content)

    # Generate Rating
    rating = round(random.uniform(4.6, 5.0), 1)

    return {
        "full_title": full_title,
        "content": content,
        "key_name": key_name,
        "capo": capo,
        "tuning": tuning,
        "difficulty": difficulty,
        "rating": rating,
        "language": "ID",
    }


def _pid_alive(pid: str) -> bool:
    if not pid.isdigit():
        return False
    p = int(pid)
    if os.name == "nt":
        import subprocess as _sp
        out = _sp.run(["tasklist", "/FI", f"PID eq {p}"], capture_output=True, text=True).stdout.lower()
        return "python" in out
    return os.path.exists(f"/proc/{p}")


def main():
    lock = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scrape.lock")
    if os.path.exists(lock):
        old = open(lock).read().strip()
        if _pid_alive(old):
            print(f"Scraper sudah berjalan (PID {old}). Keluar.", flush=True)
            return
    open(lock, "w").write(str(os.getpid()))
    try:
        _run()
    finally:
        if os.path.exists(lock):
            os.remove(lock)


def _run():
    print(f"Mode fetch: {'PROXY (' + PROXY_BASE + ')' if PROXY_BASE else 'LANGSUNG (curl)'}", flush=True)
    existing = set()
    try:
        rows = supabase.table("chords").select("title,artist").execute().data
        for r in rows:
            existing.add((r["title"].lower().strip(), r["artist"].lower().strip()))
        print(f"Data existing: {len(existing)} lagu", flush=True)
    except Exception:
        pass

    pages = [
        "chord-gitar-a-b", "chord-gitar-c-d", "chord-gitar-e-f",
        "chord-gitar-g-h", "chord-gitar-i-j", "chord-gitar-k-l",
        "chord-gitar-m-n", "chord-gitar-o-p", "chord-gitar-q-r",
        "chord-gitar-s-t", "chord-gitar-u-v", "chord-gitar-w-x",
        "chord-gitar-y-z",
    ]

    artists = []
    for page_path in pages:
        try:
            html = fetch(f"{BASE_URL}/{page_path}")
            soup = BeautifulSoup(html, "html.parser")
            for link in soup.select("a[href*='/chord/'], a[href*='/kumpulan-chord/']"):
                name_tag = link.find("span")
                name = name_tag.get_text(strip=True) if name_tag else link.get_text(strip=True)
                href = urljoin(BASE_URL, link["href"])
                if name and href.startswith(BASE_URL) and "/chord/" in href:
                    artists.append((name, href))
        except Exception as e:
            print(f"[ERROR PAGE] {page_path}: {e}", flush=True)

    random.shuffle(artists)
    print(f"Daftar artis ditemukan: {len(artists)} (urutan diacak)", flush=True)

    collected = 0
    seen_urls = set()

    for artist_name, artist_url in artists:
        if collected >= LIMIT:
            break
        try:
            art_html = fetch(artist_url)
            art_soup = BeautifulSoup(art_html, "html.parser")
            main_sec = art_soup.select_one(".main-wrapper") or art_soup
            for widget in main_sec.select(".widget_recent_entries"):
                widget.decompose()

            songs = []
            for link in main_sec.select('a[href*="/20"][href$=".html"]'):
                href = urljoin(BASE_URL, link["href"])
                if href.startswith(BASE_URL) and "/20" in href:
                    songs.append(href)

            for song_url in songs:
                if collected >= LIMIT:
                    break
                if song_url in seen_urls:
                    continue
                seen_urls.add(song_url)

                try:
                    song_html = fetch(song_url)
                    parsed = parse_detail(song_html)
                    if not parsed or not parsed["content"]:
                        print(f"[SKIP] {song_url}", flush=True)
                        continue

                    full_title = parsed.pop("full_title")
                    if " - " in full_title:
                        parts = full_title.split(" - ", 1)
                        artist = parts[0].strip()
                        title = parts[1].strip()
                    else:
                        artist = artist_name
                        title = full_title

                    key = (title.lower().strip(), artist.lower().strip())
                    if key in existing:
                        print(f"[SKIP] sudah ada: {artist} - {title}", flush=True)
                        continue

                    record = {
                        "title": title,
                        "artist": artist,
                        **parsed,
                    }

                    supabase.table("chords").insert(record).execute()
                    collected += 1
                    existing.add(key)
                    print(f"[{collected}/{LIMIT}] {artist} - {title} (Key: {record['key_name']}, Capo: {record['capo']})", flush=True)
                except Exception as e:
                    print(f"[ERROR] {song_url}: {e}", flush=True)
        except Exception as e:
            print(f"[ERROR ARTIST] {artist_url}: {e}", flush=True)

    print(f"\nSelesai! {collected} lagu Chordtela dengan struktur akurat tersimpan.", flush=True)


if __name__ == "__main__":
    main()
