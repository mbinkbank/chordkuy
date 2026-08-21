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
      {message && (
        <span className="toast" role="status">
          {message}
        </span>
      )}
    </>
  );
}
