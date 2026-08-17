import type { Artist } from "../data/types";
import { getSongsByArtist } from "../lib/api";
import { Link } from "../lib/router";

export default function ArtistCard({ artist }: { artist: Artist }) {
  const total = getSongsByArtist(artist.slug).length;
  const initials = artist.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <Link className="card artist-card" href={`/artist/${artist.slug}`}>
      <span className="avatar" aria-hidden="true">
        {initials}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="title" style={{ display: "block", fontSize: 13, fontWeight: 600 }}>
          {artist.name}
        </span>
        <span className="sub" style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
          {total} lagu · {artist.genres.join(", ")}
        </span>
      </span>
    </Link>
  );
}
