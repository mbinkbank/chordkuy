export interface BookmarkItem {
  slug: string;
  title: string;
  artist: string;
}

const KEY = "chordlab:bookmarks";
const EVENT = "bookmarks:changed";

export function getBookmarks(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookmarkItem[]) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().some((b) => b.slug === slug);
}

/** true = sekarang tersimpan, false = dihapus */
export function toggleBookmark(item: BookmarkItem): boolean {
  const list = getBookmarks();
  const idx = list.findIndex((b) => b.slug === item.slug);
  let added: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    added = false;
  } else {
    list.unshift(item);
    added = true;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage penuh/disabled — abaikan */
  }
  return added;
}

export function removeBookmark(slug: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(getBookmarks().filter((b) => b.slug !== slug)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* abaikan */
  }
}

export function onBookmarksChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
