import { useState } from "react";
import { Share2 } from "lucide-react";

interface Props {
  title: string;
  text?: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const share = async () => {
    const link = url ?? window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: text ?? title, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setMessage("Tautan disalin");
    } catch {
      setMessage("Gagal membagikan");
    } finally {
      window.setTimeout(() => setMessage(null), 1800);
    }
  };

  const pin = () => {
    const link = url ?? window.location.href;
    // og:image halaman dipakai Pinterest otomatis; media kosong -> Pinterest ambil og:image
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&description=${encodeURIComponent(text ?? title)}`,
      "_blank",
      "noopener,noreferrer,width=750,height=550",
    );
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={share}
        aria-label={`Bagikan ${title}`}
        style={{ display: "grid", placeItems: "center" }}
      >
        <Share2 size={13} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-icon"
        onClick={pin}
        aria-label={`Pin ke Pinterest: ${title}`}
        title="Pin ke Pinterest"
        style={{ display: "grid", placeItems: "center" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.43 7.63 11.17-.11-.95-.2-2.41.04-3.44.22-.94 1.4-5.94 1.4-5.94s-.36-.72-.36-1.78c0-1.66.96-2.91 2.16-2.91 1.02 0 1.51.77 1.51 1.69 0 1.03-.65 2.57-.99 3.99-.28 1.19.6 2.16 1.78 2.16 2.14 0 3.78-2.25 3.78-5.51 0-2.88-2.07-4.9-5.03-4.9-3.42 0-5.43 2.57-5.43 5.22 0 1.03.4 2.14.89 2.75.1.12.11.22.08.34l-.33 1.36c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.89-2.43-4.65 0-3.78 2.75-7.26 7.92-7.26 4.16 0 7.39 2.97 7.39 6.93 0 4.14-2.6 7.46-6.22 7.46-1.21 0-2.36-.63-2.75-1.38l-.75 2.85c-.27 1.04-1 2.35-1.49 3.14C9.57 23.85 10.76 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z" />
        </svg>
      </button>
      {message && (
        <span className="toast" role="status">
          {message}
        </span>
      )}
    </>
  );
}
