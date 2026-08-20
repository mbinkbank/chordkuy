import type { Song } from "../data/types";
import { formatViews } from "../lib/api";
import { Link } from "../lib/router";

interface Props {
  song: Song;
  index?: number;
  showArtist?: boolean;
}

export default function SongCard({ song, index, showArtist = true }: Props) {
  const initials = song.title.slice(0, 2).toUpperCase();

  return (
    <Link className="card song-card" href={`/chord/${song.slug}`}>
      {song.thumbnail ? (
        <img
          className="thumb"
          src={song.thumbnail}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="thumb" aria-hidden="true">
          {index !== undefined ? String(index + 1).padStart(2, "0") : initials}
        </span>
      )}

      <span style={{ minWidth: 0 }}>
        <span className="title">{song.title}</span>
        {showArtist && <span className="sub">{song.artist}</span>}
        {!showArtist && <span className="sub">{song.genre}</span>}
      </span>

      <span className="meta">
        <span className="badge" style={{ display: "inline-flex" }}>
          {song.originalKey}
        </span>
      </span>
    </Link>
  );
}
