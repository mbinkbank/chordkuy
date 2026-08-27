import { lazy, Suspense, useEffect, useState } from "react";
import { I18nProvider } from "./lib/i18n";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { getArtistBySlug, getSongBySlug } from "./lib/api";
import { useRoute } from "./lib/router";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import type { Artist, Song } from "./data/types";

const ChordPage = lazy(() => import("./pages/ChordPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const ArtistsPage = lazy(() => import("./pages/ArtistsPage"));
const BookmarkPage = lazy(() => import("./pages/BookmarkPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/LegalPages").then((m) => ({ default: m.TermsPage })));

function Loading() {
  return <div className="container" style={{ padding: "40px 0", color: "var(--muted)" }}>Memuat...</div>;
}

function View() {
  const route = useRoute();
  const [artist, setArtist] = useState<Artist | null | undefined>(undefined);
  const [song, setSong] = useState<Song | null | undefined>(undefined);

  useEffect(() => {
    if (route.name === "artist") {
      setArtist(undefined);
      getArtistBySlug(route.params.slug).then(setArtist);
    } else if (route.name === "chord") {
      setSong(undefined);
      getSongBySlug(route.params.slug).then(setSong);
    }
  }, [route.name, route.params.slug]);

  let page: React.ReactNode;
  switch (route.name) {
    case "home":
      page = <HomePage />;
      break;
    case "search":
      page = <SearchPage />;
      break;
    case "artists":
      page = <ArtistsPage />;
      break;
    case "artist":
      if (artist === undefined) {
        page = <div className="container" style={{ padding: "40px 0" }}>Memuat artis...</div>;
      } else {
        page = artist ? <ArtistPage key={artist.slug} artist={artist} /> : <NotFoundPage />;
      }
      break;
    case "chord":
      if (song === undefined) {
        page = <div className="container" style={{ padding: "40px 0" }}>Memuat chord...</div>;
      } else {
        page = song ? <ChordPage key={song.slug} song={song} /> : <NotFoundPage />;
      }
      break;
    case "bookmark":
      page = <BookmarkPage />;
      break;
    case "about":
      page = <AboutPage />;
      break;
    case "contact":
      page = <ContactPage />;
      break;
    case "privacy":
      page = <PrivacyPage />;
      break;
    case "terms":
      page = <TermsPage />;
      break;
    default:
      page = <NotFoundPage />;
  }

  return <Suspense fallback={<Loading />}>{page}</Suspense>;
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    document.body.dataset.home = route.name === "home" ? "true" : "";
  }, [route.name]);

  return (
    <I18nProvider>
      <a className="skip-link" href="#main">
        Lompat ke konten utama
      </a>
      <Header />
      <div className="page-shell">
        <View />
      </div>
      <Footer />
    </I18nProvider>
  );
}
