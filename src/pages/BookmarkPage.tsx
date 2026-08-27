import { useEffect, useState } from "react";
import { Bookmark, BookmarkX, Music } from "lucide-react";
import { getBookmarks, onBookmarksChange, removeBookmark, type BookmarkItem } from "../lib/bookmarks";
import { useI18n } from "../lib/i18n";
import { Link } from "../lib/router";
import { useSeo, webPageSchema } from "../lib/seo";
import { SITE } from "../lib/site";

export default function BookmarkPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    setItems(getBookmarks());
    return onBookmarksChange(() => setItems(getBookmarks()));
  }, []);

  useSeo({
    title: `${t("bookmarkTitle")} | ${SITE.name}`,
    description: "Daftar chord yang kamu simpan di perangkat ini.",
    path: "/bookmark",
    noindex: true,
    jsonLd: [webPageSchema(t("bookmarkTitle"), "Daftar chord tersimpan", "/bookmark")],
  });

  return (
    <main className="container" id="main" style={{ padding: "var(--s5) 0" }}>
      <h1 style={{ fontSize: 24, margin: "0 0 var(--s4)" }}>{t("bookmarkTitle")}</h1>

      {items.length === 0 ? (
        <div className="empty">
          <Bookmark size={28} strokeWidth={1.6} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>
            {t("bookmarkEmpty")}
          </p>
        </div>
      ) : (
        <ul className="bookmark-list">
          {items.map((b) => (
            <li key={b.slug} className="bookmark-item">
              <Music size={16} strokeWidth={1.8} aria-hidden="true" />
              <Link href={`/chord/${b.slug}`} className="bookmark-link">
                <strong>{b.title}</strong>
                <span>{b.artist}</span>
              </Link>
              <button
                type="button"
                className="bookmark-remove"
                aria-label={`Hapus ${b.title} dari bookmark`}
                onClick={() => removeBookmark(b.slug)}
              >
                <BookmarkX size={18} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
