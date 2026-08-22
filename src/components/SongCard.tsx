import type { Song } from "../data/types";
import { Link } from "../lib/router";
import { ListMusic } from "lucide-react";

interface Props {
  song: Song;
  index?: number;
  showArtist?: boolean;
}

export default function SongCard({ song, index, showArtist = true }: Props) {
  return (
    <Link className="card song-card" href={`/chord/${song.slug}`}>
      <span className="thumb" aria-hidden="true">
        <ListMusic size={18} />
      </span>

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
