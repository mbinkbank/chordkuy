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

function View() {
  const route = useRoute();

  switch (route.name) {
    case "home":
      return <HomePage />;
    case "search":
      return <SearchPage />;
    case "artists":
      return <ArtistsPage />;
    case "artist": {
      const artist = getArtistBySlug(route.params.slug);
      return artist ? <ArtistPage key={artist.slug} artist={artist} /> : <NotFoundPage />;
    }
    case "chord": {
      const song = getSongBySlug(route.params.slug);
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
