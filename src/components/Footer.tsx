import { getGenres, getPopularArtists } from "../lib/api";
import { Link } from "../lib/router";
import { SITE } from "../lib/site";

export default function Footer() {
  const artists = getPopularArtists(4);
  const genres = getGenres().slice(0, 5);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h2>{SITE.name}</h2>
            <p className="small muted" style={{ maxWidth: "40ch" }}>
              {SITE.description}
            </p>
            <p className="caption" style={{ marginTop: "var(--s3)" }}>
              <span className="badge">v1.0 · static</span>
            </p>
          </div>

          <nav aria-label="Jelajahi">
            <h2>Jelajahi</h2>
            <ul className="footer-links">
              <li>
                <Link href="/search">Cari chord</Link>
              </li>
              <li>
                <Link href="/artists">Daftar artis</Link>
              </li>
              <li>
                <Link href="/about">Tentang kami</Link>
              </li>
              <li>
                <Link href="/contact">Kontak</Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Artis populer">
            <h2>Artis</h2>
            <ul className="footer-links">
              {artists.map((artist) => (
                <li key={artist.slug}>
                  <Link href={`/artist/${artist.slug}`}>{artist.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Genre dan legal">
            <h2>Genre</h2>
            <ul className="footer-links">
              {genres.map((genre) => (
                <li key={genre.slug}>
                  <Link href={`/search?q=${encodeURIComponent(genre.name)}`}>{genre.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} {SITE.name}. Chord untuk keperluan belajar dan latihan.
          </span>
          <span className="row" style={{ gap: "var(--s3)" }}>
            <Link href="/privacy">Kebijakan Privasi</Link>
            <Link href="/terms">Syarat &amp; Ketentuan</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
