import { useState } from "react";

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
      <button type="button" className="btn btn-sm" onClick={share} aria-label={`Bagikan ${title}`}>
        <span aria-hidden="true">↗</span> Bagikan
      </button>
      {message && (
        <span className="toast" role="status">
          {message}
        </span>
      )}
    </>
  );
}
