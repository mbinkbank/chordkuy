import type { Artist } from "../data/types";
import { useI18n } from "../lib/i18n";
import { getSongsByArtist } from "../lib/api";
import { Link } from "../lib/router";
import { UserStar } from "lucide-react";

export default function ArtistCard({ artist }: { artist: Artist }) {
  const { t } = useI18n();
  const total = getSongsByArtist(artist.slug).length;

  return (
    <Link className="card artist-card" href={`/artist/${artist.slug}`}>
      <span className="avatar" aria-hidden="true">
        <UserStar size={18} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="title" style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
          {artist.name}
        </span>
        <span className="sub" style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
          {total} {t("songs")} · {artist.genres.join(", ")}
        </span>
      </span>
    </Link>
  );
}
