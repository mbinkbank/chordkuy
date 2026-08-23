import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, tbChord } from "../db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const email = "admin@chordku.com";
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await db.insert(users).values({
      email,
      password_hash: passwordHash,
      name: "Admin ChordKu",
      role: "admin",
    });
    console.log("✅ Admin user created: admin@chordku.com / admin123");
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  // Seed sample songs
  const sampleSongs = [
    {
      judul: "Amazing Grace",
      penyanyi: "Traditional",
      base_key: "G",
      album: "Hymns Collection",
      album_image: "",
      language: "English",
      songtype: "Worship",
      songwriter: "John Newton",
      year: "1779",
      youtube_url: "https://www.youtube.com/watch?v=CDdvReNKKuk",
      isi_chord: `[Intro]\nG    G7   C    G\n\n[Verse 1]\nG              G7\nAmazing grace how sweet the sound\nC          G\nThat saved a wretch like me\nG              Em\nI once was lost but now am found\nC          G\nWas blind but now I see`,
      lastmod: "2024-01-01 00:00:00",
    },
    {
      judul: "Hosanna",
      penyanyi: "Hillsong Worship",
      base_key: "E",
      album: "Mighty to Save",
      album_image: "",
      language: "English",
      songtype: "Praise",
      songwriter: "Brooke Fraser",
      year: "2006",
      youtube_url: "https://www.youtube.com/watch?v=MHsPMxrGJVE",
      isi_chord: `[Verse 1]\nE              A\nI see the King of glory\nE              A\nComing on the clouds with fire\nE              A\nThe whole earth shakes\n\n[Chorus]\nE    B    C#m  A\nHosanna, Hosanna\nE    B    A\nHosanna in the highest`,
      lastmod: "2024-01-02 00:00:00",
    },
    {
      judul: "Bapa Engkau Sungguh Baik",
      penyanyi: "GMS",
      base_key: "C",
      album: "Kemuliaan",
      album_image: "",
      language: "Indonesia",
      songtype: "Worship",
      songwriter: "GMS Worship",
      year: "2015",
      youtube_url: "",
      isi_chord: `[Verse 1]\nC          Em\nBapa Engkau sungguh baik\nAm         F\nKasih-Mu tiada berkesudahan\nC          Em\nKemurahan-Mu tak terbatas\nAm    G    C\nBagiku selama-lamanya\n\n[Chorus]\nF      C\nKunyanyikan kasih setia-Mu\nG          Am\nSeumur hidupku`,
      lastmod: "2024-01-03 00:00:00",
    },
    {
      judul: "Great is Thy Faithfulness",
      penyanyi: "Thomas Chisholm",
      base_key: "D",
      album: "Classic Hymns",
      album_image: "",
      language: "English",
      songtype: "Kidung",
      songwriter: "Thomas Chisholm",
      year: "1923",
      youtube_url: "",
      isi_chord: `[Verse 1]\nD              G    D\nGreat is Thy faithfulness O God my Father\nD                   A    E  A\nThere is no shadow of turning with Thee\n\n[Chorus]\nD       G      D\nGreat is Thy faithfulness\nD       A      D\nGreat is Thy faithfulness`,
      lastmod: "2024-01-04 00:00:00",
    },
    {
      judul: "Kau Sungguh Berarti",
      penyanyi: "True Worshippers",
      base_key: "Am",
      album: "Worship in Spirit",
      album_image: "",
      language: "Indonesia",
      songtype: "Worship",
      songwriter: "Sari Simorangkir",
      year: "2010",
      youtube_url: "",
      isi_chord: `[Verse 1]\nAm      F\nKau sungguh berarti bagiku\nC       G\nTak ada yang seperti-Mu\nAm      F\nKasih-Mu tak pernah berubah\nC    G    Am\nSelama-lamanya`,
      lastmod: "2024-01-05 00:00:00",
    },
  ];

  for (const song of sampleSongs) {
    const existing = await db
      .select()
      .from(tbChord)
      .where(eq(tbChord.judul, song.judul))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(tbChord).values(song);
      console.log(`✅ Song added: ${song.judul}`);
    }
  }

  console.log("✅ Seeding complete!");
  await pool.end();
}

seed().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});
