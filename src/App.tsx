import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { getArtistBySlug, getSongBySlug } from "./lib/api";
import { useRoute } from "./lib/router";
import AboutPage from "./pages/AboutPage";
import ArtistPage from "./pages/ArtistPage";
import ArtistsPage from "./pages/ArtistsPage";
import ChordPage from "./pages/ChordPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import { PrivacyPage, TermsPage } from "./pages/LegalPages";
import NotFoundPage from "./pages/NotFoundPage";
import SearchPage from "./pages/SearchPage";
import type { Artist, Song } from "./data/types";

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

  switch (route.name) {
    case "home":
      return <HomePage />;
    case "search":
      return <SearchPage />;
    case "artists":
      return <ArtistsPage />;
    case "artist": {
      if (artist === undefined) {
        return <div className="container" style={{ padding: "40px 0" }}>Memuat artis...</div>;
      }
      return artist ? <ArtistPage key={artist.slug} artist={artist} /> : <NotFoundPage />;
    }
    case "chord": {
      if (song === undefined) {
        return <div className="container" style={{ padding: "40px 0" }}>Memuat chord...</div>;
      }
      return song ? <ChordPage key={song.slug} song={song} /> : <NotFoundPage />;
    }
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactPage />;
    case "privacy":
      return <PrivacyPage />;
    case "terms":
      return <TermsPage />;
    default:
      return <NotFoundPage />;
  }
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Lompat ke konten utama
      </a>
      <Header />
      <View />
      <Footer />
    </>
  );
}
